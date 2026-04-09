"use client";

import { useState, useMemo } from "react";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader } from "@repo/ui";
import type { HealthSite, SiteStatus, SortKey } from "../lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SiteStatus, { dot: string; text: string; bg: string; border: string }> = {
  up: { dot: "#4ade80", text: "#4ade80", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)" },
  down: { dot: "#f87171", text: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)" },
  degraded: { dot: "#fbbf24", text: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" },
};

const STATUS_PRIORITY: Record<SiteStatus, number> = { down: 0, degraded: 1, up: 2 };

const SSL_WARN_DAYS = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sslDaysLeft(sslExpiry?: string | null): number | null {
  if (!sslExpiry) return null;
  const diff = new Date(sslExpiry).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function uptimeColor(uptime?: number | null): string {
  if (uptime == null) return "rgba(255,255,255,0.3)";
  if (uptime >= 99.5) return "#4ade80";
  if (uptime >= 98) return "#fbbf24";
  return "#f87171";
}

function responseTimeColor(ms?: number | null): string {
  if (ms == null) return "rgba(255,255,255,0.3)";
  if (ms < 300) return "#4ade80";
  if (ms < 800) return "#fbbf24";
  return "#f87171";
}

// ── Status Dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: SiteStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.down;
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{
        background: s.dot,
        boxShadow: `0 0 6px ${s.dot}80`,
      }}
    />
  );
}

// ── Overall Health Banner ─────────────────────────────────────────────────────

function OverallBanner({ sites }: { sites: HealthSite[] }) {
  const down = sites.filter((s) => s.status === "down").length;
  const degraded = sites.filter((s) => s.status === "degraded").length;
  const up = sites.filter((s) => s.status === "up").length;

  const allUp = down === 0 && degraded === 0;
  const bg = allUp
    ? "rgba(34,197,94,0.1)"
    : down > 0
      ? "rgba(239,68,68,0.1)"
      : "rgba(245,158,11,0.1)";
  const border = allUp
    ? "rgba(34,197,94,0.3)"
    : down > 0
      ? "rgba(239,68,68,0.3)"
      : "rgba(245,158,11,0.3)";
  const text = allUp ? "#4ade80" : down > 0 ? "#f87171" : "#fbbf24";
  const headline = allUp
    ? "All systems operational"
    : down > 0
      ? `${down} site${down > 1 ? "s" : ""} down`
      : `${degraded} site${degraded > 1 ? "s" : ""} degraded`;

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-4 border"
      style={{ background: bg, borderColor: border }}
    >
      <div className="text-3xl">{allUp ? "✅" : down > 0 ? "🔴" : "🟡"}</div>
      <div>
        <div className="text-base font-bold" style={{ color: text }}>
          {headline}
        </div>
        <div className="text-xs text-white/50 mt-0.5">
          {up} up · {degraded} degraded · {down} down · {sites.length} total
        </div>
      </div>
    </div>
  );
}

// ── Site Card ─────────────────────────────────────────────────────────────────

function SiteCard({ site }: { site: HealthSite }) {
  const s = STATUS_STYLES[site.status] ?? STATUS_STYLES.down;
  const daysLeft = sslDaysLeft(site.sslExpiry);
  const sslWarning = daysLeft !== null && daysLeft < SSL_WARN_DAYS;

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <StatusDot status={site.status} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm truncate">{site.name}</div>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/40 hover:text-amber-400 transition-colors truncate block"
            >
              {site.url}
            </a>
          </div>
          <Badge variant="outline" className="text-[11px] uppercase tracking-wide shrink-0" style={{ background: s.bg, color: s.text, borderColor: s.border }}>
            {site.status.toUpperCase()}
          </Badge>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Uptime */}
          <div className="bg-white/3 rounded-lg p-2 text-center">
            <div
              className="text-sm font-bold"
              style={{ color: uptimeColor(site.uptime) }}
            >
              {site.uptime != null ? `${site.uptime.toFixed(1)}%` : "—"}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Uptime</div>
          </div>

          {/* Response time */}
          <div className="bg-white/3 rounded-lg p-2 text-center">
            <div
              className="text-sm font-bold"
              style={{ color: responseTimeColor(site.responseTime) }}
            >
              {site.responseTime != null ? `${site.responseTime}ms` : "—"}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Response</div>
          </div>

          {/* Last check */}
          <div className="bg-white/3 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-white/70">
              {formatDate(site.lastCheck)}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">Last Check</div>
          </div>

          {/* SSL expiry */}
          <div className={`rounded-lg p-2 text-center ${sslWarning ? "bg-amber-500/10" : "bg-white/3"}`}>
            <div
              className="text-sm font-bold"
              style={{ color: sslWarning ? "#fbbf24" : "rgba(255,255,255,0.7)" }}
            >
              {daysLeft != null ? (daysLeft < 0 ? "Expired" : `${daysLeft}d`) : "—"}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">
              {sslWarning ? "⚠️ SSL" : "SSL Expiry"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface HealthAppProps {
  initialSites: HealthSite[];
}

export function HealthApp({ initialSites }: HealthAppProps) {
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [statusFilter, setStatusFilter] = useState<"All" | SiteStatus>("All");

  const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: "status", label: "Status" },
    { value: "name", label: "Name" },
    { value: "responseTime", label: "Response Time" },
    { value: "uptime", label: "Uptime" },
  ];

  const filtered = useMemo(() => {
    let list = initialSites;
    if (statusFilter !== "All") {
      list = list.filter((s) => s.status === statusFilter);
    }
    return [...list].sort((a, b) => {
      if (sortKey === "status") {
        return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      }
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortKey === "responseTime") {
        return (a.responseTime ?? Infinity) - (b.responseTime ?? Infinity);
      }
      if (sortKey === "uptime") {
        return (b.uptime ?? 0) - (a.uptime ?? 0);
      }
      return 0;
    });
  }, [initialSites, statusFilter, sortKey]);

  const sslWarnings = initialSites.filter((s) => {
    const d = sslDaysLeft(s.sslExpiry);
    return d !== null && d < SSL_WARN_DAYS;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Client Health"
        subtitle={`${initialSites.length} sites monitored`}
      />

      {/* Overall banner */}
      <OverallBanner sites={initialSites} />

      {/* SSL warnings */}
      {sslWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 space-y-1">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            ⚠️ SSL Certificates Expiring Soon
          </div>
          {sslWarnings.map((s) => {
            const d = sslDaysLeft(s.sslExpiry);
            return (
              <div key={s.id} className="text-xs text-white/60">
                <span className="text-white/80 font-medium">{s.name}</span> — expires in{" "}
                <span className="text-amber-400 font-bold">
                  {d != null && d < 0 ? "EXPIRED" : `${d} days`}
                </span>
                {" "}({formatDate(s.sslExpiry)})
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex gap-1">
          {(["All", "up", "degraded", "down"] as const).map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "outline" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className={statusFilter === f ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
            >
              {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-1 ml-auto">
          <span className="text-xs text-white/30 self-center">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={sortKey === opt.value ? "outline" : "ghost"}
              size="sm"
              onClick={() => setSortKey(opt.value)}
              className={sortKey === opt.value ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💚"
          title="No sites match"
          description="Try changing the status filter"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}
