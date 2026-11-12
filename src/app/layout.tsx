import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AI ASESRO InternHub", template: "%s | AI ASESRO InternHub" },
  description: "Internal internship task, attendance and meeting management platform for AI ASESRO.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
