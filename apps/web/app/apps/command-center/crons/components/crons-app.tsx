"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@repo/db/client";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  Search,
} from "@repo/ui";
import type { Cron, CronStatus, StatusFilter } from "../lib/types";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
  { value: "failed", label: "Failed" },
];

const STATUS_STYLE: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  success: {
    bg: "rgba(34,197,94,0.12)",
    text: "#4ade80",
    dot: "#4ade80",
    label: "Success",
  },
  failed: {
    bg: "rgba(239,68,68,0.12)",
    text: "#f87171",
    dot: "#ef4444",
    label: "Failed",
  },
  running: {
    bg: "rgba(245,158,11,0.12)",
    text: "#fbbf24",
    dot: "#f59e0b",
    label: "Running",
  },
  pending: {
    bg: "rgba(100,116,139,0.12)",
    text: "#94a3b8",
    dot: "#64748b",
    label: "Pending",
  },
};

const DEFAULT_STATUS_STYLE = {
  bg: "rgba(100,116,139,0.12)",
  text: "#94a3b8",
  dot: "#64748b",
  label: "—",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 0) {
    // future (nextRun)
    const abs = -diff;
    if (abs < 60_000) return "in <1m";
    if (abs < 3_600_000) return `in ${Math.round(abs / 60_000)}m`;
    if (abs < 86_400_000) return `in ${Math.round(abs / 3_600_000)}h`;
    return `in ${Math.round(abs / 86_400_000)}d`;
  }
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function getPromptText(cron: Cron): string {
  return cron.prompt ?? cron.prompt_text ?? "";
}

// ── Component ────────────────────────────────────────────────────────────────

interface CronsAppProps {
  initialCrons: Cron[];
}

export function CronsApp({ initialCrons }: CronsAppProps) {
  const [crons, setCrons] = useState<Cron[]>(initialCrons);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedPrompts, setExpandedPrompts] = useState<
    Record<string, boolean>
  >({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cronsTable = () => (db as any).from("crons");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cronJobsTable = () => (db as any).from("cron_jobs");

  const toggleEnabled = useCallback(
    async (id: string) => {
      const cron = crons.find((c) => c.id === id);
      if (!cron) return;
      const newVal = !cron.enabled;
      setTogglingId(id);
      setCrons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: newVal } : c)),
      );
      try {
        // Try `crons` table first, then fall back to `cron_jobs`
        const { error } = await cronsTable()
          .update({ enabled: newVal })
          .eq("id", id);
        if (error) {
          await cronJobsTable()
            .update({ enabled: newVal, updated_at: new Date().toISOString() })
            .eq("id", id);
        }
      } catch (e) {
        console.warn("toggle failed:", e);
        // Revert on error
        setCrons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, enabled: !newVal } : c)),
        );
      } finally {
        setTogglingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crons, db],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = crons.filter((c) => {
      if (statusFilter === "active" && !c.enabled) return false;
      if (statusFilter === "disabled" && c.enabled !== false) return false;
      if (statusFilter === "failed" && c.lastStatus !== "failed") return false;
      if (q) {
        const nameMatch = c.name.toLowerCase().includes(q);
        const promptMatch = getPromptText(c).toLowerCase().includes(q);
        const catMatch = (c.category ?? "").toLowerCase().includes(q);
        if (!nameMatch && !promptMatch && !catMatch) return false;
      }
      return true;
    });
    return list;
  }, [crons, search, statusFilter]);

  const activeCount = crons.filter((c) => c.enabled).length;
  const failedCount = crons.filter((c) => c.lastStatus === "failed").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="⏰ Crons"
        subtitle={`${crons.length} jobs · ${activeCount} active · ${failedCount} failed`}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search jobs, prompts…"
          className="flex-1 min-w-[200px]"
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No crons match your search"
          description="Try adjusting the filters"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((cron) => (
            <CronCard
              key={cron.id}
              cron={cron}
              isToggling={togglingId === cron.id}
              promptExpanded={expandedPrompts[cron.id] ?? false}
              onToggleEnabled={() => toggleEnabled(cron.id)}
              onTogglePrompt={() =>
                setExpandedPrompts((prev) => ({
                  ...prev,
                  [cron.id]: !prev[cron.id],
                }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cron Card ─────────────────────────────────────────────────────────────────

interface CronCardProps {
  cron: Cron;
  isToggling: boolean;
  promptExpanded: boolean;
  onToggleEnabled: () => void;
  onTogglePrompt: () => void;
}

function CronCard({
  cron,
  isToggling,
  promptExpanded,
  onToggleEnabled,
  onTogglePrompt,
}: CronCardProps) {
  const statusStyle =
    STATUS_STYLE[cron.lastStatus ?? ""] ?? DEFAULT_STATUS_STYLE;
  const promptText = getPromptText(cron);

  return (
    <Card className="p-4">
      <CardContent className="p-0 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Status dot */}
          <div className="mt-1 shrink-0">
            <span
              className="block w-2.5 h-2.5 rounded-full"
              style={{ background: statusStyle.dot }}
            />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">{cron.name}</span>
              {cron.category && (
                <Badge className="text-[10px] px-1.5 py-0.5 border-0 bg-white/8 text-white/50">
                  {cron.category}
                </Badge>
              )}
              {cron.lastStatus && (
                <Badge
                  className="text-[10px] px-1.5 py-0.5 border-0"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.text,
                  }}
                >
                  {statusStyle.label}
                </Badge>
              )}
            </div>

            {/* Schedule */}
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/40">
              {(cron.scheduleHuman ?? cron.schedule) && (
                <span>
                  🕐{" "}
                  {cron.scheduleHuman
                    ? `${cron.scheduleHuman}${cron.schedule ? ` (${cron.schedule})` : ""}`
                    : cron.schedule}
                </span>
              )}
              {cron.lastRun && (
                <span>Last: {relTime(cron.lastRun)}</span>
              )}
              {cron.nextRun && cron.enabled && (
                <span>Next: {relTime(cron.nextRun)}</span>
              )}
              {cron.sessionTarget && (
                <span>Target: {cron.sessionTarget}</span>
              )}
            </div>
          </div>

          {/* Enable toggle */}
          <button
            onClick={onToggleEnabled}
            disabled={isToggling}
            title={cron.enabled ? "Disable" : "Enable"}
            className={`shrink-0 w-10 h-6 rounded-full border transition-all duration-200 flex items-center px-0.5 ${
              isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${
              cron.enabled
                ? "bg-green-500/25 border-green-500/40"
                : "bg-white/8 border-white/15"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full shadow transition-all duration-200 ${
                cron.enabled
                  ? "translate-x-4 bg-green-400"
                  : "translate-x-0 bg-white/30"
              }`}
            />
          </button>
        </div>

        {/* Prompt expandable */}
        {promptText && (
          <div>
            <button
              onClick={onTogglePrompt}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <span className="text-[10px]">{promptExpanded ? "▼" : "▶"}</span>
              <span>Prompt</span>
            </button>
            {promptExpanded && (
              <pre className="mt-2 rounded-lg bg-white/5 border border-white/10 p-3 text-[11px] text-white/40 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono">
                {promptText}
              </pre>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 text-[10px] text-white/25 pt-1 border-t border-white/8">
          <span
            className={`font-semibold ${cron.enabled ? "text-green-400/70" : "text-white/25"}`}
          >
            {cron.enabled ? "● Enabled" : "○ Disabled"}
          </span>
          {(cron.created_at ?? cron.createdAt) && (
            <span>
              Created{" "}
              {new Date(
                cron.created_at ?? cron.createdAt ?? "",
              ).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
