export type IdeaStatus = "new" | "backlog" | "in-progress" | "completed" | "archived";
export type IdeaCategory =
  | "Product"
  | "Content"
  | "Business"
  | "Technical"
  | "Creative"
  | "Skills";
export type IdeaSource = "generated" | "community" | "manual";
export type IdeaEffort = "Low" | "Medium" | "High";

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory | string;
  status: IdeaStatus;
  source: IdeaSource | string;
  feasibility: number | null;
  impact: number | null;
  effort: IdeaEffort | string | null;
  compositeScore: number | null;
  tags: string[];
  author: string | null;
  sourceUrl: string | null;
  rating: number | null;
  hidden: boolean | null;
  snoozedUntil: string | null;
  plan: string | null;
  planModel: string | null;
  planGeneratedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
}

export type QuickFilterKey =
  | "needs-rating"
  | "top-rated"
  | "quick-wins"
  | "new-today";

export type SortKey = "rating" | "compositeScore" | "createdAt" | "title";
export type ViewMode = "grid" | "list";
export type ShowFilter = "active" | "snoozed" | "completed" | "hidden" | "all";
