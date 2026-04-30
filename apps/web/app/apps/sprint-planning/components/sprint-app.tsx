"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  Badge,
  Button,
  StatusBadge,
  EmptyState,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import type {
  SprintData,
  SprintClient,
  SprintItem,
  SprintStatus,
  ArchiveRecord,
  ArchiveType,
} from "../lib/types";

// ── Constants ──────────────────────────────────────────────────────────────

const OUTSTANDING_ORDER: SprintStatus[] = [
  "blocked",
  "in-progress",
  "in-review",
  "not-started",
  "discussion",
];

const STATUS_LABELS: Record<SprintStatus, string> = {
  blocked: "🛑 Blocked",
  "in-progress": "🔄 In Progress",
  "in-review": "👀 In Review / UAT",
  "not-started": "📋 Not Started / Next Up",
  discussion: "💬 Needs Discussion",
  done: "✅ Completed This Week",
};

const STATUS_VARIANT_MAP: Record<
  SprintStatus,
  "error" | "warning" | "info" | "neutral" | "success" | "pending"
> = {
  blocked: "error",
  "in-progress": "warning",
  "in-review": "info",
  "not-started": "neutral",
  discussion: "info",
  done: "success",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  const variantMap: Record<string, "destructive" | "secondary" | "outline"> = {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  };
  return (
    <Badge variant={variantMap[priority] ?? "secondary"} className="text-[11px] px-1.5 py-0.5">
      {priority}
    </Badge>
  );
}

