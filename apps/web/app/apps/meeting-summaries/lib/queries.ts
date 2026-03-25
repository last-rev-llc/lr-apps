import { createClient } from "@repo/db/server";
import type { ZoomTranscript, MeetingStats } from "./types";

function parseJsonField<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  try {
    return JSON.parse(val as string) as T[];
  } catch {
    return [];
  }
}

export async function getMeetings(): Promise<ZoomTranscript[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zoom_transcripts")
    .select("*")
    .order("start_time", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ZoomTranscript[];
}

export function computeStats(meetings: ZoomTranscript[]): MeetingStats {
  const summarized = meetings.filter((m) => !!m.summary).length;
  const actionItems = meetings.reduce(
    (sum, m) => sum + parseJsonField(m.action_items).length,
    0,
  );
  const totalMins = meetings.reduce((sum, m) => sum + (m.duration ?? 0), 0);

  return {
    total: meetings.length,
    summarized,
    actionItems,
    hoursTotal: Math.round(totalMins / 60),
  };
}
