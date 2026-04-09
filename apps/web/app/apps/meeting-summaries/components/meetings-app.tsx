"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  Badge,
  Button,
  EmptyState,
  Search,
  PillList,
} from "@repo/ui";
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
  productive: "bg-green-500/12 text-green-400 border-green-500/20",
  tense: "bg-red-500/12 text-red-400 border-red-500/20",
  neutral: "bg-gray-500/12 text-muted-foreground border-gray-500/20",
};

function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  if (!sentiment) return null;
  return (
    <Badge
      variant="outline"
      className={SENTIMENT_STYLES[sentiment] ?? SENTIMENT_STYLES.neutral}
    >
      {sentiment}
    </Badge>
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
    <Card className="mb-3 overflow-hidden glass border-surface-border hover:border-amber-500/30 transition-colors">
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
            <Badge variant="outline" className="bg-amber-500/15 text-amber-400">
              {meeting.client_id}
            </Badge>
          )}
          <Badge variant="outline" className="bg-blue-500/12 text-blue-400">
            ⏱️ {meeting.duration ?? 0}m
          </Badge>
          <SentimentBadge sentiment={meeting.sentiment} />
          {!hasSummary && (
            <Badge variant="outline" className="bg-red-500/12 text-red-400">
              ⏳ pending
            </Badge>
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
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-purple-500/12 text-purple-400"
                      >
                        {typeof t === "string" ? t : t.name}
                      </Badge>
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
  high: "bg-red-500/15 text-red-400 border-red-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-green-500/15 text-green-400 border-green-500/20",
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
            <Badge variant="outline" className="bg-amber-500/12 text-amber-400">
              👤 {item.owner}
            </Badge>
          )}
          {item.priority && (
            <Badge
              variant="outline"
              className={PRIORITY_STYLES[pri] ?? PRIORITY_STYLES.medium}
            >
              {item.priority}
            </Badge>
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
            <Badge variant="outline" className="bg-amber-500/15 text-amber-400">
              {item._clientId}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFollowup}
            disabled={done}
          >
            {copied ? "📋 Copied" : "📧 Generate Follow-up"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkDone}
            disabled={done}
          >
            {done ? "✅" : "✅ Done"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Filter constants ──────────────────────────────────────────────────────

const DATE_RANGE_ITEMS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All", value: "all" },
];

const STATUS_ITEMS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Done", value: "done" },
];

const PRIORITY_ITEMS = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

function labelForValue(
  items: { label: string; value: string }[],
  value: string,
): string {
  return items.find((i) => i.value === value)?.label ?? value;
}

function valueForLabel(
  items: { label: string; value: string }[],
  label: string,
): string {
  return items.find((i) => i.label === label)?.value ?? label;
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
          <Search
            value={search}
            onChange={setSearch}
            placeholder="Search meetings…"
            debounce={0}
            className="flex-1 min-w-[180px]"
          />
          <PillList
            items={DATE_RANGE_ITEMS.map((i) => i.label)}
            selected={labelForValue(DATE_RANGE_ITEMS, rangeFilter)}
            onSelect={(label) => setRangeFilter(valueForLabel(DATE_RANGE_ITEMS, label))}
            size="sm"
          />
        </div>

        {filteredMeetings.length === 0 ? (
          <EmptyState icon="📝" title="No meetings found" />
        ) : (
          filteredMeetings.map((m) => (
            <SummaryCard key={m.id} meeting={m} />
          ))
        )}
      </TabsContent>

      {/* Action Items Tab */}
      <TabsContent value="actions">
        <div className="flex flex-wrap gap-3 mb-5">
          <Search
            value={actionSearch}
            onChange={setActionSearch}
            placeholder="Search action items…"
            debounce={0}
            className="flex-1 min-w-[180px]"
          />

          {/* Status filter */}
          <PillList
            items={STATUS_ITEMS.map((i) => i.label)}
            selected={labelForValue(STATUS_ITEMS, statusFilter)}
            onSelect={(label) => setStatusFilter(valueForLabel(STATUS_ITEMS, label))}
            size="sm"
          />

          {/* Priority filter */}
          <PillList
            items={PRIORITY_ITEMS.map((i) => i.label)}
            selected={labelForValue(PRIORITY_ITEMS, priorityFilter)}
            onSelect={(label) => setPriorityFilter(valueForLabel(PRIORITY_ITEMS, label))}
            size="sm"
          />
        </div>

        {filteredActions.length === 0 ? (
          <EmptyState icon="⚡" title="No action items found" />
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
