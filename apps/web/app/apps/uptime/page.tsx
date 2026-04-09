import { createClient } from "@repo/db/server";
import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@repo/ui";
import type { Site } from "./lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Uptime Status — Last Rev",
  description: "Site availability monitoring dashboard.",
};

async function getSites(): Promise<Site[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch sites:", error);
    return [];
  }
  return (data ?? []) as Site[];
}

const statusVariantMap: Record<string, { variant: "success" | "warning" | "error"; label: string }> = {
  up: { variant: "success", label: "Operational" },
  down: { variant: "error", label: "Down" },
  degraded: { variant: "warning", label: "Degraded" },
};

function UptimeBars({ history }: { history: Array<{ date: string; status: string; responseTimeMs?: number }> }) {
  const days = [...(history ?? [])].slice(0, 30).reverse();
  if (!days.length) return null;

  const barColor = (s: string) =>
    s === "up"
      ? "bg-emerald-500"
      : s === "down"
        ? "bg-red-500"
        : "bg-amber-500";

  return (
    <div className="flex gap-0.5 items-end h-8 mt-3">
      {days.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.status}${d.responseTimeMs ? ` (${d.responseTimeMs}ms)` : ""}`}
          className={`flex-1 min-w-0 rounded-sm ${barColor(d.status)}`}
          style={{
            height:
              d.status === "down"
                ? "100%"
                : d.responseTimeMs
                  ? `${Math.max(20, Math.min(100, d.responseTimeMs / 20))}%`
                  : "30%",
          }}
        />
      ))}
    </div>
  );
}

export default async function UptimePage() {
  const sites = await getSites();
  const issues = sites.filter((s) => s.status !== "up");

  return (
    <div className="space-y-6">
      <PageHeader
        title="📡 Uptime Status"
        subtitle="Know when your stuff goes down before your users do."
      />

      {/* Banner */}
      {issues.length === 0 ? (
        <StatusBadge variant="success" dot className="w-full justify-center rounded-xl px-6 py-4 text-base">
          All Systems Operational
        </StatusBadge>
      ) : (
        <StatusBadge variant="error" dot className="w-full justify-center rounded-xl px-6 py-4 text-base">
          ⚠️ {issues.length} System{issues.length > 1 ? "s" : ""} Experiencing Issues
        </StatusBadge>
      )}

      {/* Sites grid */}
      {sites.length === 0 ? (
        <EmptyState
          icon="📡"
          title="No sites are being monitored yet."
          description="Sites are managed via the status-pulse repo."
          action={
            <a
              href="https://github.com/last-rev-llc/status-pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline text-sm"
            >
              last-rev-llc/status-pulse →
            </a>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="bg-surface-card border-surface-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-200 cursor-default"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{site.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {site.url}
                    </p>
                  </div>
                  <StatusBadge
                    variant={statusVariantMap[site.status]?.variant ?? "warning"}
                    dot
                  >
                    {statusVariantMap[site.status]?.label ?? "Unknown"}
                  </StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-5 text-xs text-muted-foreground mb-3">
                  <span>
                    Response:{" "}
                    <span className="font-semibold text-foreground">
                      {site.responseTimeMs ? `${site.responseTimeMs}ms` : "—"}
                    </span>
                  </span>
                  <span>
                    Uptime:{" "}
                    <span className="font-semibold text-foreground">
                      {site.uptimePercent ?? "—"}%
                    </span>
                  </span>
                </div>
                <UptimeBars history={site.history ?? []} />
                {site.history && site.history.length > 0 && (
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{site.history[site.history.length - 1]?.date}</span>
                    <span>{site.history[0]?.date}</span>
                  </div>
                )}
                {site.description && (
                  <p className="text-xs text-muted-foreground mt-3 border-t border-surface-border pt-3">
                    {site.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Monitoring managed via{" "}
        <a
          href="https://github.com/last-rev-llc/status-pulse"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          last-rev-llc/status-pulse
        </a>
      </p>
    </div>
  );
}
