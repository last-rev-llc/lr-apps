export type TimeRange = "all" | "day" | "week" | "month";

export interface UpdateLink {
  url: string;
  label: string;
  type?: "pr" | "repo" | "slack" | "jira" | "doc" | "site" | string;
}

export interface DailyUpdate {
  id: string;
  title: string;
  body: string;
  source_app: string;
  source_name: string;
  source_icon: string;
  category?: string;
  priority?: "high" | "normal";
  links?: UpdateLink[] | string;
  reactions?: Record<string, number>;
  tags?: string[];
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AppProfile {
  id: string;
  name: string;
  icon: string;
  personality?: string;
  post_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface FeedFilters {
  source_app: string;
  category: string;
  time_range: TimeRange;
  search: string;
}
