import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSession } from "@/lib/auth";

export default async function InternLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== UserRole.INTERN) redirect("/admin");
  return <DashboardShell role="INTERN" name={session.name} email={session.email}>{children}</DashboardShell>;
}
