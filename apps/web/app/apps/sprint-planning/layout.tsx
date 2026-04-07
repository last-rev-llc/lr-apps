import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import type { ReactNode } from "react";

export default async function SprintPlanningLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("sprint-planning");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <h1 className="font-heading text-xl text-accent">Sprint Planning</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
