export type Sentiment = "productive" | "tense" | "neutral";

export interface ActionItem {
  action?: string;
  title?: string;
  text?: string;
  owner?: string;
  priority?: "high" | "medium" | "low";
  deadline?: string;
  done?: boolean;
  status?: "done" | "open" | string;
  // Denormalized from parent transcript
  _meetingTopic?: string;
  _meetingDate?: string;
  _meetingId?: string;
  _clientId?: string;
  _idx?: number;
}

export interface ZoomTranscript {
  id: string;
  topic?: string;
  start_time?: string;
  duration?: number;
  summary?: string;
  client_id?: string;
  sentiment?: Sentiment;
  attendees?: string[] | string;
  decisions?: Array<string | { text?: string; decision?: string }> | string;
  action_items?: ActionItem[] | string;
  key_topics?: Array<string | { name?: string }> | string;
  created_at?: string;
}

export interface MeetingStats {
  total: number;
  summarized: number;
  actionItems: number;
  hoursTotal: number;
}
