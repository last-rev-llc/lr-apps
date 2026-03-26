export type CronStatus = "success" | "failed" | "running" | "pending" | null;

export interface Cron {
  id: string;
  name: string;
  schedule?: string | null;
  scheduleHuman?: string | null;
  enabled?: boolean | null;
  prompt?: string | null;
  sessionTarget?: string | null;
  lastStatus?: CronStatus;
  lastRun?: string | null;
  nextRun?: string | null;
  category?: string | null;
  description?: string | null;
  // Legacy fields from cc-crons.js (cron_jobs table)
  prompt_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type StatusFilter = "all" | "active" | "disabled" | "failed";
