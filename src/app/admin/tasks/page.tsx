"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, CheckCheck } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";

type Intern = { id: string; name: string; email: string; internCode: string | null; status: string };
type Team = { id: string; name: string; members: Array<{ id: string; name: string; internCode: string | null }> };
type Assignment = { id: string; type: "INDIVIDUAL" | "TEAM"; status: string; intern: { id: string; name: string; internCode: string | null } | null; team: { id: string; name: string } | null; teamLead: { id: string; name: string; internCode: string | null } | null; members: Array<{ intern: { id: string; name: string; internCode: string | null } }>; submissionUrl: string | null; submissionNote: string | null; submittedAt: string | null; reviewFeedback: string | null };
type Task = { id: string; title: string; description: string; priority: string; deadline: string | null; createdAt: string; assignments: Assignment[] };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [type, setType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", deadline: "" });
  const [internIds, setInternIds] = useState<string[]>([]);
  const [teamId, setTeamId] = useState("");
  const [teamLeadId, setTeamLeadId] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [taskData, internData, teamData] = await Promise.all([apiRequest<{ tasks: Task[] }>("/api/v1/tasks"), apiRequest<{ interns: Intern[] }>("/api/v1/interns"), apiRequest<{ teams: Team[] }>("/api/v1/teams")]);
      setTasks(taskData.tasks); setInterns(internData.interns); setTeams(teamData.teams.filter((team) => team.members.length > 0));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load tasks."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const selectedTeam = teams.find((team) => team.id === teamId);
  const activeInterns = interns.filter((intern) => intern.status === "ACTIVE");
  const filteredTasks = useMemo(() => tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    const target = type === "INDIVIDUAL" ? { type, internIds } : { type, teamId, teamLeadId };
    try {
      await apiRequest("/api/v1/tasks", { method: "POST", body: JSON.stringify({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null, targets: [target] }) });
      setForm({ title: "", description: "", priority: "MEDIUM", deadline: "" }); setInternIds([]); setTeamId(""); setTeamLeadId(""); setShowForm(false); setSuccess("Task created and assigned. Team membership was captured for this assignment."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create task."); }
    finally { setSaving(false); }
  }

  async function review(assignmentId: string, status: "APPROVED" | "NEEDS_CHANGES") {
    setError(""); setSuccess("");
    try {
      await apiRequest(`/api/v1/tasks/assignments/${assignmentId}/review`, { method: "PATCH", body: JSON.stringify({ status, feedback: reviewFeedback[assignmentId] ?? "" }) });
      setSuccess(status === "APPROVED" ? "Submission approved." : "Feedback sent. The assigned intern or Team Lead can resubmit."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to review submission."); }
  }

  return <>
    <PageHeader eyebrow="WORK MANAGEMENT" title="Task management" description="Create individual work or shared team projects. Every team assignment gets its own Team Lead and a fixed assignment-time member list." action={<button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Create task</button>} />
    {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    {showForm && <section className="panel form-panel"><h2>Create and assign a task</h2><p>One task can be assigned to selected interns or one team. For a team task, choose the Team Lead from that team&apos;s active members.</p><form onSubmit={createTask}>
      <div className="form-grid">
        <div className="form-field form-field-wide"><label htmlFor="task-title">Task / project title *</label><input id="task-title" className="form-control" minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="form-field form-field-wide"><label htmlFor="task-description">Description and expected outcome *</label><textarea id="task-description" className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
        <div className="form-field"><label htmlFor="task-priority">Priority</label><select id="task-priority" className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
        <div className="form-field"><label htmlFor="task-deadline">Deadline</label><input id="task-deadline" className="form-control" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
        <div className="form-field"><label htmlFor="assignment-type">Assignment type</label><select id="assignment-type" className="form-control" value={type} onChange={(e) => { setType(e.target.value as "INDIVIDUAL" | "TEAM"); setInternIds([]); setTeamId(""); setTeamLeadId(""); }}><option value="INDIVIDUAL">Individual interns</option><option value="TEAM">Entire team</option></select></div>
        {type === "INDIVIDUAL" ? <div className="form-field"><label htmlFor="task-interns">Select intern(s) *</label><select id="task-interns" className="form-control" multiple value={internIds} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInternIds(Array.from(e.target.selectedOptions).map((option: HTMLOptionElement) => option.value))}>{activeInterns.map((intern) => <option key={intern.id} value={intern.id}>{intern.name}{intern.internCode ? ` · ${intern.internCode}` : ""}</option>)}</select><span className="form-hint">Hold Ctrl / Command to select multiple interns. Each intern gets a separate assignment and submission.</span></div> : <>
          <div className="form-field"><label htmlFor="task-team">Select team *</label><select id="task-team" className="form-control" value={teamId} onChange={(e) => { setTeamId(e.target.value); setTeamLeadId(""); }} required><option value="">Choose a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} ({team.members.length} members)</option>)}</select></div>
          <div className="form-field"><label htmlFor="task-tl">Responsible Team Lead *</label><select id="task-tl" className="form-control" value={teamLeadId} onChange={(e) => setTeamLeadId(e.target.value)} required disabled={!selectedTeam}><option value="">Choose TL from selected team</option>{selectedTeam?.members.map((member) => <option key={member.id} value={member.id}>{member.name}{member.internCode ? ` · ${member.internCode}` : ""}</option>)}</select><span className="form-hint">The TL is selected for this assignment only, not permanently for the team.</span></div>
        </>}
      </div>
      <div className="form-footer"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={saving || (type === "INDIVIDUAL" ? internIds.length === 0 : !teamId || !teamLeadId)}>{saving ? "Creating…" : "Create and assign"}</button></div>
    </form></section>}
    <div className="toolbar"><div className="toolbar-left"><input className="search-input" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="toolbar-right"><span className="muted-count">{tasks.length} tasks · {tasks.reduce((sum, task) => sum + task.assignments.length, 0)} assignments</span></div></div>
    {loading ? <div className="panel empty-state">Loading tasks…</div> : filteredTasks.length ? <div className="task-grid">{filteredTasks.map((task) => <section className="panel task-card" key={task.id}><div className="task-card-top"><div><div className="eyebrow">{task.priority} PRIORITY</div><h3>{task.title}</h3></div><span className="list-meta">{task.deadline ? `Due ${formatDate(task.deadline)}` : "No deadline"}</span></div><p>{task.description}</p><div className="task-card-meta"><span>{task.assignments.length} assignment(s)</span><span>Created {formatDate(task.createdAt)}</span></div><div className="assignment-list">{task.assignments.map((assignment) => <div className="assignment-row" key={assignment.id}><div className="assignment-summary"><div className="list-copy"><strong>{assignment.team ? `Team · ${assignment.team.name}` : `Individual · ${assignment.intern?.name ?? "Intern"}`}</strong><small>{assignment.team ? `TL: ${assignment.teamLead?.name ?? "—"} · ${assignment.members.length} members captured` : assignment.intern?.internCode ?? "Individual submission"}</small></div><StatusPill status={assignment.status} /></div>{assignment.status === "SUBMITTED" ? <div className="review-box"><div className="submission-link"><a href={assignment.submissionUrl ?? "#"} target="_blank" rel="noreferrer">Open submission ↗</a><span>{assignment.submittedAt ? formatDateTime(assignment.submittedAt) : "Submitted"}</span></div>{assignment.submissionNote && <p className="review-note">{assignment.submissionNote}</p>}<textarea className="form-control review-feedback" placeholder="Optional feedback for the intern / Team Lead…" value={reviewFeedback[assignment.id] ?? ""} onChange={(e) => setReviewFeedback({ ...reviewFeedback, [assignment.id]: e.target.value })} /><div className="review-actions"><button className="button button-secondary" onClick={() => void review(assignment.id, "NEEDS_CHANGES")}>Request changes</button><button className="button button-primary" onClick={() => void review(assignment.id, "APPROVED")}><CheckCheck size={14} /> Approve</button></div></div> : assignment.reviewFeedback ? <div className="review-note">Latest feedback: {assignment.reviewFeedback}</div> : null}</div>)}</div></section>)}</div> : <section className="panel"><EmptyState title="No tasks created" description="Create your first task and assign it to an intern or a team." /></section>}
  </>;
}
