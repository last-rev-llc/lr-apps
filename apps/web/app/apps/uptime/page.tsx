import { createClient } from "@repo/db/server";
import { Badge } from "@repo/ui";
import { Card, CardContent, CardHeader } from "@repo/ui";
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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { emoji: string; label: string; className: string }> = {
    up: {
      emoji: "🟢",
      label: "Operational",
      className: "bg-green/15 text-green border-green/30",
    },
    down: {
      emoji: "🔴",
      label: "Down",
      className: "bg-red/15 text-red border-red/30",
    },
    degraded: {
      emoji: "🟡",
      label: "Degraded",
      className: "bg-yellow/15 text-yellow border-yellow/30",
    },
  };
  const v = variants[status] ?? { emoji: "⚪", label: "Unknown", className: "bg-surface/15 text-muted-foreground border-surface-border" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${v.className}`}
    >
      {v.emoji} <span>{v.label}</span>
    </span>
  );
}

function UptimeBars({ history }: { history: Array<{ date: string; status: string; responseTimeMs?: number }> }) {
  const days = [...(history ?? [])].slice(0, 30).reverse();
  if (!days.length) return null;

  const barColor = (s: string) =>
    s === "up"
      ? "bg-green"
      : s === "down"
        ? "bg-red"
        : "bg-yellow";

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
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          📡 Uptime Status
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Know when your stuff goes down before your users do.
        </p>
      </div>

      {/* Banner */}
      {issues.length === 0 ? (
        <div className="rounded-xl px-6 py-4 text-center font-semibold text-base bg-green/15 text-green border border-green/30">
          ✅ <span>All Systems Operational</span>
        </div>
      ) : (
        <div className="rounded-xl px-6 py-4 text-center font-semibold text-base bg-red/15 text-red border border-red/30">
          ⚠️ {issues.length} System{issues.length > 1 ? "s" : ""} Experiencing Issues
        </div>
      )}

      {/* Sites grid */}
      {sites.length === 0 ? (
        <Card className="bg-surface-card border-surface-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-3xl mb-3">📡</p>
            <p>No sites are being monitored yet.</p>
            <p className="text-xs mt-2">
              Sites are managed via the{" "}
              <a
                href="https://github.com/last-rev-llc/status-pulse"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                status-pulse
              </a>{" "}
              repo.
            </p>
          </CardContent>
        </Card>
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
                  <StatusBadge status={site.status} />
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
