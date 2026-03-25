import { createClient } from "@repo/db/server";
import type { ZoomSummary, SlackSummary, JiraSummary, SummaryItem } from "./types";

function parseJsonField<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  try {
    return JSON.parse(val as string) as T[];
  } catch {
    return [];
  }
}

export async function getZoomSummaries(): Promise<ZoomSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("summaries_zoom")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching zoom summaries:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    action_items: parseJsonField<string>(row.action_items),
    key_decisions: parseJsonField<string>(row.key_decisions),
  })) as ZoomSummary[];
}

export async function getSlackSummaries(): Promise<SlackSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("summaries_slack")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching slack summaries:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    participants: parseJsonField<string>(row.participants),
  })) as SlackSummary[];
}

export async function getJiraSummaries(): Promise<JiraSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("summaries_jira")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jira summaries:", error);
    return [];
  }

  return (data ?? []) as JiraSummary[];
}

export async function getAllSummaries(): Promise<{
  zoom: ZoomSummary[];
  slack: SlackSummary[];
  jira: JiraSummary[];
  all: SummaryItem[];
}> {
  const [zoom, slack, jira] = await Promise.all([
    getZoomSummaries(),
    getSlackSummaries(),
    getJiraSummaries(),
  ]);

  const all: SummaryItem[] = [
    ...zoom.map((item) => ({ ...item, source: "zoom" as const })),
    ...slack.map((item) => ({ ...item, source: "slack" as const })),
    ...jira.map((item) => ({ ...item, source: "jira" as const })),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { zoom, slack, jira, all };
}

export function getSlackChannels(slack: SlackSummary[]): string[] {
  return [...new Set(slack.map((s) => s.channel_id).filter(Boolean))];
}
