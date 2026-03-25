import { getMeetings, computeStats } from "./lib/queries";
import { MeetingsApp } from "./components/meetings-app";

export const dynamic = "force-dynamic";

export default async function MeetingSummariesPage() {
  const meetings = await getMeetings();
  const stats = computeStats(meetings);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-accent">Meeting Summaries</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Never lose track of what was said — or what needs doing.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: stats.total, label: "Meetings" },
          { value: stats.summarized, label: "Summarized" },
          { value: stats.actionItems, label: "Action Items" },
          { value: `${stats.hoursTotal}h`, label: "Hours" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="glass border border-surface-border rounded-lg px-4 py-3 text-center"
          >
            <div className="text-2xl font-bold text-accent">{value}</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      <MeetingsApp meetings={meetings} />
    </div>
  );
}
