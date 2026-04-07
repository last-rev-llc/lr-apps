// ── Summaries Types ────────────────────────────────────────────────────────

export type SummarySource = "zoom" | "slack" | "jira";
export type JiraPriority = "lowest" | "low" | "medium" | "high" | "highest";
export type JiraStatus = "to_do" | "in_progress" | "in_review" | "done";
export type SlackTone = "positive" | "neutral" | "negative";

export interface ZoomSummary {
  id: string;
  meeting_id: string;
  meeting_topic: string;
  short_summary: string | null;
  long_summary: string | null;
  action_items: string[] | null;
  key_decisions: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SlackSummary {
  id: string;
  thread_ts: string;
  channel_id: string;
  participants: string[] | null;
  short_summary: string | null;
  long_summary: string | null;
  tone: SlackTone | null;
  created_at: string;
  updated_at: string;
}

export interface JiraSummary {
  id: string;
  ticket_key: string;
  short_summary: string | null;
  long_summary: string | null;
  priority: JiraPriority | null;
  status: JiraStatus | null;
  created_at: string;
  updated_at: string;
}

// Normalized union type for display
export type SummaryItem =
  | (ZoomSummary & { source: "zoom" })
  | (SlackSummary & { source: "slack" })
  | (JiraSummary & { source: "jira" });

export interface DayGroup {
  date: string;
  label: string;
  summaries: SummaryItem[];
}
