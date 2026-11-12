"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity, Bell, CalendarDays, CheckSquare, ClipboardCheck, LayoutDashboard,
  LogOut, Menu, Users, UsersRound, X, BriefcaseBusiness,
} from "lucide-react";

type Role = "ADMIN" | "INTERN";
type Props = { role: Role; name: string; email: string; children: React.ReactNode };

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/interns", label: "Interns", icon: Users },
  { href: "/admin/teams", label: "Teams", icon: UsersRound },
  { href: "/admin/tasks", label: "Task management", icon: CheckSquare },
  { href: "/admin/attendance", label: "Daily attendance", icon: ClipboardCheck },
  { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
];
const internLinks = [
  { href: "/intern", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/intern/tasks", label: "My tasks", icon: CheckSquare },
  { href: "/intern/attendance", label: "My attendance", icon: ClipboardCheck },
  { href: "/intern/meetings", label: "Meetings", icon: CalendarDays },
];

export function DashboardShell({ role, name, email, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "ADMIN" ? adminLinks : internLinks;
  const pageName = links.find((link) => link.exact ? pathname === link.href : pathname.startsWith(link.href))?.label ?? "Workspace";

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button aria-label="Close navigation" className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <Link href={role === "ADMIN" ? "/admin" : "/intern"} className="brand-main" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark"><Activity size={19} strokeWidth={2.4} /></span>
            <span className="brand-copy"><strong>AI ASESRO</strong><small>INTERNHUB</small></span>
          </Link>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link ${active ? "nav-link-active" : ""}`}><Icon size={17} /><span>{label}</span>{active && <span className="nav-active-dot" />}</Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-icon"><BriefcaseBusiness size={15} /></span><div><strong>Internship workspace</strong><small>Keep work moving.</small></div></div>
          <div className="profile-row"><span className="avatar">{name.split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</span><span className="profile-copy"><strong>{name}</strong><small>{role === "ADMIN" ? "Administrator" : "Intern"}</small></span><button className="icon-button logout-icon" title="Sign out" onClick={logout}><LogOut size={16} /></button></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div><div className="breadcrumb">AI ASESRO <span>/</span> {role === "ADMIN" ? "ADMIN" : "INTERN"}</div><div className="topbar-title">{pageName}</div></div></div>
          <div className="topbar-right"><span className="system-status"><i /> System workspace</span><button className="icon-button" aria-label="Notifications are not enabled in V1" title="Notifications are planned for a later version"><Bell size={17} /></button><span className="topbar-divider" /><span className="topbar-user">{email}</span></div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
