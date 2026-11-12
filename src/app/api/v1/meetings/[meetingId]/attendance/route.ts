import { MeetingAttendanceStatus, MeetingStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  records: z.array(z.object({ internId: z.string().cuid(), status: z.nativeEnum(MeetingAttendanceStatus).refine((status) => status !== MeetingAttendanceStatus.PENDING) })).min(1).max(300),
});

export async function PATCH(request: Request, context: { params: Promise<{ meetingId: string }> }) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const { meetingId } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const ids = parsed.data.records.map((record) => record.internId);
  if (new Set(ids).size !== ids.length) return apiError("Each participant can appear only once.");

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { id: true, status: true } });
  if (!meeting) return apiError("Meeting not found.", 404);
  if (meeting.status === MeetingStatus.CANCELLED) return apiError("Cancelled meetings cannot have attendance marked.", 409);

  const participantCount = await prisma.meetingAttendance.count({ where: { meetingId, internId: { in: ids } } });
  if (participantCount !== ids.length) return apiError("One or more interns are not participants in this meeting.", 400);

  const saved = await prisma.$transaction(parsed.data.records.map((record) => prisma.meetingAttendance.update({
    where: { meetingId_internId: { meetingId, internId: record.internId } },
    data: { status: record.status, markedById: session.userId, markedAt: new Date() },
  })));
  return NextResponse.json({ records: saved });
}
