export type PrStatus = "open" | "merged" | "closed";

export interface PR {
  id: string;
  title: string;
  repo: string;
  author: string;
  status: PrStatus;
  url: string;
  created_at?: string | null;
  labels?: string[] | null;
  reviewers?: string[] | null;
}

export type StatusFilter = "All" | PrStatus;
