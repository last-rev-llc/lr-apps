"use client";

import { Badge, Button, Card, CardContent, CardHeader, EmptyState } from "@repo/ui";
import { useState } from "react";
import type { Activity, Source, StandupDay } from "../lib/types";

const SOURCE_META: Record<Source, { icon: string; label: string; color: string }> = {
  slack: {
    icon: "💬",
    label: "Slack",
    color: "bg-pill-0/15 text-pill-0 border-pill-0/30",
  },
  github: {
    icon: "🔧",
    label: "GitHub",
    color: "bg-slate/15 text-slate-light border-slate/30",
  },
  workspace: {
    icon: "📝",
    label: "Workspace",
    color: "bg-blue/15 text-blue border-blue/30",
  },
  jira: {
    icon: "📋",
    label: "Jira",
    color: "bg-pill-7/15 text-pill-7 border-pill-7/30",
  },
};

const SOURCE_ORDER: Source[] = ["slack", "workspace", "github", "jira"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr: string, dow: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${dow}, ${MONTHS[m - 1]} ${d}`;
}

function SourceBadge({ source }: { source: Source }) {
  const meta = SOURCE_META[source] ?? {
    icon: "📌",
    label: source,
    color: "bg-surface-raised text-muted-foreground border-surface-border",
  };
  return (
    <Badge
      variant="outline"
      className={`gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}
    >
      {meta.icon} {meta.label}
    </Badge>
  );
}

function SourceGroup({ source, activities }: { source: Source; activities: Activity[] }) {
  const meta = SOURCE_META[source] ?? { icon: "📌", label: source, color: "" };
  const sorted = [...activities].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
      </div>
      <ul className="space-y-1.5 pl-5">
        {sorted.map((a, i) => (
          <li key={i} className="flex items-baseline gap-2.5 text-sm leading-relaxed">
            <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap min-w-[40px]">
              {a.time}
            </span>
            <span className="text-foreground">{a.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayCard({ day }: { day: StandupDay }) {
  const groups = SOURCE_ORDER.reduce<Record<Source, Activity[]>>(
    (acc, src) => {
      const items = day.activities.filter((a) => a.source === src);
      if (items.length) acc[src] = items;
      return acc;
    },
    {} as Record<Source, Activity[]>,
  );

  const presentSources = SOURCE_ORDER.filter((s) => groups[s]);

  return (
    <Card className="bg-surface-card border-surface-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            <span className="text-accent">{day.dayOfWeek}</span>
            {", "}
            {formatDate(day.date, day.dayOfWeek).replace(`${day.dayOfWeek}, `, "")}
          </h2>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {presentSources.map((s) => (
              <SourceBadge key={s} source={s} />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {day.activities.length} update{day.activities.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {presentSources.map((src) => (
          <SourceGroup key={src} source={src} activities={groups[src]} />
        ))}
      </CardContent>
    </Card>
  );
}

interface StandupAppProps {
  days: StandupDay[];
  lastUpdated: string | null;
}

export function StandupApp({ days, lastUpdated }: StandupAppProps) {
  const [filter, setFilter] = useState<Source | "all">("all");

  const FILTER_OPTIONS: { value: Source | "all"; label: string }[] = [
    { value: "all", label: "All Sources" },
    { value: "slack", label: "💬 Slack" },
    { value: "github", label: "🔧 GitHub" },
    { value: "workspace", label: "📝 Workspace" },
    { value: "jira", label: "📋 Jira" },
  ];

  const filteredDays =
    filter === "all"
      ? days
      : days
          .map((day) => ({
            ...day,
            activities: day.activities.filter((a) => a.source === filter),
          }))
          .filter((day) => day.activities.length > 0);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            📋 Daily Standup
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Aggregated updates from Slack, GitHub, and Workspace.
          </p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated:{" "}
            <span className="text-foreground font-medium">{lastUpdated}</span>
          </p>
        )}
      </div>

      {/* Source filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? "outline" : "ghost"}
            size="sm"
            onClick={() => setFilter(opt.value)}
            className={`rounded-full ${
              filter === opt.value
                ? "bg-accent/20 text-accent border-accent/50"
                : "text-muted-foreground border-surface-border hover:border-accent/30 hover:text-foreground"
            }`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Day cards */}
      {filteredDays.length === 0 ? (
        <EmptyState icon="📋" title="No standup entries yet." />
      ) : (
        <div className="space-y-4">
          {filteredDays.map((day) => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Sources: Slack, GitHub, Workspace. Jira integration pending re-auth.
      </p>
    </div>
  );
}
