import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import { Button } from "@repo/ui";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Daily Standup — Last Rev",
  description: "Aggregated daily standup notes from Slack, GitHub, and Git.",
};

export default async function StandupLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("standup");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-xl text-accent">📋 Daily Standup</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-accent"
            >
              ← Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
