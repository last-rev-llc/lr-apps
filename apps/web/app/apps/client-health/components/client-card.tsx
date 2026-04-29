import Link from "next/link";
import { Badge, Card, CardContent, cn } from "@repo/ui";
import { HealthScoreRing } from "./health-score-ring";
import type { ClientHealthPayload } from "../lib/types";

interface ClientCardProps {
  payload: ClientHealthPayload;
}

function siteSummary(payload: ClientHealthPayload): string {
  const total = payload.sites.length;
  if (total === 0) return "No sites";
  const down = payload.sites.filter((s) => s.status === "down").length;
  const degraded = payload.sites.filter((s) => s.status === "degraded").length;
  if (down === 0 && degraded === 0) {
    return `${total} site${total === 1 ? "" : "s"} · all up`;
  }
  return `${total} sites · ${down} down · ${degraded} degraded`;
}

export function ClientCard({ payload }: ClientCardProps) {
  const { client, sites, score } = payload;

  return (
    <Link
      href={`/apps/client-health/${client.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl"
    >
      <Card
        className={cn(
          "h-full glass border-surface-border transition-colors",
          "group-hover:border-accent/40",
        )}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <HealthScoreRing score={score.score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-base font-semibold text-foreground truncate">
                {client.name}
              </span>
              {client.industry && (
                <Badge variant="outline" className="text-[10px]">
                  {client.industry}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {siteSummary(payload)}
              {client.contractStatus && (
                <span> · contract {client.contractStatus}</span>
              )}
            </p>
            {sites.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {sites.map((s) => s.label).join(", ")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
