export interface SentimentEntry {
  id: string;
  date: string;
  member_name: string;
  sentiment_score: number;
  mood: "positive" | "neutral" | "frustrated" | "blocked" | "excited";
  work_summary: string;
  blockers: string[];
  highlights: string[];
  created_at: string;
}

export interface MemberSummary {
  name: string;
  latestMood: string;
  latestScore: number;
  avgScore: number;
  entryCount: number;
}

export interface DayGroup {
  date: string;
  entries: SentimentEntry[];
}
