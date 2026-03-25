import { createClient } from "@repo/db/server";
import type { Client } from "./types";

// JSON fields stored as text in Supabase that need parsing
const JSON_FIELDS = [
  "urls",
  "contacts",
  "repos",
  "meetings",
  "standup",
  "notes",
  "links",
  "github",
  "jira",
  "netlify",
  "contracts",
  "highlights",
  "challenges",
  "upcomingFocus",
  "upcomingMeetings",
  "contentfulSpaces",
] as const;

function parseClient(row: Record<string, unknown>): Client {
  const parsed: Record<string, unknown> = { ...row };
  for (const field of JSON_FIELDS) {
    if (typeof parsed[field] === "string") {
      try {
        parsed[field] = JSON.parse(parsed[field] as string);
      } catch {
        // leave as-is
      }
    }
  }
  return parsed as unknown as Client;
}

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  return (data ?? []).map((row) =>
    parseClient(row as Record<string, unknown>)
  );
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return parseClient(data as Record<string, unknown>);
}

export function computeOverviewStats(clients: Client[]) {
  return {
    total: clients.length,
    totalPRs: clients.reduce((s, c) => s + (c.github?.openPRs ?? 0), 0),
    totalContacts: clients.reduce((s, c) => s + (c.contacts?.length ?? 0), 0),
    totalJiraTickets: clients.reduce(
      (s, c) => s + (c.jira?.openTickets ?? 0),
      0
    ),
  };
}
