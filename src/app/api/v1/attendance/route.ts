import { AttendanceStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, parseWorkDate, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  workDate: z.string(),
  records: z.array(z.object({ internId: z.string().cuid(), status: z.nativeEnum(AttendanceStatus), note: z.string().trim().max(500).optional().or(z.literal("")) })).min(1).max(300),
});

export async function GET(request: Request) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const dateText = new URL(request.url).searchParams.get("date") ?? "";
  const workDate = parseWorkDate(dateText);
  if (!workDate) return apiError("Provide a valid date in YYYY-MM-DD format.");

  const [interns, records] = await Promise.all([
    prisma.user.findMany({ where: { role: UserRole.INTERN, status: "ACTIVE" }, select: { id: true, name: true, internCode: true, team: { select: { name: true } } }, orderBy: { name: "asc" } }),
    prisma.attendance.findMany({ where: { workDate }, select: { id: true, internId: true, status: true, note: true, markedAt: true } }),
  ]);
  return NextResponse.json({ interns, records });
}

export async function POST(request: Request) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const workDate = parseWorkDate(parsed.data.workDate);
  if (!workDate) return apiError("Provide a valid date in YYYY-MM-DD format.");

  const ids = parsed.data.records.map((record) => record.internId);
  if (new Set(ids).size !== ids.length) return apiError("Each intern can appear only once for a working date.");
  const activeCount = await prisma.user.count({ where: { id: { in: ids }, role: UserRole.INTERN, status: "ACTIVE" } });
  if (activeCount !== ids.length) return apiError("One or more selected interns are inactive or invalid.");

  const saved = await prisma.$transaction(parsed.data.records.map((record) => prisma.attendance.upsert({
    where: { internId_workDate: { internId: record.internId, workDate } },
    create: { internId: record.internId, workDate, status: record.status, note: record.note || null, markedById: session.userId },
    update: { status: record.status, note: record.note || null, markedById: session.userId, markedAt: new Date() },
  })));
  return NextResponse.json({ records: saved });
}
