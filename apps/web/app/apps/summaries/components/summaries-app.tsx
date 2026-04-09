"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, Badge, EmptyState, Search, Input } from "@repo/ui";
import type {
  SummaryItem,
  ZoomSummary,
  SlackSummary,
  JiraSummary,
  DayGroup,
  JiraPriority,
  JiraStatus,
} from "../lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = date.toDateString();
  if (d === today.toDateString()) return "Today";
  if (d === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDay(items: SummaryItem[]): DayGroup[] {
  const map = new Map<string, SummaryItem[]>();
  for (const item of items) {
    const key = new Date(item.created_at).toDateString();
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, summaries]) => ({
      date,
      label: formatDayLabel(date),
      summaries,
    }));
}

function titleOf(item: SummaryItem): string {
  if (item.source === "zoom") return item.meeting_topic;
  if (item.source === "slack") return item.short_summary ?? "Slack Thread";
  if (item.source === "jira") return item.ticket_key;
  return "Summary";
}

function shortSummaryOf(item: SummaryItem): string {
  return item.short_summary ?? "No summary available.";
}

function matchesSearch(item: SummaryItem, q: string): boolean {
  const lower = q.toLowerCase();
  if (titleOf(item).toLowerCase().includes(lower)) return true;
  if ((item.short_summary ?? "").toLowerCase().includes(lower)) return true;
  return false;
}

function inDateRange(
  item: SummaryItem,
  from: string,
  to: string
): boolean {
  const d = new Date(item.created_at);
  if (from && d < new Date(from)) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
}

// ── Badge color maps ──────────────────────────────────────────────────────

const SOURCE_BADGE: Record<string, string> = {
  zoom: "bg-blue-500/15 text-blue-400 border-0",
  slack: "bg-purple-500/15 text-purple-400 border-0",
  jira: "bg-cyan-500/15 text-cyan-400 border-0",
};

const TONE_BADGE: Record<string, string> = {
  positive: "bg-green-500/15 text-green-400 border-0",
  neutral: "bg-gray-500/15 text-muted-foreground border-0",
  negative: "bg-red-500/15 text-red-400 border-0",
};

const PRIORITY_BADGE: Record<string, string> = {
  highest: "bg-red-500/15 text-red-400 border-0",
  high: "bg-amber-500/15 text-amber-400 border-0",
  medium: "bg-blue-500/15 text-blue-400 border-0",
  low: "bg-gray-500/15 text-muted-foreground border-0",
  lowest: "bg-gray-500/15 text-muted-foreground border-0",
};

const STATUS_BADGE: Record<string, string> = {
  done: "bg-green-500/15 text-green-400 border-0",
  in_review: "bg-blue-500/15 text-blue-400 border-0",
  in_progress: "bg-amber-500/15 text-amber-400 border-0",
  to_do: "bg-gray-500/15 text-muted-foreground border-0",
};

// ── Summary Card ───────────────────────────────────────────────────────────

