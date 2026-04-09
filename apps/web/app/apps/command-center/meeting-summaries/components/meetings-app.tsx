"use client";

import { useState, useMemo, useCallback } from "react";
import { Badge, Button, Card, EmptyState, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import type { ZoomTranscript, ActionItem, Sentiment } from "../lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseJsonField<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  try {
    return JSON.parse(val as string) as T[];
  } catch {
    return [];
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function textOf(item: unknown): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  const o = item as Record<string, string>;
  return o.action ?? o.title ?? o.text ?? o.decision ?? JSON.stringify(item);
}

// ── Sentiment Badge ────────────────────────────────────────────────────────────

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  productive: "bg-green-500/12 text-green-400 border-green-500/20",
  tense: "bg-red-500/12 text-red-400 border-red-500/20",
  neutral: "bg-gray-500/12 text-muted-foreground border-gray-500/20",
};

function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  if (!sentiment) return null;
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${SENTIMENT_STYLES[sentiment] ?? SENTIMENT_STYLES.neutral}`}
    >
      {sentiment}
    </span>
  );
}

// ── Summary Card ───────────────────────────────────────────────────────────────

function SummaryCard({ meeting }: { meeting: ZoomTranscript }) {
  const [open, setOpen] = useState(false);

  const attendees = parseJsonField<string | { name: string }>(meeting.attendees);
  const decisions = parseJsonField<unknown>(meeting.decisions);
  const actions = parseJsonField<ActionItem>(meeting.action_items);
  const topics = parseJsonField<string | { name: string }>(meeting.key_topics);
  const hasSummary = !!meeting.summary;

  return (
    <Card className="overflow-hidden hover:border-amber-500/30 transition-colors">
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left flex-wrap"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        <span className="font-bold text-[15px] text-foreground flex-1 min-w-0">
          {meeting.topic ?? "Untitled Meeting"}
        </span>
        <div className="flex flex-wrap gap-2 items-center">
          {meeting.client_id && (
            <Badge variant="secondary" className="text-[11px] bg-amber-500/15 text-amber-400 border-0">
              {meeting.client_id}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[11px] bg-blue-500/12 text-blue-400 border-0">
            ⏱️ {meeting.duration ?? 0}m
          </Badge>
          <SentimentBadge sentiment={meeting.sentiment} />
          {!hasSummary && (
            <Badge variant="secondary" className="text-[11px] bg-red-500/12 text-red-400 border-0">
              ⏳ pending
            </Badge>
          )}
          <span className="text-[12px] text-muted-foreground">
            {formatDate(meeting.start_time)}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-surface-border">
          {attendees.length > 0 && (
            <p className="text-[12px] text-muted-foreground mt-3 mb-2">
              👥{" "}
              {attendees
                .map((a) => (typeof a === "string" ? a : a.name))
                .join(", ")}
            </p>
          )}

          {hasSummary ? (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                  Summary
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">
                  {meeting.summary}
                </p>
              </div>

              {decisions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                    Key Decisions
                  </div>
                  <ul className="space-y-0">
                    {decisions.map((d, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-foreground py-1 border-b border-surface-border last:border-0"
                      >
                        ✅ {textOf(d)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {actions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                    Action Items ({actions.length})
                  </div>
                  <ul className="space-y-0">
                    {actions.map((a, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-foreground py-1 border-b border-surface-border last:border-0"
                      >
                        {textOf(a)}
                        {a.owner && (
                          <strong className="text-amber-400 ml-2">
                            — {a.owner}
                          </strong>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {topics.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                    Topics
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((t, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-purple-500/12 text-purple-400"
                      >
                        {typeof t === "string" ? t : t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground mt-3">
              ⏳ Summary not yet generated. Transcript is queued for processing.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Action Item Card ───────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-green-500/15 text-green-400 border-green-500/20",
};

function ActionItemRow({ item, onMarkDone }: { item: ActionItem; onMarkDone: (item: ActionItem) => void }) {
  const [done, setDone] = useState(item.done || item.status === "done");
  const text = textOf(item);
  const pri = (item.priority ?? "medium").toLowerCase();

  return (
    <Card className={`mb-2 ${done ? "opacity-40" : ""}`}>
      <div className="p-3">
        <div className={`font-semibold text-sm text-foreground mb-1.5 ${done ? "line-through" : ""}`}>
          {text}
        </div>
        <div className="flex flex-wrap gap-2 items-center text-[12px] text-muted-foreground mb-2">
          {item.owner && (
            <Badge variant="secondary" className="bg-amber-500/12 text-amber-400 border-0">
              👤 {item.owner}
            </Badge>
          )}
          {item.priority && (
            <Badge variant="outline" className={`text-[11px] ${PRIORITY_STYLES[pri] ?? PRIORITY_STYLES.medium}`}>
              {item.priority}
            </Badge>
          )}
          {item.deadline && (
            <span className="text-[11px]">📅 {item.deadline}</span>
          )}
          {item._meetingTopic && (
            <span className="text-[11px] italic">
              from: {item._meetingTopic}
            </span>
          )}
          {item._clientId && (
            <Badge variant="secondary" className="text-[11px] bg-amber-500/15 text-amber-400 border-0">
              {item._clientId}
            </Badge>
          )}
        </div>
        <button
          onClick={() => { setDone(true); onMarkDone(item); }}
          disabled={done}
          className="text-[12px] font-semibold px-3 py-1 rounded-lg border border-surface-border bg-surface hover:border-green-500/40 hover:bg-green-500/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {done ? "✅ Done" : "Mark Done"}
        </button>
      </div>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface MeetingsAppProps {
  initialMeetings: ZoomTranscript[];
}

export function MeetingsApp({ initialMeetings }: MeetingsAppProps) {
  const [search, setSearch] = useState("");
  const [rangeFilter, setRangeFilter] = useState("30");
  const [actionSearch, setActionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const filteredMeetings = useMemo(() => {
    let out = initialMeetings;
    if (rangeFilter !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(rangeFilter));
      out = out.filter((m) => m.start_time && new Date(m.start_time) >= cutoff);
    }
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (m) =>
          (m.topic ?? "").toLowerCase().includes(q) ||
          (m.summary ?? "").toLowerCase().includes(q) ||
          parseJsonField<string>(m.attendees).join(" ").toLowerCase().includes(q) ||
          (m.client_id ?? "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [initialMeetings, rangeFilter, search]);

  const allActionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];
    for (const m of initialMeetings) {
      const actions = parseJsonField<ActionItem>(m.action_items);
      actions.forEach((a, idx) => {
        items.push({
          ...(typeof a === "string" ? { action: a } : a),
          _meetingTopic: m.topic,
          _meetingDate: m.start_time,
          _meetingId: m.id,
          _clientId: m.client_id,
          _idx: idx,
        });
      });
    }
    return items;
  }, [initialMeetings]);

  const filteredActions = useMemo(() => {
    let out = allActionItems;
    if (statusFilter === "open") {
      out = out.filter(
        (a) => !a.done && a.status !== "done" && !doneIds.has(`${a._meetingId}-${a._idx}`),
      );
    } else if (statusFilter === "done") {
      out = out.filter(
        (a) => a.done || a.status === "done" || doneIds.has(`${a._meetingId}-${a._idx}`),
      );
    }
    if (priorityFilter !== "all") {
      out = out.filter((a) => (a.priority ?? "medium").toLowerCase() === priorityFilter);
    }
    if (actionSearch) {
      const q = actionSearch.toLowerCase();
      out = out.filter(
        (a) =>
          textOf(a).toLowerCase().includes(q) ||
          (a.owner ?? "").toLowerCase().includes(q) ||
          (a._meetingTopic ?? "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [allActionItems, statusFilter, priorityFilter, actionSearch, doneIds]);

  const handleMarkDone = useCallback((item: ActionItem) => {
    const key = `${item._meetingId}-${item._idx}`;
    setDoneIds((prev) => new Set([...prev, key]));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Meeting Summaries"
        subtitle={`${initialMeetings.length} meetings · ${allActionItems.length} action items`}
      />

      <Tabs defaultValue="summaries">
        <TabsList>
          <TabsTrigger value="summaries">📝 Summaries</TabsTrigger>
          <TabsTrigger value="actions">⚡ Action Items</TabsTrigger>
        </TabsList>

        {/* Summaries Tab */}
        <TabsContent value="summaries">
          <div className="flex flex-wrap gap-3 mt-4 mb-5">
            <input
              type="text"
              placeholder="Search meetings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/60"
            />
            <div className="flex gap-1">
              {[
                { value: "7", label: "7 days" },
                { value: "30", label: "30 days" },
                { value: "90", label: "90 days" },
                { value: "all", label: "All" },
              ].map((r) => (
                <Button
                  key={r.value}
                  variant={rangeFilter === r.value ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setRangeFilter(r.value)}
                  className={rangeFilter === r.value ? "bg-amber-500 text-black border-amber-500" : ""}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredMeetings.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No meetings found"
              description="Try adjusting the date range or search query"
            />
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map((m) => (
                <SummaryCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions">
          <div className="flex flex-wrap gap-3 mt-4 mb-5">
            <input
              type="text"
              placeholder="Search action items…"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="flex-1 min-w-[180px] bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/60"
            />
            <div className="flex gap-1">
              {["all", "open", "done"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className={statusFilter === s ? "bg-amber-500 text-black border-amber-500" : ""}
                >
                  {s === "all" ? "All" : s === "open" ? "Open" : "Done"}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {["all", "high", "medium", "low"].map((p) => (
                <Button
                  key={p}
                  variant={priorityFilter === p ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => setPriorityFilter(p)}
                  className={priorityFilter === p ? "bg-amber-500 text-black border-amber-500" : ""}
                >
                  {p === "all" ? "All Priority" : p}
                </Button>
              ))}
            </div>
          </div>

          {filteredActions.length === 0 ? (
            <EmptyState
              icon="⚡"
              title="No action items found"
              description="All caught up, or try adjusting the filters"
            />
          ) : (
            filteredActions.map((item, i) => (
              <ActionItemRow
                key={`${item._meetingId}-${item._idx ?? i}`}
                item={item}
                onMarkDone={handleMarkDone}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
