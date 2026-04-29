import { Badge, Card, CardContent, CardHeader, CardTitle, cn } from "@repo/ui";
import type {
  AlertSeverity,
  ClientHealthAlert,
} from "../lib/types";

interface AlertListProps {
  alerts: ClientHealthAlert[];
}

function severityClass(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-red/15 text-red border-red/30";
    case "warning":
      return "bg-yellow/15 text-yellow border-yellow/30";
    case "info":
    default:
      return "bg-surface text-muted-foreground border-surface-border";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AlertList({ alerts }: AlertListProps) {
  return (
    <Card className="glass border-surface-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 px-3 py-2 rounded-lg bg-surface border border-surface-border"
              >
                <Badge
                  variant="outline"
                  className={cn("text-[10px] uppercase tracking-wider shrink-0", severityClass(a.severity))}
                >
                  {a.severity}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {a.title ?? a.type}
                  </p>
                  {a.message && (
                    <p className="text-xs text-muted-foreground truncate">
                      {a.message}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(a.createdAt)}
                    {a.acknowledgedAt ? " · acknowledged" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
