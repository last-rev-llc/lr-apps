export interface TechStack {
  cms?: string | null;
  framework?: string | null;
  hosting?: string | null;
  other?: string[];
}

export interface LeadPerson {
  name: string;
  title: string;
  topics?: string[];
  decisionMaker?: boolean;
  linkedinUrl?: string;
  email?: string;
}

export interface LeadNews {
  title: string;
  url: string;
  date?: string | null;
}

export interface SocialLinks {
  linkedin?: string | null;
  twitter?: string | null;
  website?: string | null;
}

export type PipelineStage = "prospect" | "outreach" | "qualified" | "proposal" | "closed";

export interface Lead {
  id: string;
  name: string;
  domain: string;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  description?: string | null;
  fitScore?: number | null;
  fitReasons?: string[] | null;
  talkingPoints?: string[] | null;
  techStack?: TechStack | null;
  people?: LeadPerson[] | null;
  news?: LeadNews[] | null;
  socialLinks?: SocialLinks | null;
  source?: string | null;
  researchedAt?: string | null;
  createdAt?: string | null;
  stage?: PipelineStage | null;
}

export type FitFilter = "all" | "5+" | "7+";
export type SortKey = "score" | "name" | "date";
export type SortDir = "asc" | "desc";
