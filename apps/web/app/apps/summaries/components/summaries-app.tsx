"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Card } from "@repo/ui";
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

// ── Pill ───────────────────────────────────────────────────────────────────

const SOURCE_PILL: Record<string, string> = {
  zoom: "bg-blue/12 text-blue border-blue/20",
  slack: "bg-pill-0/12 text-pill-0 border-pill-0/20",
  jira: "bg-pill-7/12 text-pill-7 border-pill-7/20",
};

const TONE_PILL: Record<string, string> = {
  positive: "bg-green/12 text-green border-green/20",
  neutral: "bg-slate/12 text-muted-foreground border-slate/20",
  negative: "bg-red/12 text-red border-red/20",
};

const PRIORITY_PILL: Record<string, string> = {
  highest: "bg-red/12 text-red border-red/20",
  high: "bg-accent/12 text-accent border-accent/20",
  medium: "bg-blue/12 text-blue border-blue/20",
  low: "bg-slate/12 text-muted-foreground border-slate/20",
  lowest: "bg-slate/12 text-muted-foreground border-slate/20",
};

const STATUS_PILL: Record<string, string> = {
  done: "bg-green/12 text-green border-green/20",
  in_review: "bg-blue/12 text-blue border-blue/20",
  in_progress: "bg-accent/12 text-accent border-accent/20",
  to_do: "bg-slate/12 text-muted-foreground border-slate/20",
};

function Pill({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${className}`}
    >
      {text}
    </span>
  );
}

// ── Summary Card ───────────────────────────────────────────────────────────

function SummaryCard({ item }: { item: SummaryItem }) {
  const [open, setOpen] = useState(false);
  const title = titleOf(item);
  const short = shortSummaryOf(item);
  const date = formatDayLabel(item.created_at);

  return (
    <Card className="overflow-hidden glass border-surface-border hover:border-blue/30 transition-colors">
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
            {/* Source pill */}
            <Pill
              text={
                item.source === "zoom"
                  ? "📹 Zoom"
                  : item.source === "slack"
                    ? "💬 Slack"
                    : "🎯 Jira"
              }
              className={SOURCE_PILL[item.source]}
            />
            {/* Tone (slack) */}
            {item.source === "slack" && item.tone && (
              <Pill
                text={item.tone}
                className={TONE_PILL[item.tone] ?? TONE_PILL.neutral}
              />
            )}
            {/* Priority + status (jira) */}
            {item.source === "jira" && item.priority && (
              <Pill
                text={item.priority}
                className={PRIORITY_PILL[item.priority] ?? PRIORITY_PILL.medium}
              />
            )}
            {item.source === "jira" && item.status && (
              <Pill
                text={item.status.replace("_", " ")}
                className={STATUS_PILL[item.status] ?? STATUS_PILL.to_do}
              />
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
            <div className="text-[11px] font-bold text-blue uppercase tracking-widest mt-3 mb-1.5">
              Summary
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{short}</p>
          </div>

          {/* Long summary */}
          {item.long_summary && item.long_summary !== short && (
            <div>
              <div className="text-[11px] font-bold text-blue uppercase tracking-widest mb-1.5">
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
                  <div className="text-[11px] font-bold text-blue uppercase tracking-widest mb-1.5">
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
                  <div className="text-[11px] font-bold text-blue uppercase tracking-widest mb-1.5">
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
              <div className="text-[11px] font-bold text-blue uppercase tracking-widest mb-1.5">
                Participants
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.participants.map((p, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded bg-pill-0/12 text-pill-0"
                  >
                    {p}
                  </span>
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
      <div className="text-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">📋</div>
        <p>No summaries found</p>
        <p className="text-sm mt-1 opacity-60">Try adjusting your filters</p>
      </div>
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

const inputCls =
  "bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue/60";

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
      <input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        className={`${inputCls} w-36`}
      />
      <span className="text-muted-foreground text-sm">—</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        className={`${inputCls} w-36`}
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
          <input
            type="text"
            placeholder="Search all summaries…"
            value={allSearch}
            onChange={(e) => setAllSearch(e.target.value)}
            className={`flex-1 min-w-[200px] ${inputCls}`}
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
          <input
            type="text"
            placeholder="Search Zoom summaries…"
            value={zoomSearch}
            onChange={(e) => setZoomSearch(e.target.value)}
            className={`flex-1 min-w-[200px] ${inputCls}`}
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
          <input
            type="text"
            placeholder="Search Slack summaries…"
            value={slackSearch}
            onChange={(e) => setSlackSearch(e.target.value)}
            className={`flex-1 min-w-[200px] ${inputCls}`}
          />
          <select
            value={slackChannel}
            onChange={(e) => setSlackChannel(e.target.value)}
            className={inputCls}
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
          <input
            type="text"
            placeholder="Search Jira summaries…"
            value={jiraSearch}
            onChange={(e) => setJiraSearch(e.target.value)}
            className={`flex-1 min-w-[200px] ${inputCls}`}
          />
          <select
            value={jiraPriority}
            onChange={(e) => setJiraPriority(e.target.value as JiraPriority | "")}
            className={inputCls}
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
            className={inputCls}
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
