"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { PageHeader, EmptyState } from "@/components/ui";

type Intern = { id: string; name: string; internCode: string | null; team: { name: string } | null };
type RecordRow = { id: string; internId: string; status: string; note: string | null };
type Mark = { status: string; note: string };
const todayIndia = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function AttendancePage() {
  const [date, setDate] = useState(todayIndia());
  const [interns, setInterns] = useState<Intern[]>([]);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  async function load(selectedDate = date) {
    setLoading(true); setError("");
    try {
      const data = await apiRequest<{ interns: Intern[]; records: RecordRow[] }>(`/api/v1/attendance?date=${selectedDate}`);
      setInterns(data.interns);
      const next: Record<string, Mark> = {};
      data.records.forEach((record) => { next[record.internId] = { status: record.status, note: record.note ?? "" }; });
      setMarks(next);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load attendance."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(date); }, [date]);

  const filtered = useMemo(() => interns.filter((intern) => `${intern.name} ${intern.internCode ?? ""} ${intern.team?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())), [interns, search]);
  const markedCount = interns.filter((intern) => Boolean(marks[intern.id]?.status)).length;

  function setStatus(internId: string, status: string) { setMarks((current) => ({ ...current, [internId]: { status, note: current[internId]?.note ?? "" } })); }
  function markAll(status: string) { setMarks((current) => { const next = { ...current }; interns.forEach((intern) => { next[intern.id] = { status, note: next[intern.id]?.note ?? "" }; }); return next; }); }

  async function save() {
    setError(""); setSuccess(""); setSaving(true);
    const records = interns.filter((intern) => marks[intern.id]?.status).map((intern) => ({ internId: intern.id, status: marks[intern.id].status, note: marks[intern.id].note }));
    if (!records.length) { setError("Mark at least one intern before saving."); setSaving(false); return; }
    try { await apiRequest("/api/v1/attendance", { method: "POST", body: JSON.stringify({ workDate: date, records }) }); setSuccess(`Attendance saved for ${records.length} intern(s). Admins can correct records later.`); await load(date); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save attendance."); }
    finally { setSaving(false); }
  }

  return <>
    <PageHeader eyebrow="WORKING-DAY RECORDS" title="Daily attendance" description="Mark working-day attendance individually or in bulk. Only Admins can create or correct attendance records." />
    {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    <section className="panel attendance-toolbar"><div className="date-select"><CalendarDays size={17} /><label htmlFor="attendance-date">Working date</label><input id="attendance-date" type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="attendance-actions"><button className="button button-secondary" onClick={() => markAll("PRESENT")}>Mark all present</button><button className="button button-secondary" onClick={() => markAll("ABSENT")}>Mark all absent</button><button className="button button-primary" onClick={() => void save()} disabled={saving || !markedCount}><Save size={15} /> {saving ? "Saving…" : `Save ${markedCount} marked`}</button></div></section>
    <div className="toolbar"><div className="toolbar-left"><input className="search-input" placeholder="Search intern or team…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="toolbar-right"><span className="muted-count">{markedCount} / {interns.length} marked</span></div></div>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Intern</th><th>Team</th><th>Attendance status</th><th>Note (optional)</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={4}>Loading attendance…</td></tr> : filtered.length ? filtered.map((intern) => <tr key={intern.id}><td><strong>{intern.name}</strong><span className="table-sub">{intern.internCode ?? "No intern ID"}</span></td><td>{intern.team?.name ?? "Unassigned"}</td><td><select className="form-control attendance-select" value={marks[intern.id]?.status ?? ""} onChange={(e) => setStatus(intern.id, e.target.value)}><option value="">Not marked</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="HALF_DAY">Half day</option></select></td><td><input className="form-control note-input" placeholder="Add note" value={marks[intern.id]?.note ?? ""} onChange={(e) => setMarks((current) => ({ ...current, [intern.id]: { status: current[intern.id]?.status ?? "", note: e.target.value } }))} /></td></tr>) : <tr><td colSpan={4}><EmptyState title="No active interns" description="Create or reactivate intern accounts to mark attendance." /></td></tr>}
    </tbody></table></div></section>
  </>;
}
