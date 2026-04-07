import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import type { ReactNode } from "react";

export default async function DailyUpdatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("daily-updates");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📱</span>
          <h1 className="font-heading text-xl text-accent">Daily Updates</h1>
          <nav className="ml-auto flex gap-4 text-sm">
            <a href="/apps/daily-updates" className="text-foreground hover:text-accent">
              Feed
            </a>
            <a
              href="/apps/daily-updates/about"
              className="text-muted-foreground hover:text-accent"
            >
              About
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
