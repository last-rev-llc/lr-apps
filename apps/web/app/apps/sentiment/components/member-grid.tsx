import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { MoodBadge } from "./mood-badge";
import type { MemberSummary } from "../lib/types";

interface MemberGridProps {
  members: MemberSummary[];
}

export function MemberGrid({ members }: MemberGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((m) => (
        <Card key={m.name} className="glass-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{m.name}</CardTitle>
              <MoodBadge mood={m.latestMood} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(m.latestScore / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {m.latestScore}/10
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avg: {m.avgScore}</span>
              <span>{m.entryCount} entries</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
