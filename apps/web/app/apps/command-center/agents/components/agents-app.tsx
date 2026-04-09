"use client";

import { useState, useMemo } from "react";
import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Search, StatCard } from "@repo/ui";
import type { Agent, AgentStatus } from "../lib/types";

type StatusFilter = "all" | AgentStatus;

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "running", label: "Running" },
  { value: "inactive", label: "Inactive" },
  { value: "error", label: "Error" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: "rgba(34,197,94,0.12)",  text: "#4ade80", dot: "#4ade80" },
  running:  { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", dot: "#f59e0b" },
  inactive: { bg: "rgba(100,116,139,0.12)",text: "#94a3b8", dot: "#64748b" },
  error:    { bg: "rgba(239,68,68,0.12)",  text: "#f87171", dot: "#ef4444" },
};

function relDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface AgentsAppProps {
  initialAgents: Agent[];
}

export function AgentsApp({ initialAgents }: AgentsAppProps) {
  const [agents] = useState<Agent[]>(initialAgents);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedConfig, setExpandedConfig] = useState<Record<string, boolean>>({});

  function toggleConfig(id: string) {
    setExpandedConfig((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return agents.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q && !a.name.toLowerCase().includes(q) && !(a.type ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      active: agents.filter((a) => a.status === "active").length,
      running: agents.filter((a) => a.status === "running").length,
      error: agents.filter((a) => a.status === "error").length,
    };
  }, [agents]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="🤖 Agents"
        subtitle={`${agents.length} agents · ${counts.active} active · ${counts.running} running · ${counts.error} errors`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: agents.length },
          { label: "Active", value: counts.active },
          { label: "Running", value: counts.running },
          { label: "Errors", value: counts.error },
        ].map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} size="sm" />
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Search value={search} onChange={setSearch} placeholder="Search agents…" className="flex-1 min-w-[200px]" />
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "outline" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className={statusFilter === f.value ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="🤖" title="No agents found" description="Adjust search or filters" />
      ) : (
        <div className="space-y-3">
          {filtered.map((agent) => {
            const style = STATUS_STYLE[agent.status] ?? STATUS_STYLE.inactive;
            const configExpanded = expandedConfig[agent.id] ?? false;
            const hasConfig = agent.config && Object.keys(agent.config).length > 0;
            return (
              <Card key={agent.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <div className="mt-1 shrink-0">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: style.dot }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{agent.name}</span>
                        <Badge
                          className="text-[10px] px-1.5 py-0.5 border-0"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {agent.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs text-white/40 bg-white/5 border-0">
                          {agent.type}
                        </Badge>
                      </div>
                      {agent.description && (
                        <p className="text-xs text-white/50 mt-1">{agent.description}</p>
                      )}
                      {agent.status === "error" && agent.error_message && (
                        <p className="text-xs text-red-400 mt-1 font-mono bg-red-500/5 px-2 py-1 rounded">
                          {agent.error_message}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-white/30">
                        <span>Last run: {relDate(agent.last_run)}</span>
                        {agent.next_run && <span>Next: {relDate(agent.next_run)}</span>}
                        {agent.run_count != null && <span>Runs: {agent.run_count}</span>}
                      </div>
                      {hasConfig && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleConfig(agent.id)}
                            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
                          >
                            <span className="text-[10px]">{configExpanded ? "▼" : "▶"}</span>
                            Config
                          </button>
                          {configExpanded && (
                            <pre className="mt-1 text-[11px] text-white/50 bg-white/5 rounded p-2 overflow-x-auto">
                              {JSON.stringify(agent.config, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
