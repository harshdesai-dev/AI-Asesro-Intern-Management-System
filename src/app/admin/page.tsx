import type { Metadata } from "next";
import { Overview } from "@/components/overview";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminHomePage() {
  const session = await getSession();
  return <Overview role="ADMIN" name={session?.name ?? "Admin"} />;
}
