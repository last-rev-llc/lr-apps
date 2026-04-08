"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Card } from "@repo/ui";
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

const STATUS_DOT_COLORS: Record<SprintStatus, string> = {
  blocked: "bg-red-500",
  "in-progress": "bg-amber-500",
  "in-review": "bg-purple-500",
  "not-started": "bg-gray-400",
  discussion: "bg-blue-500",
  done: "bg-green-500",
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
  const variants: Record<string, string> = {
    high: "bg-red-500/15 text-red-400 border-red-500/20",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    low: "bg-green-500/15 text-green-400 border-green-500/20",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded border ${variants[priority] ?? variants.medium}`}
    >
      {priority}
    </span>
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
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded ${
        isOverdue
          ? "bg-red-500/12 text-red-400"
          : "bg-amber-500/12 text-amber-400"
      }`}
    >
      📅 {label}
    </span>
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
              className="text-[11px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/8 hover:bg-amber-500/18 transition-colors"
            >
              {icon} {label}
            </a>
          );
        }
        return (
          <span
            key={i}
            className="text-[11px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/8"
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
            className="text-amber-400 hover:underline"
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
          <span
            key={a}
            className="px-1.5 py-0.5 rounded bg-surface-hover text-foreground text-[11px]"
          >
            {a}
          </span>
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
      <div className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] border-b border-surface-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        <span
          className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[status]}`}
        />
        {STATUS_LABELS[status]}
        <span className="opacity-50">({items.length})</span>
      </div>
      {items.map((item, i) => (
        <SprintItemRow key={i} item={item} />
      ))}
    </div>
  );
}

function DoneSection({
  items,
  clientIndex,
}: {
  items: SprintItem[];
  clientIndex: number;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-4 py-2 w-full text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hover:bg-white/[0.03] border-b border-surface-border transition-colors"
      >
        <span
          className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        <span className="w-2 h-2 rounded-full bg-green-500" />
        {STATUS_LABELS.done}
        <span className="opacity-50">({items.length})</span>
      </button>
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
      <div className="flex items-center gap-2.5 px-4 py-3 bg-surface border-b-2 border-amber-500/60">
        <span className="font-bold text-base text-foreground">{client.name}</span>
        <span className="text-[12px] text-muted-foreground">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex gap-3 text-[11px] text-muted-foreground">
          <span>{outstandingCount} outstanding</span>
          {blockedCount > 0 && (
            <span className="text-red-400">{blockedCount} blocked</span>
          )}
          {doneItems.length > 0 && (
            <span className="text-green-400">{doneItems.length} done</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="rounded-b-lg overflow-hidden bg-surface">
        {/* Outstanding section label */}
        {OUTSTANDING_ORDER.some((s) => byStatus[s]?.length) && (
          <div className="px-4 py-2.5 text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/[0.04] border-b border-surface-border">
            📌 Outstanding &amp; Next Week
          </div>
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
            <div className="px-4 py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-surface-border">
              Highlights — What Got Done
            </div>
            <DoneSection items={doneItems} clientIndex={index} />
          </>
        )}

        {!OUTSTANDING_ORDER.some((s) => byStatus[s]?.length) &&
          !doneItems.length && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              ✨ No items
            </div>
          )}
      </div>
    </Card>
  );
}

// ── Archives Tab ───────────────────────────────────────────────────────────

const ARCHIVE_TYPE_COLORS: Record<ArchiveType, string> = {
  digest: "bg-amber-500/15 text-amber-400",
  overview: "bg-blue-500/15 text-blue-400",
  weekly: "bg-purple-500/15 text-purple-400",
};

const SERVICE_COLORS: Record<string, string> = {
  slack: "bg-brand-slack text-white",
  jira: "bg-brand-jira text-white",
  zoom: "bg-brand-zoom text-white",
  github: "bg-brand-github text-white",
  calendar: "bg-brand-google text-white",
};

function ArchiveCard({ record }: { record: ArchiveRecord }) {
  const [open, setOpen] = useState(false);
  const summary = record.summary ?? "";
  const truncated = summary.length > 200 ? summary.slice(0, 200) + "…" : summary;

  function renderItems(arr: string[] | undefined, label: string) {
    if (!arr?.length) return null;
    return (
      <div className="mt-3">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1">
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
      className="glass border border-surface-border rounded-lg p-4 mb-2.5 cursor-pointer hover:border-amber-500/40 transition-colors"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm text-foreground">
          {formatDate(record.date)}
        </span>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${ARCHIVE_TYPE_COLORS[record._type]}`}
        >
          {record._type === "digest"
            ? "Digest"
            : record._type === "overview"
              ? "Overview"
              : "Weekly"}
        </span>
        {record.service && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${SERVICE_COLORS[record.service] ?? "bg-surface text-muted-foreground"}`}
          >
            {record.service}
          </span>
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
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1">
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
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                typeFilter === t
                  ? "bg-amber-500 text-black border-amber-500"
                  : "border-surface-border text-muted-foreground hover:border-amber-500/40"
              }`}
            >
              {t === "all"
                ? "All"
                : t === "digest"
                  ? "Daily Digests"
                  : t === "overview"
                    ? "Daily Overviews"
                    : "Weekly Summaries"}
            </button>
          ))}
        </div>

        {/* Service filter — only for digests */}
        {typeFilter === "digest" && (
          <div className="flex gap-1">
            {(["all", "slack", "jira", "zoom", "github", "calendar"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setServiceFilter(s)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    serviceFilter === s
                      ? "bg-amber-500 text-black border-amber-500"
                      : "border-surface-border text-muted-foreground hover:border-amber-500/40"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
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
            <button
              key={r.value}
              onClick={() => setRangeFilter(r.value)}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                rangeFilter === r.value
                  ? "bg-amber-500 text-black border-amber-500"
                  : "border-surface-border text-muted-foreground hover:border-amber-500/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">📁</div>
          <p>No archive records found</p>
        </div>
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
  const [error, setError] = useState<string | null>(null);

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

        {!loading && (!sprintData?.clients.length) && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <p>No backlog data yet — will populate on next update</p>
          </div>
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
