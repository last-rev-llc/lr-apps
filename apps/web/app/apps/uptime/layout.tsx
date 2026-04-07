import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Uptime Status — Last Rev",
  description: "Site availability monitoring dashboard.",
};

export default async function UptimeLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("uptime");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-xl text-accent">📡 Uptime Status</h1>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
