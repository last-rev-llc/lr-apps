import { Card, CardContent } from "@repo/ui";
import { MoodBadge } from "./mood-badge";
import type { DayGroup } from "../lib/types";

interface TimelineProps {
  groups: DayGroup[];
}

export function Timeline({ groups }: TimelineProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {new Date(group.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.entries.map((entry) => (
              <Card key={entry.id} className="glass-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {entry.member_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <MoodBadge mood={entry.mood} />
                      <span className="text-xs text-accent font-bold">
                        {entry.sentiment_score}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {entry.work_summary}
                  </p>
                  {entry.highlights?.length > 0 && (
                    <p className="text-xs text-green-400">
                      Highlights: {entry.highlights.join(", ")}
                    </p>
                  )}
                  {entry.blockers?.length > 0 && (
                    <p className="text-xs text-red-400">
                      Blockers: {entry.blockers.join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
