import { getAllSummaries, getSlackChannels } from "./lib/queries";
import { SummariesApp } from "./components/summaries-app";

export const dynamic = "force-dynamic";

export default async function SummariesPage() {
  const { zoom, slack, jira, all } = await getAllSummaries();
  const slackChannels = getSlackChannels(slack);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl text-accent">Summaries</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Every meeting, thread, and ticket — synthesized, searchable, and
          actually useful.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: all.length, label: "Total" },
          { value: zoom.length, label: "Zoom" },
          { value: slack.length, label: "Slack" },
          { value: jira.length, label: "Jira" },
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

      <SummariesApp
        zoom={zoom}
        slack={slack}
        jira={jira}
        all={all}
        slackChannels={slackChannels}
      />
    </div>
  );
}