function DueDateBadge({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
  const isOverdue = diffDays <= 0;
  const label = isOverdue
    ? "Overdue"
    : diffDays === 1
      ? "Due tomorrow"
      : `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <Badge
      variant={isOverdue ? "destructive" : "secondary"}
      className="text-[11px] px-2 py-0.5"
    >
      📅 {label}
    </Badge>
  );
}

function SourceLinks({ sources }: { sources?: SprintItem["sources"] }) {
  if (!sources?.length) return null;
  return (
    <span className="flex gap-1 items-center flex-wrap">
      {sources.map((s, i) => {
        const icon =
          s.type === "jira"
            ? "🎫"
            : s.type === "slack"
              ? "💬"
              : s.type === "zoom"
                ? "📹"
                : "🔗";
        const label = s.label ?? s.type;
        if (s.url) {
          return (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent px-1.5 py-0.5 rounded bg-accent/8 hover:bg-accent/18 transition-colors"
            >
              {icon} {label}
            </a>
          );
        }
        return (
          <span
            key={i}
            className="text-[11px] text-accent px-1.5 py-0.5 rounded bg-accent/8"
          >
            {icon} {label}
          </span>
        );
      })}
    </span>
  );
}

function SprintItemRow({ item }: { item: SprintItem }) {
  const jiraLink = item.sources?.find((s) => s.type === "jira");

  return (
    <div className="px-4 py-2.5 border-b border-surface-border last:border-0 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 flex-wrap font-semibold text-sm text-foreground">
        {jiraLink?.url ? (
          <a
            href={jiraLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {item.title}
          </a>
        ) : (
          <span>{item.title}</span>
        )}
        <PriorityBadge priority={item.priority} />
        <DueDateBadge dueDate={item.dueDate} />
      </div>
      <div className="flex gap-2 items-center flex-wrap text-xs text-muted-foreground">
        {item.assignees?.map((a) => (
          <Badge key={a} variant="secondary" className="text-[11px]">
            {a}
          </Badge>
        ))}
        <SourceLinks sources={item.sources} />
      </div>
      {item.summary && (
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {item.summary}
        </p>
      )}
    </div>
  );
}

function StatusGroup({
  status,
  items,
}: {
  status: SprintStatus;
  items: SprintItem[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] border-b border-surface-border">
        <StatusBadge
          variant={STATUS_VARIANT_MAP[status]}
          dot
          className="text-[11px] font-semibold uppercase tracking-wide"
        >
          {STATUS_LABELS[status]}
          <span className="opacity-50 ml-1">({items.length})</span>
        </StatusBadge>
      </div>
      {items.map((item, i) => (
        <SprintItemRow key={i} item={item} />
      ))}
    </div>
  );
}

function DoneSection({
  items,
  clientIndex: _clientIndex,
}: {
  items: SprintItem[];
  clientIndex: number;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-4 py-2 w-full justify-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-surface-border rounded-none h-auto"
      >
        <span
          className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        <StatusBadge variant="success" dot className="text-[11px] font-semibold uppercase tracking-wide">
          {STATUS_LABELS.done}
          <span className="opacity-50 ml-1">({items.length})</span>
        </StatusBadge>
      </Button>
      {open && (
        <div>
          {items.map((item, i) => (
            <div key={i} className="opacity-60">
              <SprintItemRow item={item} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ClientCard({
  client,
  index,
}: {
  client: SprintClient;
  index: number;
}) {
  const byStatus = useMemo(() => {
    const map: Partial<Record<SprintStatus, SprintItem[]>> = {};
    for (const item of client.items ?? []) {
      const s = (item.status ?? "discussion") as SprintStatus;
      if (!map[s]) map[s] = [];
      map[s]!.push(item);
    }
    return map;
  }, [client.items]);

  const totalItems = client.items?.length ?? 0;
  const doneItems = byStatus.done ?? [];
  const outstandingCount = totalItems - doneItems.length;
  const blockedCount = byStatus.blocked?.length ?? 0;

  return (
    <Card className="mb-6 overflow-hidden glass border-surface-border">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-surface border-b-2 border-accent/60">
        <span className="font-bold text-base text-foreground">{client.name}</span>
        <span className="text-[12px] text-muted-foreground">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex gap-3 text-[11px] text-muted-foreground">
          <span>{outstandingCount} outstanding</span>
          {blockedCount > 0 && (
            <span className="text-red">{blockedCount} blocked</span>
          )}
          {doneItems.length > 0 && (
            <span className="text-green">{doneItems.length} done</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="rounded-b-lg overflow-hidden bg-surface">
        {/* Outstanding section label */}
        {OUTSTANDING_ORDER.some((s) => byStatus[s]?.length) && (
          <CardHeader className="px-4 py-2.5 bg-accent/[0.04] border-b border-surface-border space-y-0">
            <CardTitle className="text-[11px] text-accent uppercase tracking-widest font-bold">
              📌 Outstanding &amp; Next Week
            </CardTitle>
          </CardHeader>
        )}

        {OUTSTANDING_ORDER.map((status) => {
          const items = byStatus[status];
          if (!items?.length) return null;
          return (
            <StatusGroup key={status} status={status} items={items} />
          );
        })}

        {/* Done section label + collapsible */}
        {doneItems.length > 0 && (
          <>
            <CardHeader className="px-4 py-2.5 border-b border-surface-border space-y-0">
              <CardTitle className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                Highlights — What Got Done
              </CardTitle>
            </CardHeader>
            <DoneSection items={doneItems} clientIndex={index} />
          </>
        )}

        {!OUTSTANDING_ORDER.some((s) => byStatus[s]?.length) &&
          !doneItems.length && (
            <EmptyState icon="✨" title="No items" className="py-8" />
          )}
      </div>
    </Card>
  );
}

// ── Archives Tab ───────────────────────────────────────────────────────────

const ARCHIVE_TYPE_VARIANT_MAP: Record<ArchiveType, "info" | "neutral" | "success"> = {
  digest: "info",
  overview: "info",
  weekly: "success",
};

const ARCHIVE_TYPE_LABELS: Record<ArchiveType, string> = {
  digest: "Digest",
  overview: "Overview",
  weekly: "Weekly",
};

const SERVICE_CLASS_MAP: Record<string, string> = {
  slack: "bg-brand-slack text-white border-brand-slack",
  jira: "bg-brand-jira text-white border-brand-jira",
  zoom: "bg-brand-zoom text-white border-brand-zoom",
  github: "bg-brand-github text-white border-brand-github",
  calendar: "bg-brand-google text-white border-brand-google",
};

function ArchiveCard({ record }: { record: ArchiveRecord }) {
  const [open, setOpen] = useState(false);
  const summary = record.summary ?? "";
  const truncated = summary.length > 200 ? summary.slice(0, 200) + "…" : summary;

  function renderItems(arr: string[] | undefined, label: string) {
    if (!arr?.length) return null;
    return (
      <div className="mt-3">
        <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">
          {label}
        </div>
        {arr.map((item, i) => (
          <div
            key={i}
            className="text-[13px] text-foreground py-1 border-b border-surface-border last:border-0"
          >
            {typeof item === "string" ? item : JSON.stringify(item)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={open}
      className="glass border border-surface-border rounded-lg p-4 mb-2.5 cursor-pointer hover:border-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm text-foreground">
          {formatDate(record.date)}
        </span>
        <StatusBadge variant={ARCHIVE_TYPE_VARIANT_MAP[record._type]} className="text-[11px] font-semibold">
          {ARCHIVE_TYPE_LABELS[record._type]}
        </StatusBadge>
        {record.service && (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold ${SERVICE_CLASS_MAP[record.service] ?? "bg-surface text-muted-foreground"}`}
          >
            {record.service}
          </Badge>
        )}
        {record.item_count && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {record.item_count} items
          </span>
        )}
      </div>
      {truncated && (
        <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
          {truncated}
        </p>
      )}
      {open && (
        <div className="mt-3 pt-3 border-t border-surface-border">
          {summary.length > 200 && (
            <div className="mb-3">
              <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">
                Full Summary
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">
                {summary}
              </p>
            </div>
          )}
          {record._type === "digest" && renderItems(record.items, "Items")}
          {record._type === "overview" && (
            <>
              {renderItems(record.highlights, "Highlights")}
              {renderItems(record.blockers, "Blockers")}
              {renderItems(record.action_items, "Action Items")}
            </>
          )}
          {record._type === "weekly" && (
            <>
              {renderItems(record.themes, "Themes")}
              {renderItems(record.highlights, "Highlights")}
              {renderItems(record.blockers, "Blockers")}
              {renderItems(record.action_items, "Action Items")}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ArchivesTab({ archives }: { archives: ArchiveRecord[] }) {
  const [typeFilter, setTypeFilter] = useState<"all" | ArchiveType>("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("30");

  const filtered = useMemo(() => {
    let out = archives;
    if (typeFilter !== "all") out = out.filter((r) => r._type === typeFilter);
    if (typeFilter === "digest" && serviceFilter !== "all") {
      out = out.filter((r) => r.service === serviceFilter);
    }
    if (rangeFilter !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(rangeFilter));
      out = out.filter((r) => new Date(r.date) >= cutoff);
    }
    return out;
  }, [archives, typeFilter, serviceFilter, rangeFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Type filter */}
        <div className="flex gap-1">
          {(["all", "digest", "overview", "weekly"] as const).map((t) => (
            <Button
              key={t}
              onClick={() => setTypeFilter(t)}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              className="rounded-full text-[12px]"
            >
              {t === "all"
                ? "All"
                : t === "digest"
                  ? "Daily Digests"
                  : t === "overview"
                    ? "Daily Overviews"
                    : "Weekly Summaries"}
            </Button>
          ))}
        </div>

        {/* Service filter — only for digests */}
        {typeFilter === "digest" && (
          <div className="flex gap-1">
            {(["all", "slack", "jira", "zoom", "github", "calendar"] as const).map(
              (s) => (
                <Button
                  key={s}
                  onClick={() => setServiceFilter(s)}
                  variant={serviceFilter === s ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-[12px]"
                >
                  {s === "all" ? "All" : s}
                </Button>
              ),
            )}
          </div>
        )}

        {/* Date range */}
        <div className="flex gap-1">
          {[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "all", label: "All time" },
          ].map((r) => (
            <Button
              key={r.value}
              onClick={() => setRangeFilter(r.value)}
              variant={rangeFilter === r.value ? "default" : "outline"}
              size="sm"
              className="rounded-full text-[12px]"
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📁" title="No archive records found" className="py-16" />
      ) : (
        filtered.map((r) => <ArchiveCard key={r.id} record={r} />)
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface SprintAppProps {
  archives: ArchiveRecord[];
}

export function SprintApp({ archives }: SprintAppProps) {
  const [sprintData, setSprintData] = useState<SprintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/apps/sprint-planning/data/backlog-meeting.json")
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: SprintData) => {
        setSprintData(data);
        setLoading(false);
      })
      .catch(() => {
        // Data file may not exist yet — show empty state
        setSprintData({ clients: [] });
        setLoading(false);
      });
  }, []);

  return (
    <Tabs defaultValue="agenda">
      <TabsList className="mb-6">
        <TabsTrigger value="agenda">📋 Agenda</TabsTrigger>
        <TabsTrigger value="archives">📁 Archives</TabsTrigger>
      </TabsList>

      <TabsContent value="agenda">
        {sprintData?.lastUpdated && (
          <p className="text-xs text-muted-foreground mb-4">
            Last updated: {formatLastUpdated(sprintData.lastUpdated)}
          </p>
        )}

        {loading && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="animate-spin text-3xl mb-3">⟳</div>
            <p>Loading sprint data…</p>
          </div>
        )}

        {!loading && !sprintData?.clients.length && (
          <EmptyState
            icon="📋"
            title="No backlog data yet"
            description="will populate on next update"
            className="py-16"
          />
        )}

        {!loading &&
          sprintData?.clients.map((client, i) => (
            <ClientCard key={client.name} client={client} index={i} />
          ))}
      </TabsContent>

      <TabsContent value="archives">
        <ArchivesTab archives={archives} />
      </TabsContent>
    </Tabs>
  );
}
