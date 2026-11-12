"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui";

type Intern = { id: string; name: string; email: string; internCode: string | null; position: string | null; status: "ACTIVE" | "INACTIVE"; team: { id: string; name: string } | null; createdAt: string };

export default function InternsPage() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", internCode: "", position: "", temporaryPassword: "" });

  async function load() {
    setLoading(true);
    try { const data = await apiRequest<{ interns: Intern[] }>("/api/v1/interns"); setInterns(data.interns); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load interns."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => interns.filter((intern) => `${intern.name} ${intern.email} ${intern.internCode ?? ""} ${intern.team?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())), [interns, search]);

  async function createIntern(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      await apiRequest("/api/v1/interns", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", internCode: "", position: "", temporaryPassword: "" });
      setShowForm(false); setSuccess("Intern account created. Share the temporary password securely."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create intern."); }
    finally { setSaving(false); }
  }

  async function toggleStatus(intern: Intern) {
    setError(""); setSuccess("");
    try {
      await apiRequest(`/api/v1/interns/${intern.id}`, { method: "PATCH", body: JSON.stringify({ status: intern.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }) });
      setSuccess(`${intern.name}'s account is now ${intern.status === "ACTIVE" ? "inactive" : "active"}.`); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update account."); }
  }

  return <>
    <PageHeader eyebrow="PEOPLE MANAGEMENT" title="Interns" description="Create intern accounts, manage access and see current team membership." action={<button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Add intern</button>} />
    {error && <div className="alert alert-error">{error}</div>}{success && <div className="alert alert-success">{success}</div>}
    {showForm && <section className="panel form-panel"><h2>Create intern account</h2><p>Interns do not self-register. Create an account and share the temporary password with the intern securely.</p><form onSubmit={createIntern}>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="intern-name">Full name *</label><input id="intern-name" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} /></div>
        <div className="form-field"><label htmlFor="intern-email">Email address *</label><input id="intern-email" className="form-control" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div className="form-field"><label htmlFor="intern-code">Intern ID</label><input id="intern-code" className="form-control" value={form.internCode} onChange={(e) => setForm({ ...form, internCode: e.target.value })} placeholder="e.g. ASESRO-026" /></div>
        <div className="form-field"><label htmlFor="intern-position">Position / department</label><input id="intern-position" className="form-control" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. AI/ML Intern" /></div>
        <div className="form-field form-field-wide"><label htmlFor="intern-password">Temporary password * (minimum 12 characters)</label><input id="intern-password" className="form-control" type="password" minLength={12} value={form.temporaryPassword} onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })} required /></div>
      </div>
      <div className="form-footer"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Creating…" : "Create account"}</button></div>
    </form></section>}
    <div className="toolbar"><div className="toolbar-left"><div className="search-wrap"><Search size={15} /><input className="search-input" placeholder="Search name, email, ID or team…" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div><div className="toolbar-right"><span className="muted-count">{interns.filter((i) => i.status === "ACTIVE").length} active · {interns.length} total</span></div></div>
    <section className="panel"><div className="table-wrap"><table><thead><tr><th>Intern</th><th>Intern ID</th><th>Team</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={6}>Loading interns…</td></tr> : filtered.length ? filtered.map((intern) => <tr key={intern.id}><td><strong>{intern.name}</strong><span className="table-sub">{intern.email}{intern.position ? ` · ${intern.position}` : ""}</span></td><td>{intern.internCode || "—"}</td><td>{intern.team?.name ?? "Unassigned"}</td><td>{formatDate(intern.createdAt)}</td><td><StatusPill status={intern.status} /></td><td><button className="text-button" onClick={() => void toggleStatus(intern)}>{intern.status === "ACTIVE" ? "Deactivate" : "Reactivate"}</button></td></tr>) : <tr><td colSpan={6}><EmptyState title="No interns found" description="Create the first intern account or change your search." /></td></tr>}
    </tbody></table></div></section>
  </>;
}
