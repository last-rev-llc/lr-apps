"use client";

import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Card } from "@repo/ui";
import type { ZoomTranscript, ActionItem, Sentiment } from "../lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Sentiment Badge ────────────────────────────────────────────────────────

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  productive: "bg-green/12 text-green border-green/20",
  tense: "bg-red/12 text-red border-red/20",
  neutral: "bg-slate/12 text-muted-foreground border-slate/20",
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

// ── Summary Card ───────────────────────────────────────────────────────────

function SummaryCard({ meeting }: { meeting: ZoomTranscript }) {
  const [open, setOpen] = useState(false);

  const attendees = parseJsonField<string | { name: string }>(meeting.attendees);
  const decisions = parseJsonField<unknown>(meeting.decisions);
  const actions = parseJsonField<ActionItem>(meeting.action_items);
  const topics = parseJsonField<string | { name: string }>(meeting.key_topics);
  const hasSummary = !!meeting.summary;

  return (
    <Card className="mb-3 overflow-hidden glass border-surface-border hover:border-accent/30 transition-colors">
      {/* Header */}
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
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent">
              {meeting.client_id}
            </span>
          )}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue/12 text-blue">
            ⏱️ {meeting.duration ?? 0}m
          </span>
          <SentimentBadge sentiment={meeting.sentiment} />
          {!hasSummary && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red/12 text-red">
              ⏳ pending
            </span>
          )}
          <span className="text-[12px] text-muted-foreground">
            {formatDate(meeting.start_time)}
          </span>
        </div>
      </button>

      {/* Expandable body */}
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
                <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1.5">
                  Summary
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">
                  {meeting.summary}
                </p>
              </div>

              {decisions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1.5">
                    Decisions
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
                  <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1.5">
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
                          <strong className="text-accent ml-2">
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
                  <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1.5">
                    Topics
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((t, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-pill-0/12 text-pill-0"
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
              ⏳ Summary not yet generated. Transcript is queued for
              processing.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Action Items Tab ───────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red/15 text-red border-red/20",
  medium: "bg-accent/15 text-accent border-accent/20",
  low: "bg-green/15 text-green border-green/20",
};

function ActionItemCard({
  item,
  onMarkDone,
}: {
  item: ActionItem;
  onMarkDone: (item: ActionItem) => void;
}) {
  const [done, setDone] = useState(
    item.done || item.status === "done",
  );
  const [copied, setCopied] = useState(false);
  const text = textOf(item);
  const pri = (item.priority ?? "medium").toLowerCase();

  const handleMarkDone = () => {
    setDone(true);
    onMarkDone(item);
  };

  const handleCopyFollowup = async () => {
    const cmd = `/followup ${item.owner ?? "team"}: ${text} (from ${item._meetingTopic ?? "meeting"})`;
    await navigator.clipboard.writeText(cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className={`mb-2.5 glass border-surface-border ${done ? "opacity-40" : ""}`}
    >
      <div className="p-4">
        <div
          className={`font-semibold text-sm text-foreground mb-2 ${done ? "line-through" : ""}`}
        >
          {text}
        </div>
        <div className="flex flex-wrap gap-2 items-center text-[12px] text-muted-foreground mb-3">
          {item.owner && (
            <span className="px-2 py-0.5 rounded bg-accent/12 text-accent font-semibold">
              👤 {item.owner}
            </span>
          )}
          {item.priority && (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[pri] ?? PRIORITY_STYLES.medium}`}
            >
              {item.priority}
            </span>
          )}
          {item.deadline && (
            <span className="text-[11px] text-muted-foreground">
              📅 {item.deadline}
            </span>
          )}
          {item._meetingTopic && (
            <span className="text-[11px] italic">
              from: {item._meetingTopic} · {formatDate(item._meetingDate)}
            </span>
          )}
          {item._clientId && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent">
              {item._clientId}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCopyFollowup}
            disabled={done}
            className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-accent/40 hover:bg-accent/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? "📋 Copied" : "📧 Generate Follow-up"}
          </button>
          <button
            onClick={handleMarkDone}
            disabled={done}
            className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-green/40 hover:bg-green/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {done ? "✅" : "✅ Done"}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface MeetingsAppProps {
  meetings: ZoomTranscript[];
}

export function MeetingsApp({ meetings }: MeetingsAppProps) {
  const [search, setSearch] = useState("");
  const [rangeFilter, setRangeFilter] = useState("30");
  const [actionSearch, setActionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  // Summaries tab filtering
  const filteredMeetings = useMemo(() => {
    let out = meetings;
    if (rangeFilter !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(rangeFilter));
      out = out.filter(
        (m) => m.start_time && new Date(m.start_time) >= cutoff,
      );
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
  }, [meetings, rangeFilter, search]);

  // Action items from all meetings
  const allActionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];
    for (const m of meetings) {
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
  }, [meetings]);

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
      out = out.filter(
        (a) => (a.priority ?? "medium").toLowerCase() === priorityFilter,
      );
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
    <Tabs defaultValue="summaries">
      <TabsList className="mb-6">
        <TabsTrigger value="summaries">📝 Summaries</TabsTrigger>
        <TabsTrigger value="actions">⚡ Action Items</TabsTrigger>
      </TabsList>

      {/* Summaries Tab */}
      <TabsContent value="summaries">
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
          />
          <div className="flex gap-1">
            {[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
              { value: "all", label: "All" },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setRangeFilter(r.value)}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  rangeFilter === r.value
                    ? "bg-accent text-black border-accent"
                    : "border-surface-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📝</div>
            <p>No meetings found</p>
          </div>
        ) : (
          filteredMeetings.map((m) => (
            <SummaryCard key={m.id} meeting={m} />
          ))
        )}
      </TabsContent>

      {/* Action Items Tab */}
      <TabsContent value="actions">
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            type="text"
            placeholder="Search action items…"
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            className="flex-1 min-w-[180px] bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
          />

          {/* Status filter */}
          <div className="flex gap-1">
            {["all", "open", "done"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === s
                    ? "bg-accent text-black border-accent"
                    : "border-surface-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {s === "all" ? "All" : s === "open" ? "Open" : "Done"}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <div className="flex gap-1">
            {["all", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  priorityFilter === p
                    ? "bg-accent text-black border-accent"
                    : "border-surface-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">⚡</div>
            <p>No action items found</p>
          </div>
        ) : (
          filteredActions.map((item, i) => (
            <ActionItemCard
              key={`${item._meetingId}-${item._idx ?? i}`}
              item={item}
              onMarkDone={handleMarkDone}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
