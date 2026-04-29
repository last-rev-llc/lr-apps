import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import type { ClientHealthPayload } from "../lib/types";

interface AiSummaryPanelProps {
  payload: ClientHealthPayload;
}

export function AiSummaryPanel({ payload }: AiSummaryPanelProps) {
  const { client, sites, score } = payload;
  const lowestUptime = sites.reduce<number | null>((acc, s) => {
    if (s.uptime == null) return acc;
    return acc == null ? s.uptime : Math.min(acc, s.uptime);
  }, null);

  return (
    <Card className="glass border-surface-border">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          {client.name} is at <span className="text-foreground">{score.score}/100</span>
          {lowestUptime != null && (
            <> with lowest site uptime at {lowestUptime.toFixed(1)}%</>
          )}
          .
        </p>
        <p className="text-xs">
          Detailed AI summaries land in a follow-up issue — this panel is a
          placeholder.
        </p>
      </CardContent>
    </Card>
  );
}
