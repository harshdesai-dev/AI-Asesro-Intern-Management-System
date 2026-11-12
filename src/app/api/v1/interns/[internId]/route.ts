import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  position: z.string().trim().max(80).nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  temporaryPassword: z.string().min(12).max(128).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ internId: string }> }) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const { internId } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.user.findFirst({ where: { id: internId, role: UserRole.INTERN }, select: { id: true } });
  if (!existing) return apiError("Intern not found.", 404);

  const data = parsed.data;
  const updated = await prisma.user.update({
    where: { id: internId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.status !== undefined ? { status: data.status, ...(data.status === UserStatus.INACTIVE ? { teamId: null } : {}) } : {}),
      ...(data.temporaryPassword ? { passwordHash: await hash(data.temporaryPassword, 12) } : {}),
    },
    select: { id: true, name: true, email: true, internCode: true, position: true, status: true },
  });
  return NextResponse.json({ intern: updated });
}
