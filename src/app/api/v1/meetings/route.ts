
import { MeetingAudience, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, isHttpUrl, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  audience: z.nativeEnum(MeetingAudience),
  teamId: z.string().cuid().optional(),
  participantIds: z.array(z.string().cuid()).max(300).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  meetingUrl: z.string().trim().max(2048).optional().or(z.literal("")),
})
  .refine(
    (data) => new Date(data.endsAt) > new Date(data.startsAt),
    {
      message: "Meeting end must be after meeting start.",
      path: ["endsAt"],
    }
  )
  .refine(
    (data) =>
      data.audience === MeetingAudience.TEAM
        ? Boolean(data.teamId)
        : !data.teamId,
    {
      message: "Select a team only for a team meeting.",
      path: ["teamId"],
    }
  )
  .refine(
    (data) =>
      data.audience === MeetingAudience.SELECTED
        ? Boolean(data.participantIds?.length)
        : !data.participantIds?.length,
    {
      message:
        "Select participants only for a selected-participants meeting.",
      path: ["participantIds"],
    }
  );

export async function GET() {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);

  const meetings = await prisma.meeting.findMany({
    include: {
      team: {
        select: { id: true, name: true },
      },
      attendance: {
        include: {
          intern: {
            select: {
              id: true,
              name: true,
              internCode: true,
            },
          },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });

  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;

  if (data.meetingUrl && !isHttpUrl(data.meetingUrl)) {
    return apiError("Meeting link must use HTTP or HTTPS.");
  }

  try {
    const meeting = await prisma.$transaction(async (tx) => {
      let participantIds: string[] = [];

      if (data.audience === MeetingAudience.ALL_INTERNS) {
        const interns = await tx.user.findMany({
          where: {
            role: UserRole.INTERN,
            status: "ACTIVE",
          },
          select: { id: true },
        });

        participantIds = interns.map((intern) => intern.id);
      } else if (data.audience === MeetingAudience.TEAM) {
        const team = await tx.team.findFirst({
          where: {
            id: data.teamId,
            isActive: true,
          },
          select: { id: true },
        });

        if (!team) throw new Error("INVALID_TEAM");

        const interns = await tx.user.findMany({
          where: {
            teamId: team.id,
            role: UserRole.INTERN,
            status: "ACTIVE",
          },
          select: { id: true },
        });

        participantIds = interns.map((intern) => intern.id);
      } else {
        participantIds = [...new Set<string>(data.participantIds ?? [])];

        const count = await tx.user.count({
          where: {
            id: { in: participantIds },
            role: UserRole.INTERN,
            status: "ACTIVE",
          },
        });

        if (count !== participantIds.length) {
          throw new Error("INVALID_PARTICIPANT");
        }
      }

      if (participantIds.length === 0) {
        throw new Error("NO_PARTICIPANTS");
      }

      const created = await tx.meeting.create({
        data: {
          title: data.title,
          description: data.description || null,
          audience: data.audience,
          teamId: data.teamId || null,
          startsAt: new Date(data.startsAt),
          endsAt: new Date(data.endsAt),
          meetingUrl: data.meetingUrl || null,
          createdById: session.userId,
          attendance: {
            create: participantIds.map((internId) => ({ internId })),
          },
        },
        include: {
          team: {
            select: { id: true, name: true },
          },
          attendance: {
            include: {
              intern: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      return created;
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TEAM") {
      return apiError("Selected team is inactive or unavailable.", 400);
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_PARTICIPANT"
    ) {
      return apiError(
        "One or more selected participants are inactive or invalid.",
        400
      );
    }

    if (error instanceof Error && error.message === "NO_PARTICIPANTS") {
      return apiError("This meeting has no active participants.", 400);
    }

    throw error;
  }
}
