import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  internIds: z.array(z.string().cuid()).max(100).default([]),
});

export async function GET() {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const teams = await prisma.team.findMany({
    include: { members: { where: { role: UserRole.INTERN, status: "ACTIVE" }, select: { id: true, name: true, email: true, internCode: true } }, _count: { select: { assignments: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ teams });
}

export async function POST(request: Request) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const ids = [...new Set(parsed.data.internIds)];
  try {
    const team = await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({ where: { id: { in: ids }, role: UserRole.INTERN, status: "ACTIVE" }, select: { id: true, teamId: true } });
      if (users.length !== ids.length) throw new Error("INVALID_INTERNS");
      if (users.some((user) => user.teamId)) throw new Error("ALREADY_IN_TEAM");
      const created = await tx.team.create({ data: { name: parsed.data.name, description: parsed.data.description || null } });
      if (ids.length) await tx.user.updateMany({ where: { id: { in: ids } }, data: { teamId: created.id } });
      return tx.team.findUniqueOrThrow({ where: { id: created.id }, include: { members: { select: { id: true, name: true, email: true, internCode: true } } } });
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_INTERNS") return apiError("One or more selected interns are invalid or inactive.", 400);
    if (error instanceof Error && error.message === "ALREADY_IN_TEAM") return apiError("Each intern can belong to one active team at a time. Remove them from their current team first.", 409);
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return apiError("A team with this name already exists.", 409);
    throw error;
  }
}
