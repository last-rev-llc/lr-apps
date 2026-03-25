import { Card, CardContent } from "@repo/ui";
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
    { label: "Avg Sentiment", value: avgSentiment },
    { label: "Total Entries", value: entries.length },
    { label: "Team Members", value: uniqueMembers },
    { label: "Blocked Days", value: blockedDays },
    { label: "Highlights", value: totalHighlights },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
