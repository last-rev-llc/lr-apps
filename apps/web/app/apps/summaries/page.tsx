import { PageHeader, StatCard } from "@repo/ui";
import { getAllSummaries, getSlackChannels } from "./lib/queries";
import { SummariesApp } from "./components/summaries-app";

export const dynamic = "force-dynamic";

export default async function SummariesPage() {
  const { zoom, slack, jira, all } = await getAllSummaries();
  const slackChannels = getSlackChannels(slack);

  return (
    <div>
      <PageHeader
        title="Summaries"
        subtitle="Every meeting, thread, and ticket — synthesized, searchable, and actually useful."
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: all.length, label: "Total" },
          { value: zoom.length, label: "Zoom" },
          { value: slack.length, label: "Slack" },
          { value: jira.length, label: "Jira" },
        ].map(({ value, label }) => (
          <StatCard key={label} value={value} label={label} size="sm" />
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
