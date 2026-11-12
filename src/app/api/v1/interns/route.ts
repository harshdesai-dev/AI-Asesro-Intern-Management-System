import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  internCode: z.string().trim().max(30).optional().or(z.literal("")),
  position: z.string().trim().max(80).optional().or(z.literal("")),
  temporaryPassword: z.string().min(12).max(128),
});

export async function GET() {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);

  const interns = await prisma.user.findMany({
    where: { role: UserRole.INTERN },
    select: { id: true, name: true, email: true, internCode: true, position: true, status: true, team: { select: { id: true, name: true } }, createdAt: true },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ interns });
}

export async function POST(request: Request) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);

  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;
  const passwordHash = await hash(data.temporaryPassword, 12);
  try {
    const intern = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        internCode: data.internCode || null,
        position: data.position || null,
        passwordHash,
        role: UserRole.INTERN,
      },
      select: { id: true, name: true, email: true, internCode: true, position: true, status: true },
    });
    return NextResponse.json({ intern }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return apiError("An intern with this email or intern code already exists.", 409);
    }
    throw error;
  }
}
