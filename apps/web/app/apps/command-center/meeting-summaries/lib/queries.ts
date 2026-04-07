import { createClient } from "@repo/db/server";
import type { ZoomTranscript } from "./types";

export async function getMeetings(): Promise<ZoomTranscript[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zoom_transcripts")
    .select("*")
    .order("start_time", { ascending: false });

  if (error) {
    console.error("cc/meeting-summaries fetch error:", error);
    return [];
  }

  return (data ?? []) as unknown as ZoomTranscript[];
}
