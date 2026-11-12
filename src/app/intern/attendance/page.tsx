"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { EmptyState, MetricCard, PageHeader, StatusPill } from "@/components/ui";

type RecordRow = { id: string; workDate: string; status: string; note: string | null; markedAt: string };
export default function MyAttendancePage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest<{ records: RecordRow[] }>("/api/v1/me/attendance").then((data) => setRecords(data.records)).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, []);
  const present = records.filter((record) => record.status === "PRESENT").length;
  const rate = records.length ? Math.round((present / records.length) * 100) : 0;
  return <><PageHeader eyebrow="PERSONAL RECORDS" title="My attendance" description="Your working-day attendance history. Attendance is marked and corrected by the Admin." />{error && <div className="alert alert-error">{error}</div>}<div className="metric-grid metric-grid-small"><MetricCard label="Recorded days" value={records.length} icon={<CalendarDays size={18} />} tone="blue" /><MetricCard label="Present days" value={present} icon={<ClipboardCheck size={18} />} tone="green" /><MetricCard label="Attendance rate" value={`${rate}%`} detail="Present / recorded days" icon={<ClipboardCheck size={18} />} tone="violet" /></div><section className="panel"><div className="panel-header"><div><h2>Attendance history</h2><p>Latest 120 working-day records</p></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Admin note</th><th>Last updated</th></tr></thead><tbody>{loading ? <tr><td colSpan={4}>Loading records…</td></tr> : records.length ? records.map((record) => <tr key={record.id}><td><strong>{formatDate(record.workDate)}</strong></td><td><StatusPill status={record.status} /></td><td>{record.note || "—"}</td><td>{formatDate(record.markedAt)}</td></tr>) : <tr><td colSpan={4}><EmptyState title="No attendance records yet" description="Your attendance history will appear after the Admin marks a working day." /></td></tr>}</tbody></table></div></section></>;
}
