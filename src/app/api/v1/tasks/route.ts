import { AssignmentType, TaskPriority, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const targetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("INDIVIDUAL"), internIds: z.array(z.string().cuid()).min(1).max(100) }),
  z.object({ type: z.literal("TEAM"), teamId: z.string().cuid(), teamLeadId: z.string().cuid() }),
]);

const createSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(1).max(10000),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  deadline: z.string().datetime().nullable().optional(),
  targets: z.array(targetSchema).min(1).max(30),
});

const assignmentInclude = {
  intern: { select: { id: true, name: true, email: true, internCode: true } },
  team: { select: { id: true, name: true } },
  teamLead: { select: { id: true, name: true, internCode: true } },
  members: { include: { intern: { select: { id: true, name: true, internCode: true } } } },
} as const;

export async function GET() {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const tasks = await prisma.task.findMany({
    include: { createdBy: { select: { id: true, name: true } }, assignments: { include: assignmentInclude } },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const individualIds = parsed.data.targets.flatMap((target) => target.type === "INDIVIDUAL" ? target.internIds : []);
  if (new Set(individualIds).size !== individualIds.length) return apiError("An intern can only receive one individual assignment for this task.");
  const teamTargets = parsed.data.targets.filter((target) => target.type === "TEAM");
  if (new Set(teamTargets.map((target) => target.teamId)).size !== teamTargets.length) return apiError("A team can only receive this task once.");

  try {
    const task = await prisma.$transaction(async (tx) => {
      const interns = await tx.user.findMany({ where: { id: { in: individualIds }, role: UserRole.INTERN, status: "ACTIVE" }, select: { id: true } });
      if (interns.length !== individualIds.length) throw new Error("INVALID_INTERN");

      const teamIds = teamTargets.map((target) => target.teamId);
      const teams = await tx.team.findMany({ where: { id: { in: teamIds }, isActive: true }, select: { id: true } });
      if (teams.length !== teamIds.length) throw new Error("INVALID_TEAM");

      const createdTask = await tx.task.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          priority: parsed.data.priority,
          deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
          createdById: session.userId,
        },
      });

      for (const target of parsed.data.targets) {
        if (target.type === "INDIVIDUAL") {
          for (const internId of target.internIds) {
            await tx.taskAssignment.create({ data: { taskId: createdTask.id, type: AssignmentType.INDIVIDUAL, internId } });
          }
          continue;
        }

        const teamMembers = await tx.user.findMany({
          where: { teamId: target.teamId, role: UserRole.INTERN, status: "ACTIVE" },
          select: { id: true },
        });
        if (teamMembers.length === 0) throw new Error("EMPTY_TEAM");
        if (!teamMembers.some((member) => member.id === target.teamLeadId)) throw new Error("INVALID_TEAM_LEAD");

        const assignment = await tx.taskAssignment.create({
          data: { taskId: createdTask.id, type: AssignmentType.TEAM, teamId: target.teamId, teamLeadId: target.teamLeadId },
        });
        await tx.taskAssignmentMember.createMany({
          data: teamMembers.map((member) => ({ assignmentId: assignment.id, internId: member.id })),
        });
      }

      return tx.task.findUniqueOrThrow({
        where: { id: createdTask.id },
        include: { assignments: { include: assignmentInclude } },
      });
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_INTERN") return apiError("One or more selected interns are inactive or invalid.", 400);
      if (error.message === "INVALID_TEAM") return apiError("One or more selected teams are inactive or invalid.", 400);
      if (error.message === "EMPTY_TEAM") return apiError("A team must have at least one active intern before receiving a task.", 400);
      if (error.message === "INVALID_TEAM_LEAD") return apiError("The selected Team Lead must be an active member of the selected team.", 400);
    }
    throw error;
  }
}
