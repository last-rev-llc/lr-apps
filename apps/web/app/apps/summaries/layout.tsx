import { requireAccess } from "@repo/auth/server";
import type { ReactNode } from "react";

export default async function SummariesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAccess("summaries");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <h1 className="font-heading text-xl text-accent">Summaries</h1>
          <span className="text-xs text-muted-foreground ml-1">
            Cut through the noise
          </span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
