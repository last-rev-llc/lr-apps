// ── Accounts Types ─────────────────────────────────────────────────────────

export interface ClientUrls {
  website?: string | null;
  production?: string | null;
  staging?: string | null;
  github?: string[];
  contentful?: string | null;
}

export interface Contact {
  name: string;
  role?: string | null;
  email?: string | null;
  linkedin?: string | null;
  personality?: string | null;
  isPrimary?: boolean;
}

export interface GithubPR {
  repo: string;
  number: number;
  title: string;
  author: string;
  authorName?: string;
  date?: string;
}

export interface Github {
  openPRs?: number;
  repos?: string[];
  prs?: GithubPR[];
}

export interface Jira {
  status?: "active" | "pending-reauth" | string;
  openTickets?: number;
  staleTickets?: number;
}

export interface NetlifySite {
  site: string;
  status?: "success" | "failed" | "pending" | string;
  lastDeploy?: string | null;
}

export interface Contract {
  type?: string;
  status?: "active" | "expiring-soon" | "expired" | string;
  startDate?: string | null;
  endDate?: string | null;
  monthlyRetainer?: number | null;
  hourlyRate?: number | null;
}

export interface ContentfulSpace {
  spaceName?: string;
  spaceId?: string;
  environments?: string[];
}

export interface StandupItem {
  user: string;
  item: string;
  ticket?: string | null;
  ticketUrl?: string | null;
  prUrl?: string | null;
}

export interface Standup {
  yesterday?: StandupItem[];
  today?: StandupItem[];
}

export interface Meeting {
  title: string;
  datetime: string;
  attendees?: Array<{
    name: string;
    status?: "accepted" | "pending" | "declined";
  }>;
}

export interface Client {
  id: string;
  name: string;
  status?: string | null;
  health?: string | null;
  industry?: string | null;
  urls?: ClientUrls | null;
  contacts?: Contact[];
  github?: Github | null;
  jira?: Jira | null;
  netlify?: NetlifySite[];
  contracts?: Contract[];
  contentfulSpaces?: ContentfulSpace[];
  standup?: Standup | null;
  highlights?: string[];
  challenges?: string[];
  upcomingFocus?: string[];
  upcomingMeetings?: Meeting[];
  createdAt?: string | null;
  updatedAt?: string | null;
}
