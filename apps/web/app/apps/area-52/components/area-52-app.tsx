"use client";

import { useState, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  Search,
} from "@repo/ui";
import type { Experiment, ExperimentStatus } from "../lib/types";

const STATUS_FILTERS: Array<{ value: ExperimentStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "exploring", label: "Exploring" },
  { value: "active", label: "Active" },
  { value: "shelved", label: "Shelved" },
  { value: "shipped", label: "Shipped" },
];

const STATUS_BADGE_STYLE: Record<ExperimentStatus, { bg: string; text: string }> = {
  active:    { bg: "color-mix(in srgb, var(--color-neon-green) 15%, transparent)", text: "var(--color-neon-green)" },
  exploring: { bg: "color-mix(in srgb, var(--color-accent) 15%, transparent)", text: "var(--color-accent-300)" },
  shelved:   { bg: "color-mix(in srgb, var(--color-slate) 15%, transparent)", text: "var(--color-slate)" },
  shipped:   { bg: "color-mix(in srgb, var(--color-neon-violet) 15%, transparent)", text: "var(--color-neon-violet)" },
};

interface Area52AppProps {
  initialExperiments: Experiment[];
}

export function Area52App({ initialExperiments }: Area52AppProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialExperiments.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (q) {
        const match = [e.title, e.description, e.owner, e.outcome].some(
          (f) => (f ?? "").toLowerCase().includes(q)
        );
        if (!match) return false;
      }
      return true;
    });
  }, [initialExperiments, search, statusFilter]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="👽 Area 52"
        subtitle="Internal R&D experiments tracker"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search experiments…"
          className="flex-1 min-w-[200px]"
        />
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

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔬"
          title="No experiments found"
          description="Try adjusting your search or status filter"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((experiment) => {
            const style = STATUS_BADGE_STYLE[experiment.status];
            return (
              <Card key={experiment.id} className="p-4">
                <CardHeader className="p-0 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-white leading-snug">
                      {experiment.title}
                    </CardTitle>
                    <Badge
                      className="shrink-0 text-[10px] px-1.5 py-0.5 border-0 capitalize"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {experiment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {experiment.description && (
                    <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                      {experiment.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {experiment.category && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 capitalize">
                        {experiment.category}
                      </Badge>
                    )}
                    {experiment.owner && (
                      <span className="text-[10px] text-white/30">{experiment.owner}</span>
                    )}
                  </div>
                  {experiment.outcome && (
                    <p className="text-xs text-white/40 italic">{experiment.outcome}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
