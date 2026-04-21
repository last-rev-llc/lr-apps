import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import { PageHeader } from "@repo/ui";
import type { ReactNode } from "react";

export default async function MeetingSummariesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppLayoutAccess("meeting-summaries");

  return (
    <div className="min-h-screen">
      <header className="max-w-5xl mx-auto px-4 py-3">
        <PageHeader title="📝 Meeting Summaries" />
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
