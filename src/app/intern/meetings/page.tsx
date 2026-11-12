"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";

type RecordRow = { id: string; status: string; meeting: { id: string; title: string; description: string | null; startsAt: string; endsAt: string; meetingUrl: string | null; status: string; team: { name: string } | null } };
export default function MyMeetingsPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest<{ records: RecordRow[] }>("/api/v1/me/meetings").then((data) => setRecords(data.records)).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, []);
  return <><PageHeader eyebrow="SCHEDULE & COORDINATION" title="Meetings" description="Meetings scheduled for you or your team. Your attendance status is recorded separately from daily attendance." />{error && <div className="alert alert-error">{error}</div>}{loading ? <div className="panel empty-state">Loading meetings…</div> : records.length ? <div className="meeting-grid">{records.map((record) => <article className="panel meeting-card" key={record.id}><div className="meeting-card-head"><div><div className="eyebrow">{record.meeting.team?.name ?? "ASESRO MEETING"}</div><h2>{record.meeting.title}</h2></div><StatusPill status={record.status} /></div>{record.meeting.description && <p className="meeting-description">{record.meeting.description}</p>}<div className="task-card-meta"><span><CalendarClock size={13} /> {formatDateTime(record.meeting.startsAt)} – {formatDateTime(record.meeting.endsAt)}</span><span>Meeting status: {record.meeting.status.toLowerCase()}</span></div>{record.meeting.meetingUrl && <a className="meeting-link" href={record.meeting.meetingUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Join meeting</a>}</article>)}</div> : <section className="panel"><EmptyState title="No meetings scheduled" description="When your Admin schedules a meeting for you, it will appear here." /></section>}</>;
}
