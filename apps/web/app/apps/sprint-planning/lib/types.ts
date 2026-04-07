export type SprintStatus =
  | "blocked"
  | "in-progress"
  | "in-review"
  | "not-started"
  | "discussion"
  | "done";

export type Priority = "high" | "medium" | "low";

export interface SprintSource {
  type: "jira" | "slack" | "zoom" | "github" | string;
  label?: string;
  url?: string;
}

export interface SprintItem {
  title: string;
  status: SprintStatus;
  priority?: Priority;
  dueDate?: string;
  assignees?: string[];
  sources?: SprintSource[];
  summary?: string;
}

export interface SprintClient {
  name: string;
  items: SprintItem[];
}

export interface SprintData {
  lastUpdated?: string;
  clients: SprintClient[];
}

// Archives
export type ArchiveType = "digest" | "overview" | "weekly";

export interface ArchiveRecord {
  id: string;
  date: string;
  _type: ArchiveType;
  service?: string;
  item_count?: number;
  summary?: string;
  items?: string[];
  highlights?: string[];
  blockers?: string[];
  action_items?: string[];
  themes?: string[];
  // weekly specifics
  start_date?: string;
  created_at?: string;
}
