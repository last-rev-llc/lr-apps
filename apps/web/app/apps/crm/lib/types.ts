// ── Contact types ─────────────────────────────────────────────────────────────

export type ContactType =
  | "team"
  | "client"
  | "prospect"
  | "partner"
  | "vendor"
  | "contractor"
  | "personal"
  | "other";

export type SortKey = "name" | "company" | "researched";
export type SortDir = "asc" | "desc";
export type ViewMode = "grid" | "list";

// ── Insights sub-types ────────────────────────────────────────────────────────

export interface CommunicationStyle {
  formality?: string | null;
  tone?: string | null;
  responseSpeed?: string | null;
  preferredChannel?: string | null;
}

export interface Personality {
  decisionStyle?: string | null;
  detailOrientation?: string | null;
  conflictStyle?: string | null;
  motivators?: string[];
  stressors?: string[];
}

export interface Interests {
  professional?: string[];
  personal?: string[];
  sharedWithAdam?: string[];
}

export interface ContactInsights {
  confidence?: "high" | "medium" | "low" | string | null;
  summary?: string | null;
  bestApproach?: string | null;
  communicationStyle?: CommunicationStyle | null;
  personality?: Personality | null;
  interests?: Interests | null;
  conversationStarters?: string[];
  topicsToAvoid?: string[];
}

// ── Main Contact type ─────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  company?: string | null;
  type?: ContactType | null;
  avatar?: string | null;
  location?: string | null;
  timezone?: string | null;
  slack_id?: string | null;
  slack_handle?: string | null;
  github_handle?: string | null;
  linkedin_url?: string | null;
  twitter_handle?: string | null;
  website?: string | null;
  tags?: string[];
  notes?: string | null;
  insights?: ContactInsights | null;
  last_researched_at?: string | null;
  confidence?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
