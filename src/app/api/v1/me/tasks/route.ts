import { AssignmentType, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole([UserRole.INTERN]);
  if (!session) return apiError("You are not authorized.", 403);

  const assignments = await prisma.taskAssignment.findMany({
    where: {
      OR: [
        { type: AssignmentType.INDIVIDUAL, internId: session.userId },
        { type: AssignmentType.TEAM, members: { some: { internId: session.userId } } },
      ],
    },
    include: {
      task: { select: { id: true, title: true, description: true, priority: true, deadline: true, createdAt: true } },
      team: { select: { id: true, name: true } },
      teamLead: { select: { id: true, name: true, internCode: true } },
      intern: { select: { id: true, name: true } },
      members: { include: { intern: { select: { id: true, name: true, internCode: true } } } },
    },
    orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
  });
  return NextResponse.json({ assignments });
}
