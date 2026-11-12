import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole([UserRole.INTERN]);
  if (!session) return apiError("You are not authorized.", 403);
  const records = await prisma.meetingAttendance.findMany({
    where: { internId: session.userId },
    include: { meeting: { include: { team: { select: { name: true } } } } },
    orderBy: { meeting: { startsAt: "asc" } },
  });
  return NextResponse.json({ records });
}
