import { StatCard } from "@repo/ui";
import type { SentimentEntry } from "../lib/types";

interface StatsRowProps {
  entries: SentimentEntry[];
}

export function StatsRow({ entries }: StatsRowProps) {
  const avgSentiment =
    entries.length > 0
      ? (
          entries.reduce((sum, e) => sum + e.sentiment_score, 0) /
          entries.length
        ).toFixed(1)
      : "—";

  const uniqueMembers = new Set(entries.map((e) => e.member_name)).size;
  const blockedDays = entries.filter((e) => e.mood === "blocked").length;
  const totalHighlights = entries.reduce(
    (sum, e) => sum + (e.highlights?.length ?? 0),
    0,
  );

  const stats = [
    { key: "avgSentiment", label: "Avg Sentiment", value: avgSentiment },
    { key: "totalEntries", label: "Total Entries", value: entries.length },
    { key: "teamMembers", label: "Team Members", value: uniqueMembers },
    { key: "blockedDays", label: "Blocked Days", value: blockedDays },
    { key: "highlights", label: "Highlights", value: totalHighlights },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          value={stat.value}
          label={stat.label}
          size="sm"
          data-testid={`stat-card-${stat.key}`}
        />
      ))}
    </div>
  );
}
