export type Source = "slack" | "github" | "workspace" | "jira";

export interface Activity {
  source: Source;
  time: string;
  description: string;
}

export interface StandupDay {
  id: string;
  date: string;
  dayOfWeek: string;
  activities: Activity[];
  createdAt?: string;
  updatedAt?: string;
}
