import { AssignmentStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum([AssignmentStatus.APPROVED, AssignmentStatus.NEEDS_CHANGES]),
  feedback: z.string().trim().max(5000).optional().or(z.literal("")),
});

export async function PATCH(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const { assignmentId } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const assignment = await prisma.taskAssignment.findUnique({ where: { id: assignmentId }, select: { id: true, status: true } });
  if (!assignment) return apiError("Task assignment not found.", 404);
  if (assignment.status !== AssignmentStatus.SUBMITTED) return apiError("Only submitted work can be reviewed.", 409);

  const updated = await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: {
      status: parsed.data.status,
      reviewFeedback: parsed.data.feedback || null,
      reviewedById: session.userId,
      reviewedAt: new Date(),
    },
    select: { id: true, status: true, reviewFeedback: true, reviewedAt: true },
  });
  return NextResponse.json({ assignment: updated });
}
