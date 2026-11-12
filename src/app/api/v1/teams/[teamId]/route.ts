import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  internIds: z.array(z.string().cuid()).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ teamId: string }> }) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const { teamId } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  try {
    const team = await prisma.$transaction(async (tx) => {
      const existing = await tx.team.findUnique({ where: { id: teamId }, select: { id: true } });
      if (!existing) throw new Error("TEAM_NOT_FOUND");
      if (data.internIds) {
        const ids = [...new Set(data.internIds)];
        const users = await tx.user.findMany({ where: { id: { in: ids }, role: UserRole.INTERN, status: "ACTIVE" }, select: { id: true, teamId: true } });
        if (users.length !== ids.length) throw new Error("INVALID_INTERNS");
        if (users.some((user) => user.teamId && user.teamId !== teamId)) throw new Error("ALREADY_IN_TEAM");
        await tx.user.updateMany({ where: { teamId }, data: { teamId: null } });
        if (ids.length) await tx.user.updateMany({ where: { id: { in: ids } }, data: { teamId } });
      }
      await tx.team.update({ where: { id: teamId }, data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      } });
      if (data.isActive === false) await tx.user.updateMany({ where: { teamId }, data: { teamId: null } });
      return tx.team.findUniqueOrThrow({ where: { id: teamId }, include: { members: { select: { id: true, name: true, email: true, internCode: true } } } });
    });
    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof Error && error.message === "TEAM_NOT_FOUND") return apiError("Team not found.", 404);
    if (error instanceof Error && error.message === "INVALID_INTERNS") return apiError("One or more selected interns are invalid or inactive.", 400);
    if (error instanceof Error && error.message === "ALREADY_IN_TEAM") return apiError("An intern is already assigned to another team.", 409);
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return apiError("A team with this name already exists.", 409);
    throw error;
  }
}
