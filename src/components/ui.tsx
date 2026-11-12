import { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow ?? "AI ASESRO INTERNHUB"}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}

export function MetricCard({ label, value, detail, icon, tone = "blue" }: { label: string; value: string | number; detail?: string; icon: ReactNode; tone?: "blue" | "violet" | "green" | "amber" }) {
  return <article className="metric-card"><span className={`metric-icon metric-${tone}`}>{icon}</span><div className="metric-copy"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></article>;
}

export function StatusPill({ status }: { status: string }) {
  const tone = ["APPROVED", "PRESENT", "COMPLETED", "ACTIVE"].includes(status) ? "success" : ["NEEDS_CHANGES", "ABSENT", "CANCELLED", "INACTIVE"].includes(status) ? "danger" : ["SUBMITTED", "LATE", "IN_PROGRESS"].includes(status) ? "info" : "muted";
  const label = status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`status-pill status-${tone}`}>{label}</span>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="empty-state"><span className="empty-mark">—</span><strong>{title}</strong>{description && <p>{description}</p>}</div>;
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return <div className="alert alert-error" role="alert">{children}</div>;
}
