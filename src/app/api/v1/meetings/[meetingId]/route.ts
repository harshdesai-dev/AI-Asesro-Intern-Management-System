import { MeetingStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { apiError, readJson, validationError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.nativeEnum(MeetingStatus) });

export async function PATCH(request: Request, context: { params: Promise<{ meetingId: string }> }) {
  const session = await requireRole([UserRole.ADMIN]);
  if (!session) return apiError("You are not authorized.", 403);
  const { meetingId } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { id: true, status: true } });
  if (!meeting) return apiError("Meeting not found.", 404);
  if (meeting.status === MeetingStatus.CANCELLED && parsed.data.status !== MeetingStatus.CANCELLED) {
    return apiError("A cancelled meeting cannot be reopened in V1.", 409);
  }
  const updated = await prisma.meeting.update({ where: { id: meetingId }, data: { status: parsed.data.status }, select: { id: true, status: true } });
  return NextResponse.json({ meeting: updated });
}
