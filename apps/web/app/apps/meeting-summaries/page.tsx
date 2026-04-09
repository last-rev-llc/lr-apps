import { getMeetings, computeStats } from "./lib/queries";
import { MeetingsApp } from "./components/meetings-app";
import { PageHeader, StatCard } from "@repo/ui";

export const dynamic = "force-dynamic";

export default async function MeetingSummariesPage() {
  const meetings = await getMeetings();
  const stats = computeStats(meetings);

  return (
    <div>
      <PageHeader
        title="Meeting Summaries"
        subtitle="Never lose track of what was said — or what needs doing."
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: stats.total, label: "Meetings" },
          { value: stats.summarized, label: "Summarized" },
          { value: stats.actionItems, label: "Action Items" },
          { value: `${stats.hoursTotal}h`, label: "Hours" },
        ].map(({ value, label }) => (
          <StatCard key={label} value={value} label={label} size="sm" />
        ))}
      </div>

      <MeetingsApp meetings={meetings} />
    </div>
  );
}
