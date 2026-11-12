"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, CheckCheck, Play, Send } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";

type Assignment = {
  id: string; type: "INDIVIDUAL" | "TEAM"; status: string; assignedAt: string;
  task: { id: string; title: string; description: string; priority: string; deadline: string | null; createdAt: string };
  team: { id: string; name: string } | null;
  teamLead: { id: string; name: string; internCode: string | null } | null;
  intern: { id: string; name: string } | null;
  members: Array<{ intern: { id: string; name: string; internCode: string | null } }>;
  submissionUrl: string | null; submissionNote: string | null; submittedAt: string | null; reviewFeedback: string | null;
};

export default function MyTasksPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submissions, setSubmissions] = useState<Record<string, { url: string; note: string }>>({});
  const [busy, setBusy] = useState<string>("");

  async function load() {
    setLoading(true);
    try { const data = await apiRequest<{ assignments: Assignment[] }>("/api/v1/me/tasks"); setAssignments(data.assignments); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load your tasks."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function start(assignmentId: string) {
    setBusy(assignmentId); setError(""); setSuccess("");
    try { await apiRequest(`/api/v1/me/tasks/${assignmentId}`, { method: "PATCH", body: JSON.stringify({ action: "START" }) }); setSuccess("Task marked as in progress."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to start task."); }
    finally { setBusy(""); }
  }

  async function submit(event: FormEvent<HTMLFormElement>, assignmentId: string) {
    event.preventDefault(); setBusy(assignmentId); setError(""); setSuccess("");
    const values = submissions[assignmentId] ?? { url: "", note: "" };
    try { await apiRequest(`/api/v1/me/tasks/${assignmentId}`, { method: "PATCH", body: JSON.stringify({ action: "SUBMIT", submissionUrl: values.url, submissionNote: values.note }) }); setSuccess("Your submission has been sent to the Admin for review."); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to submit work."); }
    finally { setBusy(""); }
  }

  return <>
    <PageHeader eyebrow="ASSIGNED WORK" title="My tasks" description="View individual assignments and shared team projects. For team tasks, only the designated Team Lead can submit the common work." />
    {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    {loading ? <div className="panel empty-state">Loading your tasks…</div> : assignments.length ? <div className="task-grid">{assignments.map((assignment) => {
      const isTeamLead = assignment.type === "TEAM" && assignment.teamLead?.id;
      const canSubmit = assignment.type === "INDIVIDUAL" || Boolean(isTeamLead);
      const canEditSubmission = canSubmit && ["ASSIGNED", "IN_PROGRESS", "NEEDS_CHANGES"].includes(assignment.status);
      return <article className="panel task-card" key={assignment.id}><div className="task-card-top"><div><div className="eyebrow">{assignment.type === "TEAM" ? `TEAM PROJECT · ${assignment.team?.name ?? "Team"}` : "INDIVIDUAL TASK"}</div><h3>{assignment.task.title}</h3></div><StatusPill status={assignment.status} /></div><p>{assignment.task.description}</p><div className="task-card-meta"><span>Priority: {assignment.task.priority}</span><span>{assignment.task.deadline ? `Due ${formatDate(assignment.task.deadline)}` : "No deadline"}</span><span>Assigned {formatDate(assignment.assignedAt)}</span></div>
        {assignment.type === "TEAM" && <div className="team-context"><div><strong>Responsible Team Lead</strong><span>{assignment.teamLead?.name ?? "Not assigned"}{assignment.teamLead?.internCode ? ` · ${assignment.teamLead.internCode}` : ""}</span></div><div><strong>Assignment-time team members</strong><span>{assignment.members.map((member) => member.intern.name).join(", ")}</span></div></div>}
        {assignment.reviewFeedback && <div className="review-feedback-note"><strong>Admin feedback</strong><p>{assignment.reviewFeedback}</p></div>}
        {assignment.submissionUrl && <div className="existing-submission"><span>Latest submission · {assignment.submittedAt ? formatDateTime(assignment.submittedAt) : "—"}</span><a href={assignment.submissionUrl} target="_blank" rel="noreferrer">Open submitted work <ArrowUpRight size={13} /></a></div>}
        <div className="task-card-actions">
          {assignment.status === "ASSIGNED" && <button className="button button-secondary" disabled={busy === assignment.id} onClick={() => void start(assignment.id)}><Play size={14} /> {busy === assignment.id ? "Updating…" : "Start task"}</button>}
          {canEditSubmission && <form className="submission-form" onSubmit={(event) => void submit(event, assignment.id)}><div className="form-field"><label htmlFor={`submission-url-${assignment.id}`}>{assignment.status === "NEEDS_CHANGES" ? "Updated submission link *" : "Submission link *"}</label><input id={`submission-url-${assignment.id}`} className="form-control" type="url" placeholder="https://github.com/... or project URL" value={submissions[assignment.id]?.url ?? assignment.submissionUrl ?? ""} onChange={(e) => setSubmissions((current) => ({ ...current, [assignment.id]: { url: e.target.value, note: current[assignment.id]?.note ?? assignment.submissionNote ?? "" } }))} required /></div><div className="form-field"><label htmlFor={`submission-note-${assignment.id}`}>Short update (optional)</label><textarea id={`submission-note-${assignment.id}`} className="form-control" rows={2} placeholder="Summarize what you completed…" value={submissions[assignment.id]?.note ?? assignment.submissionNote ?? ""} onChange={(e) => setSubmissions((current) => ({ ...current, [assignment.id]: { url: current[assignment.id]?.url ?? assignment.submissionUrl ?? "", note: e.target.value } }))} /></div><div className="form-footer"><button className="button button-primary" disabled={busy === assignment.id}><Send size={14} /> {busy === assignment.id ? "Sending…" : assignment.status === "NEEDS_CHANGES" ? "Resubmit work" : "Submit work"}</button></div></form>}
          {assignment.type === "TEAM" && !canSubmit && <div className="team-lead-reminder"><CheckCheck size={15} /> Your Team Lead ({assignment.teamLead?.name ?? "assigned TL"}) is responsible for the single common submission.</div>}
          {assignment.status === "APPROVED" && <div className="team-lead-reminder"><CheckCheck size={15} /> This assignment has been approved by the Admin.</div>}
          {assignment.status === "SUBMITTED" && <div className="team-lead-reminder">Your work has been submitted and is awaiting Admin review.</div>}
        </div>
      </article>;
    })}</div> : <section className="panel"><EmptyState title="No tasks assigned yet" description="When your Admin assigns work to you or your team, it will appear here." /></section>}
  </>;
}
