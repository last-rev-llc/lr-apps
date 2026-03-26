export type ConcertStatus = "upcoming" | "past" | "cancelled" | "tbd";

export interface Concert {
  id: string;
  artist: string;
  venue?: string | null;
  city?: string | null;
  date?: string | null;
  status: ConcertStatus;
  ticket_url?: string | null;
  notes?: string | null;
  created_at?: string | null;
}
