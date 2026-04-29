import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@repo/ui";
import { HealthScoreRing } from "./health-score-ring";
import { SiteRow } from "./site-row";
import { AlertList } from "./alert-list";
import { AiSummaryPanel } from "./ai-summary-panel";
import type { ClientHealthAlert, ClientHealthPayload } from "../lib/types";

interface ClientDetailProps {
  payload: ClientHealthPayload;
  alerts: ClientHealthAlert[];
}

export function ClientDetail({ payload, alerts }: ClientDetailProps) {
  const { client, sites, score } = payload;

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        subtitle={
          client.industry
            ? `${client.industry}${client.contractStatus ? ` · contract ${client.contractStatus}` : ""}`
            : client.contractStatus
              ? `Contract ${client.contractStatus}`
              : "Client overview"
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start">
        <Card className="glass border-surface-border">
          <CardContent className="p-6 flex items-center gap-4">
            <HealthScoreRing score={score.score} size={96} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Health score
              </p>
              <p className="font-heading text-2xl font-bold text-foreground">
                {score.score}/100
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(score.breakdown).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-[10px]">
                    {key}: {Math.round(value)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <AiSummaryPanel payload={payload} />
      </div>

      <Card className="glass border-surface-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">
            Sites ({sites.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sites yet. Add a site URL to start monitoring.
            </p>
          ) : (
            <ul className="space-y-2">
              {sites.map((site) => (
                <SiteRow key={site.id} site={site} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertList alerts={alerts} />
    </div>
  );
}
