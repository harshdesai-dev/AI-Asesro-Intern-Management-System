import type { Metadata } from "next";
import { Overview } from "@/components/overview";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Intern overview" };

export default async function InternHomePage() {
  const session = await getSession();
  return <Overview role="INTERN" name={session?.name ?? "Intern"} />;
}
