"use client";

import { useEffect, useState } from "react";
import { Activity, CalendarClock, CheckCheck, ClipboardCheck, Clock3, Users, UsersRound, ListTodo, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDateTime } from "@/lib/format";
import { EmptyState, MetricCard, PageHeader, StatusPill } from "@/components/ui";

type MeetingRow = { id: string; title?: string; startsAt?: string; meeting?: { title: string; startsAt: string }; team?: { name: string } | null; status?: string };
type AssignmentRow = { id: string; status: string; task: { title: string; deadline?: string | null; priority?: string }; intern?: { name: string } | null; team?: { name: string } | null; teamLead?: { name: string } | null };
type DashboardData = {
  role: "ADMIN" | "INTERN";
  metrics: Record<string, number>;
  upcomingMeetings?: MeetingRow[];
  recentAssignments?: AssignmentRow[];
  assignments?: AssignmentRow[];
};

export function Overview({ role, name }: { role: "ADMIN" | "INTERN"; name: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<DashboardData>("/api/v1/dashboard").then(setData).catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics;
  const meetings = data?.upcomingMeetings ?? [];
  const assignments = role === "ADMIN" ? data?.recentAssignments ?? [] : data?.assignments ?? [];

  return <>
    <PageHeader eyebrow={role === "ADMIN" ? "ADMIN CONTROL CENTER" : "YOUR INTERNSHIP SPACE"} title={role === "ADMIN" ? `Welcome, ${name.split(" ")[0]}.` : `Hello, ${name.split(" ")[0]}.`} description={role === "ADMIN" ? "A clear view of your interns, assignments and upcoming coordination." : "Your assigned work, upcoming meetings and internship activity in one place."} />
    {error && <div className="alert alert-error">{error}</div>}
    {loading ? <div className="panel empty-state"><span className="empty-mark"><Activity size={16} /></span><strong>Loading workspace data…</strong></div> : role === "ADMIN" ? <>
      <div className="metric-grid">
        <MetricCard label="Active interns" value={metrics?.interns ?? 0} detail="Currently active accounts" icon={<Users size={18} />} tone="blue" />
        <MetricCard label="Active teams" value={metrics?.teams ?? 0} detail="Current team groups" icon={<UsersRound size={18} />} tone="violet" />
        <MetricCard label="Open assignments" value={metrics?.openAssignments ?? 0} detail="Assigned or in progress" icon={<ListTodo size={18} />} tone="amber" />
        <MetricCard label="Awaiting review" value={metrics?.pendingReviews ?? 0} detail="Submitted work to review" icon={<CheckCheck size={18} />} tone="green" />
      </div>
      <div className="content-grid">
        <section className="panel"><div className="panel-header"><div><h2>Recent assignments</h2><p>Latest work assigned across interns and teams</p></div></div><div className="panel-body list-stack">
          {assignments.length ? assignments.map((item) => <div className="list-row" key={item.id}><span className="metric-icon metric-blue"><ListTodo size={16} /></span><div className="list-copy"><strong>{item.task.title}</strong><small>{item.team ? `Team · ${item.team.name} · TL ${item.teamLead?.name ?? "Not set"}` : `Individual · ${item.intern?.name ?? "Intern"}`}</small></div><StatusPill status={item.status} /></div>) : <EmptyState title="No assignments yet" description="Create a task and assign it to an intern or team to get started." />}
        </div></section>
        <section className="panel"><div className="panel-header"><div><h2>Upcoming meetings</h2><p>Scheduled team and intern sessions</p></div><CalendarClock size={17} color="#69c9e8" /></div><div className="panel-body list-stack">
          {meetings.length ? meetings.map((meeting) => <div className="list-row" key={meeting.id}><span className="metric-icon metric-violet"><CalendarClock size={16} /></span><div className="list-copy"><strong>{meeting.title ?? meeting.meeting?.title}</strong><small>{formatDateTime(meeting.startsAt ?? meeting.meeting?.startsAt)}{meeting.team?.name ? ` · ${meeting.team.name}` : ""}</small></div></div>) : <EmptyState title="No upcoming meetings" description="Scheduled meetings will appear here." />}
        </div></section>
      </div>
    </> : <>
      <div className="metric-grid">
        <MetricCard label="Total tasks" value={metrics?.totalTasks ?? 0} detail="Tasks assigned to you" icon={<ListTodo size={18} />} tone="blue" />
        <MetricCard label="Active tasks" value={metrics?.activeTasks ?? 0} detail="Work still in progress" icon={<Clock3 size={18} />} tone="amber" />
        <MetricCard label="Awaiting review" value={metrics?.pendingReviews ?? 0} detail="Submitted for admin review" icon={<ShieldCheck size={18} />} tone="violet" />
        <MetricCard label="Attendance rate" value={`${metrics?.attendanceRate ?? 0}%`} detail="Based on recorded days" icon={<ClipboardCheck size={18} />} tone="green" />
      </div>
      <div className="content-grid">
        <section className="panel"><div className="panel-header"><div><h2>Your tasks</h2><p>Tasks assigned to you or your team</p></div></div><div className="panel-body list-stack">
          {assignments.length ? assignments.map((item) => <div className="list-row" key={item.id}><span className="metric-icon metric-blue"><ListTodo size={16} /></span><div className="list-copy"><strong>{item.task.title}</strong><small>{item.team ? `Team · ${item.team.name} · TL ${item.teamLead?.name ?? "—"}` : `Individual assignment`}{item.task.deadline ? ` · Due ${formatDateTime(item.task.deadline)}` : ""}</small></div><StatusPill status={item.status} /></div>) : <EmptyState title="No tasks assigned" description="Your admin will add tasks here when work is assigned." />}
        </div></section>
        <section className="panel"><div className="panel-header"><div><h2>Upcoming meetings</h2><p>Your scheduled sessions</p></div><CalendarClock size={17} color="#69c9e8" /></div><div className="panel-body list-stack">
          {meetings.length ? meetings.map((row) => <div className="list-row" key={row.id}><span className="metric-icon metric-violet"><CalendarClock size={16} /></span><div className="list-copy"><strong>{row.meeting?.title ?? row.title}</strong><small>{formatDateTime(row.meeting?.startsAt ?? row.startsAt)}</small></div><StatusPill status={row.status ?? "PENDING"} /></div>) : <EmptyState title="No upcoming meetings" description="Your meeting schedule will appear here." />}
        </div></section>
      </div>
    </>}
  </>;
}
