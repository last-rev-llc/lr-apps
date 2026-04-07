export type MemberRole = "coach" | "player" | "manager" | "staff";
export type ActivityLevel = "active" | "bench" | "alumni" | "inactive";

export interface TeamUsfMember {
  id: string;
  name: string;
  role: MemberRole;
  position?: string | null;
  jersey_number?: number | null;
  year?: string | null;
  major?: string | null;
  hometown?: string | null;
  activity: ActivityLevel;
  bio?: string | null;
  stats?: Record<string, unknown> | null;
  created_at?: string | null;
}
