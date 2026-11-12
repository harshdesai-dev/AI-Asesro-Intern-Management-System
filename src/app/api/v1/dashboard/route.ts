import { AssignmentStatus, AssignmentType, MeetingAttendanceStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

function indiaDateKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("You are not authorized.", 401);
  const today = new Date(`${indiaDateKey()}T00:00:00.000Z`);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (session.role === UserRole.ADMIN) {
    const [interns, teams, openAssignments, pendingReviews, todayAttendance, upcomingMeetings, recentAssignments] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.INTERN, status: "ACTIVE" } }),
      prisma.team.count({ where: { isActive: true } }),
      prisma.taskAssignment.count({ where: { status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS, AssignmentStatus.NEEDS_CHANGES] } } }),
      prisma.taskAssignment.count({ where: { status: AssignmentStatus.SUBMITTED } }),
      prisma.attendance.count({ where: { workDate: today } }),
      prisma.meeting.findMany({ where: { startsAt: { gte: new Date() }, status: "SCHEDULED" }, include: { _count: { select: { attendance: true } } }, orderBy: { startsAt: "asc" }, take: 4 }),
      prisma.taskAssignment.findMany({ include: { task: { select: { title: true } }, intern: { select: { name: true } }, team: { select: { name: true } }, teamLead: { select: { name: true } } }, orderBy: { assignedAt: "desc" }, take: 6 }),
    ]);
    return NextResponse.json({ role: session.role, metrics: { interns, teams, openAssignments, pendingReviews, todayAttendance }, upcomingMeetings, recentAssignments });
  }

  const assignmentWhere = { OR: [ { type: AssignmentType.INDIVIDUAL, internId: session.userId }, { type: AssignmentType.TEAM, members: { some: { internId: session.userId } } } ] };
  const [totalTasks, activeTasks, pendingReviews, attendanceCount, presentCount, upcomingMeetings, assignments] = await Promise.all([
    prisma.taskAssignment.count({ where: assignmentWhere }),
    prisma.taskAssignment.count({ where: { ...assignmentWhere, status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS, AssignmentStatus.NEEDS_CHANGES] } } }),
    prisma.taskAssignment.count({ where: { ...assignmentWhere, status: AssignmentStatus.SUBMITTED } }),
    prisma.attendance.count({ where: { internId: session.userId } }),
    prisma.attendance.count({ where: { internId: session.userId, status: "PRESENT" } }),
    prisma.meetingAttendance.findMany({ where: { internId: session.userId, meeting: { startsAt: { gte: new Date() }, status: "SCHEDULED" } }, include: { meeting: true }, orderBy: { meeting: { startsAt: "asc" } }, take: 4 }),
    prisma.taskAssignment.findMany({ where: assignmentWhere, include: { task: { select: { title: true, deadline: true, priority: true } }, team: { select: { name: true } }, teamLead: { select: { name: true } } }, orderBy: [{ status: "asc" }, { assignedAt: "desc" }], take: 6 }),
  ]);
  return NextResponse.json({
    role: session.role,
    metrics: { totalTasks, activeTasks, pendingReviews, attendanceRate: attendanceCount ? Math.round((presentCount / attendanceCount) * 100) : 0 },
    upcomingMeetings,
    assignments,
  });
}
