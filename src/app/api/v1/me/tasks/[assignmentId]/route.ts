import { AssignmentStatus, AssignmentType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, isHttpUrl, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("START") }),
  z.object({ action: z.literal("SUBMIT"), submissionUrl: z.string().trim().url().max(2048), submissionNote: z.string().trim().max(5000).optional().or(z.literal("")) }),
]);

export async function PATCH(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await requireRole([UserRole.INTERN]);
  if (!session) return apiError("You are not authorized.", 403);
  const { assignmentId } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { members: { select: { internId: true } } },
  });
  if (!assignment) return apiError("Task assignment not found.", 404);

  const isIndividualAssignee = assignment.type === AssignmentType.INDIVIDUAL && assignment.internId === session.userId;
  const isTeamMember = assignment.type === AssignmentType.TEAM && assignment.members.some((member) => member.internId === session.userId);
  if (!isIndividualAssignee && !isTeamMember) return apiError("You are not assigned to this task.", 403);

  if (parsed.data.action === "START") {
    if (assignment.status !== AssignmentStatus.ASSIGNED) return apiError("This task cannot be started in its current status.", 409);
    const updated = await prisma.taskAssignment.update({ where: { id: assignmentId }, data: { status: AssignmentStatus.IN_PROGRESS } });
    return NextResponse.json({ assignment: { id: updated.id, status: updated.status } });
  }

  const canSubmit = assignment.type === AssignmentType.INDIVIDUAL
    ? isIndividualAssignee
    : assignment.teamLeadId === session.userId;
  if (!canSubmit) return apiError("Only the designated Team Lead can submit the common team work.", 403);
  if (assignment.status === AssignmentStatus.APPROVED || assignment.status === AssignmentStatus.CANCELLED) {
    return apiError("This assignment is closed and cannot accept another submission.", 409);
  }
  if (!isHttpUrl(parsed.data.submissionUrl)) return apiError("Submission link must use HTTP or HTTPS.");

  const updated = await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: {
      status: AssignmentStatus.SUBMITTED,
      submissionUrl: parsed.data.submissionUrl,
      submissionNote: parsed.data.submissionNote || null,
      submittedAt: new Date(),
      reviewedById: null,
      reviewFeedback: null,
      reviewedAt: null,
    },
    select: { id: true, status: true, submissionUrl: true, submissionNote: true, submittedAt: true },
  });
  return NextResponse.json({ assignment: updated });
}