function SummaryCard({ item }: { item: SummaryItem }) {
  const [open, setOpen] = useState(false);
  const title = titleOf(item);
  const short = shortSummaryOf(item);
  const date = formatDayLabel(item.created_at);

  return (
    <Card className="overflow-hidden glass border-surface-border hover:border-sky-500/30 transition-colors">
      <button
        className="w-full flex items-start gap-2.5 px-4 py-3.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`text-muted-foreground mt-0.5 transition-transform duration-200 shrink-0 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] text-foreground leading-snug mb-1.5">
            {title}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
            {/* Source badge */}
            <Badge
              variant="secondary"
              className={`text-[11px] ${SOURCE_BADGE[item.source]}`}
            >
              {item.source === "zoom"
                ? "📹 Zoom"
                : item.source === "slack"
                  ? "💬 Slack"
                  : "🎯 Jira"}
            </Badge>
            {/* Tone (slack) */}
            {item.source === "slack" && item.tone && (
              <Badge
                variant="secondary"
                className={`text-[11px] ${TONE_BADGE[item.tone] ?? TONE_BADGE.neutral}`}
              >
                {item.tone}
              </Badge>
            )}
            {/* Priority + status (jira) */}
            {item.source === "jira" && item.priority && (
              <Badge
                variant="secondary"
                className={`text-[11px] ${PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.medium}`}
              >
                {item.priority}
              </Badge>
            )}
            {item.source === "jira" && item.status && (
              <Badge
                variant="secondary"
                className={`text-[11px] ${STATUS_BADGE[item.status] ?? STATUS_BADGE.to_do}`}
              >
                {item.status.replace("_", " ")}
              </Badge>
            )}
            {/* Channel (slack) */}
            {item.source === "slack" && item.channel_id && (
              <span className="text-[11px] text-muted-foreground">
                #{item.channel_id}
              </span>
            )}
            <span className="text-[12px] text-muted-foreground ml-auto">
              {date}
            </span>
          </div>
          {!open && (
            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
              {short}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-surface-border space-y-4">
          {/* Short summary */}
          <div>
            <div className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mt-3 mb-1.5">
              Summary
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{short}</p>
          </div>

          {/* Long summary */}
          {item.long_summary && item.long_summary !== short && (
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1.5">
                Full Summary
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">
                {item.long_summary}
              </p>
            </div>
          )}

          {/* Zoom-specific: action items + key decisions */}
          {item.source === "zoom" && (
            <>
              {item.action_items && item.action_items.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1.5">
                    Action Items
                  </div>
                  <ul className="space-y-0">
                    {item.action_items.map((a, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-foreground py-1 border-b border-surface-border last:border-0"
                      >
                        • {String(a)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.key_decisions && item.key_decisions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1.5">
                    Key Decisions
                  </div>
                  <ul className="space-y-0">
                    {item.key_decisions.map((d, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-foreground py-1 border-b border-surface-border last:border-0"
                      >
                        ✅ {String(d)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Slack-specific: participants */}
          {item.source === "slack" && item.participants && item.participants.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1.5">
                Participants
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.participants.map((p, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[11px] bg-purple-500/15 text-purple-400 border-0"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Grouped List ───────────────────────────────────────────────────────────

function GroupedList({ items }: { items: SummaryItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No summaries found"
        description="Try adjusting your filters"
      />
    );
  }

  const groups = groupByDay(items);
  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={group.date}>
          <div
            className={`text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 ${
              gi > 0 ? "pt-2 border-t border-surface-border" : ""
            }`}
          >
            {group.label}
          </div>
          <div className="space-y-2">
            {group.summaries.map((item) => (
              <SummaryCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────

const selectCls =
  "bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500/60";

function DateRange({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        className="w-36"
      />
      <span className="text-muted-foreground text-sm">—</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        className="w-36"
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface SummariesAppProps {
  zoom: ZoomSummary[];
  slack: SlackSummary[];
  jira: JiraSummary[];
  all: SummaryItem[];
  slackChannels: string[];
}

export function SummariesApp({
  zoom,
  slack,
  jira,
  all,
  slackChannels,
}: SummariesAppProps) {
  // All tab
  const [allSearch, setAllSearch] = useState("");
  const [allFrom, setAllFrom] = useState("");
  const [allTo, setAllTo] = useState("");

  // Zoom tab
  const [zoomSearch, setZoomSearch] = useState("");
  const [zoomFrom, setZoomFrom] = useState("");
  const [zoomTo, setZoomTo] = useState("");

  // Slack tab
  const [slackSearch, setSlackSearch] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [slackFrom, setSlackFrom] = useState("");
  const [slackTo, setSlackTo] = useState("");

  // Jira tab
  const [jiraSearch, setJiraSearch] = useState("");
  const [jiraPriority, setJiraPriority] = useState<JiraPriority | "">("");
  const [jiraStatus, setJiraStatus] = useState<JiraStatus | "">("");
  const [jiraFrom, setJiraFrom] = useState("");
  const [jiraTo, setJiraTo] = useState("");

  const filteredAll = useMemo((): SummaryItem[] => {
    return all.filter(
      (item) =>
        (!allSearch || matchesSearch(item, allSearch)) &&
        inDateRange(item, allFrom, allTo)
    );
  }, [all, allSearch, allFrom, allTo]);

  const filteredZoom = useMemo((): SummaryItem[] => {
    return zoom
      .filter(
        (item) =>
          (!zoomSearch || matchesSearch({ ...item, source: "zoom" }, zoomSearch)) &&
          inDateRange({ ...item, source: "zoom" }, zoomFrom, zoomTo)
      )
      .map((item) => ({ ...item, source: "zoom" as const }));
  }, [zoom, zoomSearch, zoomFrom, zoomTo]);

  const filteredSlack = useMemo((): SummaryItem[] => {
    return slack
      .filter(
        (item) =>
          (!slackSearch ||
            matchesSearch({ ...item, source: "slack" }, slackSearch)) &&
          inDateRange({ ...item, source: "slack" }, slackFrom, slackTo) &&
          (!slackChannel || item.channel_id === slackChannel)
      )
      .map((item) => ({ ...item, source: "slack" as const }));
  }, [slack, slackSearch, slackFrom, slackTo, slackChannel]);

  const filteredJira = useMemo((): SummaryItem[] => {
    return jira
      .filter(
        (item) =>
          (!jiraSearch ||
            matchesSearch({ ...item, source: "jira" }, jiraSearch)) &&
          inDateRange({ ...item, source: "jira" }, jiraFrom, jiraTo) &&
          (!jiraPriority || item.priority === jiraPriority) &&
          (!jiraStatus || item.status === jiraStatus)
      )
      .map((item) => ({ ...item, source: "jira" as const }));
  }, [jira, jiraSearch, jiraFrom, jiraTo, jiraPriority, jiraStatus]);

  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        <TabsTrigger value="zoom">📹 Zoom ({zoom.length})</TabsTrigger>
        <TabsTrigger value="slack">💬 Slack ({slack.length})</TabsTrigger>
        <TabsTrigger value="jira">🎯 Jira ({jira.length})</TabsTrigger>
      </TabsList>

      {/* ── All Tab ── */}
      <TabsContent value="all">
        <div className="flex flex-wrap gap-3 mb-5">
          <Search
            value={allSearch}
            onChange={setAllSearch}
            placeholder="Search all summaries…"
            debounce={0}
            className="flex-1 min-w-[200px]"
          />
          <DateRange
            from={allFrom}
            to={allTo}
            onFrom={setAllFrom}
            onTo={setAllTo}
          />
        </div>
        <GroupedList items={filteredAll} />
      </TabsContent>

      {/* ── Zoom Tab ── */}
      <TabsContent value="zoom">
        <div className="flex flex-wrap gap-3 mb-5">
          <Search
            value={zoomSearch}
            onChange={setZoomSearch}
            placeholder="Search Zoom summaries…"
            debounce={0}
            className="flex-1 min-w-[200px]"
          />
          <DateRange
            from={zoomFrom}
            to={zoomTo}
            onFrom={setZoomFrom}
            onTo={setZoomTo}
          />
        </div>
        <GroupedList items={filteredZoom} />
      </TabsContent>

      {/* ── Slack Tab ── */}
      <TabsContent value="slack">
        <div className="flex flex-wrap gap-3 mb-5">
          <Search
            value={slackSearch}
            onChange={setSlackSearch}
            placeholder="Search Slack summaries…"
            debounce={0}
            className="flex-1 min-w-[200px]"
          />
          <select
            value={slackChannel}
            onChange={(e) => setSlackChannel(e.target.value)}
            className={selectCls}
          >
            <option value="">All Channels</option>
            {slackChannels.map((ch) => (
              <option key={ch} value={ch}>
                #{ch}
              </option>
            ))}
          </select>
          <DateRange
            from={slackFrom}
            to={slackTo}
            onFrom={setSlackFrom}
            onTo={setSlackTo}
          />
        </div>
        <GroupedList items={filteredSlack} />
      </TabsContent>

      {/* ── Jira Tab ── */}
      <TabsContent value="jira">
        <div className="flex flex-wrap gap-3 mb-5">
          <Search
            value={jiraSearch}
            onChange={setJiraSearch}
            placeholder="Search Jira summaries…"
            debounce={0}
            className="flex-1 min-w-[200px]"
          />
          <select
            value={jiraPriority}
            onChange={(e) => setJiraPriority(e.target.value as JiraPriority | "")}
            className={selectCls}
          >
            <option value="">All Priorities</option>
            <option value="highest">Highest</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="lowest">Lowest</option>
          </select>
          <select
            value={jiraStatus}
            onChange={(e) => setJiraStatus(e.target.value as JiraStatus | "")}
            className={selectCls}
          >
            <option value="">All Statuses</option>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </select>
          <DateRange
            from={jiraFrom}
            to={jiraTo}
            onFrom={setJiraFrom}
            onTo={setJiraTo}
          />
        </div>
        <GroupedList items={filteredJira} />
      </TabsContent>
    </Tabs>
  );
}
