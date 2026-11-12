"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarPlus, CheckCheck, ExternalLink, Users } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";

type Intern = { id: string; name: string; internCode: string | null; status: string };
type Team = { id: string; name: string; members: Array<{ id: string; name: string }> };
type MeetingAttendance = { id: string; internId: string; status: string; intern: { id: string; name: string; internCode: string | null } };
type Meeting = { id: string; title: string; description: string | null; audience: string; status: string; startsAt: string; endsAt: string; meetingUrl: string | null; team: { id: string; name: string } | null; attendance: MeetingAttendance[] };

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, Record<string, string>>>({});
  const [form, setForm] = useState({ title: "", description: "", audience: "ALL_INTERNS", teamId: "", participantIds: [] as string[], startsAt: "", endsAt: "", meetingUrl: "" });

  async function load() {
    setLoading(true);
    try {
      const [meetingData, internData, teamData] = await Promise.all([apiRequest<{ meetings: Meeting[] }>("/api/v1/meetings"), apiRequest<{ interns: Intern[] }>("/api/v1/interns"), apiRequest<{ teams: Team[] }>("/api/v1/teams")]);
      setMeetings(meetingData.meetings); setInterns(internData.interns); setTeams(teamData.teams.filter((team) => team.members.length > 0));
      const drafts: Record<string, Record<string, string>> = {};
      meetingData.meetings.forEach((meeting) => { drafts[meeting.id] = Object.fromEntries(meeting.attendance.map((row) => [row.internId, row.status === "PENDING" ? "" : row.status])); });
      setAttendanceDraft(drafts);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load meetings."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      const body = { ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), teamId: form.audience === "TEAM" ? form.teamId : undefined, participantIds: form.audience === "SELECTED" ? form.participantIds : undefined };
      await apiRequest("/api/v1/meetings", { method: "POST", body: JSON.stringify(body) });
      setForm({ title: "", description: "", audience: "ALL_INTERNS", teamId: "", participantIds: [], startsAt: "", endsAt: "", meetingUrl: "" }); setShowForm(false); setSuccess("Meeting scheduled and participant attendance records created."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to schedule meeting."); }
    finally { setSaving(false); }
  }

  async function updateMeetingStatus(meeting: Meeting, status: "COMPLETED" | "CANCELLED") {
    setError(""); setSuccess("");
    try { await apiRequest(`/api/v1/meetings/${meeting.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setSuccess(status === "COMPLETED" ? "Meeting marked as completed." : "Meeting cancelled."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update meeting."); }
  }

  async function saveAttendance(meeting: Meeting) {
    setError(""); setSuccess("");
    const records = meeting.attendance.filter((row) => attendanceDraft[meeting.id]?.[row.internId]).map((row) => ({ internId: row.internId, status: attendanceDraft[meeting.id][row.internId] }));
    if (!records.length) { setError("Select an attendance status for at least one participant."); return; }
    try { await apiRequest(`/api/v1/meetings/${meeting.id}/attendance`, { method: "PATCH", body: JSON.stringify({ records }) }); setSuccess(`Meeting attendance saved for ${records.length} participant(s).`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save meeting attendance."); }
  }

  return <>
    <PageHeader eyebrow="MEETING COORDINATION" title="Meetings" description="Schedule a meeting for all active interns, one team or selected interns. Meeting attendance is tracked separately from working-day attendance." action={<button className="button button-primary" onClick={() => setShowForm((value) => !value)}><CalendarPlus size={16} /> Schedule meeting</button>} />
    {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    {showForm && <section className="panel form-panel"><h2>Schedule a meeting</h2><p>Participant rows are created at scheduling time. You can mark each participant present, absent or late after the meeting.</p><form onSubmit={createMeeting}><div className="form-grid">
      <div className="form-field form-field-wide"><label htmlFor="meeting-title">Meeting title *</label><input id="meeting-title" className="form-control" minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div className="form-field form-field-wide"><label htmlFor="meeting-description">Description / agenda</label><textarea id="meeting-description" className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="form-field"><label htmlFor="meeting-audience">Participants</label><select id="meeting-audience" className="form-control" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value, teamId: "", participantIds: [] })}><option value="ALL_INTERNS">All active interns</option><option value="TEAM">One team</option><option value="SELECTED">Selected interns</option></select></div>
      {form.audience === "TEAM" && <div className="form-field"><label htmlFor="meeting-team">Select team *</label><select id="meeting-team" className="form-control" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} required><option value="">Choose team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>}
      {form.audience === "SELECTED" && <div className="form-field"><label htmlFor="meeting-interns">Select interns *</label><select id="meeting-interns" className="form-control" multiple value={form.participantIds} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, participantIds: Array.from(e.target.selectedOptions).map((option: HTMLOptionElement) => option.value) })}>{interns.filter((intern) => intern.status === "ACTIVE").map((intern) => <option key={intern.id} value={intern.id}>{intern.name}{intern.internCode ? ` · ${intern.internCode}` : ""}</option>)}</select><span className="form-hint">Hold Ctrl / Command to select multiple interns.</span></div>}
      <div className="form-field"><label htmlFor="meeting-start">Start date & time *</label><input id="meeting-start" type="datetime-local" className="form-control" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required /></div>
      <div className="form-field"><label htmlFor="meeting-end">End date & time *</label><input id="meeting-end" type="datetime-local" className="form-control" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required /></div>
      <div className="form-field form-field-wide"><label htmlFor="meeting-url">Meeting link (optional)</label><input id="meeting-url" className="form-control" type="url" placeholder="https://meet.google.com/..." value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} /></div>
    </div><div className="form-footer"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={saving || (form.audience === "TEAM" && !form.teamId) || (form.audience === "SELECTED" && !form.participantIds.length)}>{saving ? "Scheduling…" : "Schedule meeting"}</button></div></form></section>}
    {loading ? <div className="panel empty-state">Loading meetings…</div> : meetings.length ? <div className="meeting-grid">{meetings.map((meeting) => <section className="panel meeting-card" key={meeting.id}><div className="meeting-card-head"><div><div className="eyebrow">{meeting.audience.replaceAll("_", " ")}</div><h2>{meeting.title}</h2></div><StatusPill status={meeting.status} /></div>{meeting.description && <p className="meeting-description">{meeting.description}</p>}<div className="task-card-meta"><span>{formatDateTime(meeting.startsAt)} – {formatDateTime(meeting.endsAt)}</span><span>{meeting.team?.name ?? (meeting.audience === "ALL_INTERNS" ? "All active interns" : "Selected interns")}</span><span>{meeting.attendance.length} participants</span></div>{meeting.meetingUrl && <a className="meeting-link" href={meeting.meetingUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Open meeting link</a>}<div className="meeting-status-actions">{meeting.status === "SCHEDULED" && <><button className="text-button" onClick={() => void updateMeetingStatus(meeting, "COMPLETED")}>Mark completed</button><button className="text-button danger-text" onClick={() => void updateMeetingStatus(meeting, "CANCELLED")}>Cancel meeting</button></>}</div><div className="meeting-attendance"><div className="meeting-attendance-head"><strong><Users size={14} /> Participant attendance</strong><span>{meeting.attendance.filter((row) => row.status !== "PENDING").length}/{meeting.attendance.length} marked</span></div>{meeting.attendance.map((row) => <div className="meeting-attendee" key={row.id}><div className="list-copy"><strong>{row.intern.name}</strong><small>{row.intern.internCode ?? "Intern"}</small></div><select className="form-control meeting-status-select" value={attendanceDraft[meeting.id]?.[row.internId] ?? ""} onChange={(e) => setAttendanceDraft((current) => ({ ...current, [meeting.id]: { ...current[meeting.id], [row.internId]: e.target.value } }))}><option value="">Not marked</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option></select></div>)}<div className="form-footer"><button className="button button-primary" onClick={() => void saveAttendance(meeting)}><CheckCheck size={14} /> Save attendance</button></div></div></section>)}</div> : <section className="panel"><EmptyState title="No meetings scheduled" description="Create a meeting and select who should attend." /></section>}
  </>;
}
