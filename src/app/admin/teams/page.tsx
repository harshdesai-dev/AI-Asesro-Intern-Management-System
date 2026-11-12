"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, UsersRound, Pencil, X } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";

type Intern = { id: string; name: string; email: string; internCode: string | null; status: "ACTIVE" | "INACTIVE"; team?: { id: string; name: string } | null };
type Team = { id: string; name: string; description: string | null; isActive: boolean; members: Array<{ id: string; name: string; email: string; internCode: string | null }>; _count?: { assignments: number } };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [teamData, internData] = await Promise.all([apiRequest<{ teams: Team[] }>("/api/v1/teams"), apiRequest<{ interns: Intern[] }>("/api/v1/interns")]);
      setTeams(teamData.teams); setInterns(internData.interns);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load teams."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function resetForm() { setEditing(null); setName(""); setDescription(""); setMemberIds([]); setShowForm(false); }
  function startEdit(team: Team) { setEditing(team); setName(team.name); setDescription(team.description ?? ""); setMemberIds(team.members.map((m) => m.id)); setShowForm(true); setError(""); setSuccess(""); }

  async function saveTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      if (editing) {
        await apiRequest(`/api/v1/teams/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name, description, internIds: memberIds }) });
        setSuccess("Team details and current membership updated.");
      } else {
        await apiRequest("/api/v1/teams", { method: "POST", body: JSON.stringify({ name, description, internIds: memberIds }) });
        setSuccess("Team created successfully.");
      }
      resetForm(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save team."); }
    finally { setSaving(false); }
  }

  async function toggleTeam(team: Team) {
    setError(""); setSuccess("");
    try { await apiRequest(`/api/v1/teams/${team.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !team.isActive }) }); setSuccess(`Team ${team.isActive ? "deactivated" : "reactivated"}.`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update team."); }
  }

  const availableInterns = interns.filter((intern) => intern.status === "ACTIVE" && (!intern.team || intern.team.id === editing?.id));

  return <>
    <PageHeader eyebrow="TEAM COORDINATION" title="Teams" description="Organize active interns into teams. Team rosters are copied into each team assignment when a task is assigned." action={<button className="button button-primary" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={16} /> Create team</button>} />
    {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    {showForm && <section className="panel form-panel"><div className="form-heading-row"><div><h2>{editing ? `Edit ${editing.name}` : "Create a team"}</h2><p>An intern can belong to one current team at a time. Existing task rosters will not change when you edit membership.</p></div><button className="icon-button" onClick={resetForm} aria-label="Close form"><X size={16} /></button></div><form onSubmit={saveTeam}>
      <div className="form-grid"><div className="form-field"><label htmlFor="team-name">Team name *</label><input id="team-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div><div className="form-field"><label htmlFor="team-description">Description</label><input id="team-description" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} /></div><div className="form-field form-field-wide"><label htmlFor="team-members">Current members</label><select id="team-members" multiple className="form-control" value={memberIds} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMemberIds(Array.from(e.target.selectedOptions).map((option: HTMLOptionElement) => option.value))}>{availableInterns.map((intern) => <option key={intern.id} value={intern.id}>{intern.name}{intern.internCode ? ` · ${intern.internCode}` : ""}</option>)}</select><span className="form-hint">Hold Ctrl (Windows) or Command (Mac) to select multiple interns. Only active interns who are not on another team are available.</span></div></div>
      <div className="form-footer"><button type="button" className="button button-secondary" onClick={resetForm}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create team"}</button></div>
    </form></section>}
    {loading ? <div className="panel empty-state">Loading teams…</div> : teams.length ? <div className="team-grid">{teams.map((team) => <section className="panel team-card" key={team.id}><div className="team-card-head"><span className="metric-icon metric-violet"><UsersRound size={18} /></span><StatusPill status={team.isActive ? "ACTIVE" : "INACTIVE"} /></div><h2>{team.name}</h2><p>{team.description || "No team description added."}</p><div className="team-card-meta"><span>{team.members.length} current members</span><span>{team._count?.assignments ?? 0} task assignments</span></div><div className="member-chips">{team.members.length ? team.members.map((member) => <span key={member.id} className="member-chip">{member.name}</span>) : <span className="form-hint">No active members</span>}</div><div className="team-card-actions"><button className="button button-secondary" onClick={() => startEdit(team)}><Pencil size={14} /> Edit roster</button><button className="text-button" onClick={() => void toggleTeam(team)}>{team.isActive ? "Deactivate" : "Reactivate"}</button></div></section>)}</div> : <section className="panel"><EmptyState title="No teams created" description="Create a team and add active interns to start assigning collaborative projects." /></section>}
  </>;
}
