import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for E2E tests",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface SeedSiteInput {
  userId: string;
  /** UUID for the public.clients row. */
  clientId: string;
  /** Display name for the client. Persisted on public.clients.name. */
  clientName: string;
  url: string;
  /** ISO date for sslExpiry; null/undefined leaves it absent. */
  sslExpiry?: string | null;
  sslLastError?: string | null;
}

/**
 * Inserts a clients row, a client_sites row that references it, and a
 * site_metadata row for the URL. Column names match the migration schema:
 * client_sites uses camelCase "clientId" (FK to clients.id); the human-
 * readable name lives on clients.name.
 */
export async function seedSite(input: SeedSiteInput): Promise<void> {
  const db = getServiceClient();

  const clients = await db
    .from("clients")
    .upsert({ id: input.clientId, name: input.clientName }, { onConflict: "id" });
  if (clients.error) throw new Error(`seedSite/clients: ${clients.error.message}`);

  const sites = await db.from("client_sites").upsert(
    {
      user_id: input.userId,
      clientId: input.clientId,
      label: "primary",
      url: input.url,
    },
    { onConflict: 'user_id,clientId,url' },
  );
  if (sites.error) throw new Error(`seedSite/client_sites: ${sites.error.message}`);

  const metadataRow: Record<string, unknown> = {
    url: input.url,
    sslLastChecked: new Date().toISOString(),
    sslLastError: input.sslLastError ?? null,
  };
  if (input.sslExpiry !== undefined) {
    metadataRow.sslExpiry = input.sslExpiry;
  }
  const meta = await db
    .from("site_metadata")
    .upsert(metadataRow, { onConflict: "url" });
  if (meta.error) throw new Error(`seedSite/site_metadata: ${meta.error.message}`);
}

export interface SeedAlertInput {
  userId: string;
  clientId: string;
  type: string;
  summary: string;
  severity?: "critical" | "warning" | "info";
}

/** Inserts a single client_health_alerts row and returns its id. */
export async function seedAlert(input: SeedAlertInput): Promise<string> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("client_health_alerts")
    .insert({
      user_id: input.userId,
      clientId: input.clientId,
      type: input.type,
      severity: input.severity ?? "critical",
      title: input.summary,
      message: input.summary,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`seedAlert: ${error?.message ?? "no row returned"}`);
  }
  return (data as { id: string }).id;
}

/** Removes test fixtures for a userId by name prefix. */
export async function cleanupSeed(input: {
  userId: string;
  clientId: string;
  url: string;
}): Promise<void> {
  const db = getServiceClient();
  await db.from("client_health_alerts").delete().eq("user_id", input.userId);
  await db.from("client_sites").delete().eq("user_id", input.userId);
  await db.from("site_metadata").delete().eq("url", input.url);
  await db.from("clients").delete().eq("id", input.clientId);
}
