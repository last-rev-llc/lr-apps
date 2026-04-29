"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient as createSupabase } from "@repo/db/server";
import { log } from "@repo/logger";
import { withSpan } from "@/lib/otel";
import type {
  ClientRow,
  ClientSiteRow,
  ContractStatus,
  Database,
  SiteMetadataRow,
  StatusPulseSiteRow,
} from "@repo/db/types";
import { computeHealthScore } from "./lib/score";
import { STATUS_PULSE_SITE_COLUMNS } from "./lib/status-pulse-schema";
import type { ActionResult, ClientHealthPayload } from "./lib/types";

// @repo/db/server returns a SupabaseClient typed by @supabase/ssr's older
// 3-param signature, which collapses our Database schema to `never` for
// .insert/.update payloads. Cast through a fresh `SupabaseClient<Database>`
// (5-param signature in @supabase/supabase-js) so writes type-check
// against our declared Tables.
async function db(): Promise<SupabaseClient<Database>> {
  const client = await createSupabase();
  return client as unknown as SupabaseClient<Database>;
}

const REVALIDATE = "/apps/client-health";
const UNIQUE_VIOLATION = "23505";

const ClientStatusEnum = z.enum(["active", "paused", "churned", "prospect"]);
const ContractStatusEnum = z.enum(["active", "expiring-soon", "expired", "none"]);

const ClientInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  industry: z.string().trim().optional().nullable(),
  status: ClientStatusEnum.optional().default("active"),
  contractStatus: ContractStatusEnum.optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  primaryContactName: z.string().trim().optional().nullable(),
  primaryContactEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().optional().nullable(),
});

const SiteInputSchema = z.object({
  clientId: z.string().uuid(),
  label: z.string().trim().min(1, "Label is required"),
  url: z.string().url("Invalid URL"),
  isPrimary: z.boolean().optional().default(false),
});

const SiteUpdateSchema = z.object({
  label: z.string().trim().min(1).optional(),
  url: z.string().url().optional(),
  isPrimary: z.boolean().optional(),
});

const TicketCountSchema = z.object({
  siteId: z.string().uuid(),
  count: z.number().int().min(0),
});

const UuidSchema = z.string().uuid();

// Use z.input for action signatures so callers don't have to fill in
// fields that have schema-level defaults (e.g. `status`, `isPrimary`).
export type ClientInput = z.input<typeof ClientInputSchema>;
export type SiteInput = z.input<typeof SiteInputSchema>;
export type SiteUpdate = z.input<typeof SiteUpdateSchema>;
export type TicketCountInput = z.input<typeof TicketCountSchema>;

function flatten(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join("; ");
}

// ── Client CRUD ──────────────────────────────────────────────────────────────

export async function createClient(
  input: ClientInput,
): Promise<ActionResult<ClientRow>> {
  return withSpan("clientHealth.createClient", {}, async () => {
    const parsed = ClientInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: flatten(parsed.error) };
    }

    const supabase = await db();
    const { data, error } = await supabase
      .from("clients")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      log.error("clientHealth.createClient failed", { err: error });
      return { ok: false, error: error.message };
    }

    revalidatePath(REVALIDATE);
    return { ok: true, data: data as ClientRow };
  });
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<ActionResult<ClientRow>> {
  return withSpan("clientHealth.updateClient", { "client.id": id }, async () => {
    const parsedId = UuidSchema.safeParse(id);
    if (!parsedId.success) return { ok: false, error: "Invalid client id" };
    const parsed = ClientInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: flatten(parsed.error) };

    const supabase = await db();
    const { data, error } = await supabase
      .from("clients")
      .update(parsed.data)
      .eq("id", parsedId.data)
      .select()
      .single();

    if (error) {
      log.error("clientHealth.updateClient failed", { err: error, id });
      return { ok: false, error: error.message };
    }

    revalidatePath(REVALIDATE);
    return { ok: true, data: data as ClientRow };
  });
}

export async function deleteClient(id: string): Promise<ActionResult<null>> {
  return withSpan("clientHealth.deleteClient", { "client.id": id }, async () => {
    const parsed = UuidSchema.safeParse(id);
    if (!parsed.success) return { ok: false, error: "Invalid client id" };

    const supabase = await db();
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", parsed.data);

    if (error) {
      log.error("clientHealth.deleteClient failed", { err: error, id });
      return { ok: false, error: error.message };
    }

    revalidatePath(REVALIDATE);
    return { ok: true, data: null };
  });
}

// ── Site CRUD ────────────────────────────────────────────────────────────────

export async function addClientSite(
  input: SiteInput,
): Promise<ActionResult<ClientSiteRow>> {
  return withSpan("clientHealth.addClientSite", {}, async () => {
    const parsed = SiteInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: flatten(parsed.error) };

    const supabase = await db();
    const { data, error } = await supabase
      .from("client_sites")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        return {
          ok: false,
          error: "A site with this URL already exists for this client.",
        };
      }
      log.error("clientHealth.addClientSite failed", { err: error });
      return { ok: false, error: error.message };
    }

    // Fire-and-forget SSL recheck. Depends on the /api/cron/ssl-recheck
    // route landing in a later issue — degrade silently if it 404s.
    void requestSslRecheck(parsed.data.url);

    revalidatePath(REVALIDATE);
    return { ok: true, data: data as ClientSiteRow };
  });
}

export async function updateClientSite(
  id: string,
  input: SiteUpdate,
): Promise<ActionResult<ClientSiteRow>> {
  return withSpan(
    "clientHealth.updateClientSite",
    { "site.id": id },
    async () => {
      const parsedId = UuidSchema.safeParse(id);
      if (!parsedId.success) return { ok: false, error: "Invalid site id" };
      const parsed = SiteUpdateSchema.safeParse(input);
      if (!parsed.success) return { ok: false, error: flatten(parsed.error) };

      const supabase = await db();
      const { data, error } = await supabase
        .from("client_sites")
        .update(parsed.data)
        .eq("id", parsedId.data)
        .select()
        .single();

      if (error) {
        if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
          return {
            ok: false,
            error: "A site with this URL already exists for this client.",
          };
        }
        log.error("clientHealth.updateClientSite failed", { err: error, id });
        return { ok: false, error: error.message };
      }

      revalidatePath(REVALIDATE);
      return { ok: true, data: data as ClientSiteRow };
    },
  );
}

export async function deleteClientSite(
  id: string,
): Promise<ActionResult<null>> {
  return withSpan(
    "clientHealth.deleteClientSite",
    { "site.id": id },
    async () => {
      const parsed = UuidSchema.safeParse(id);
      if (!parsed.success) return { ok: false, error: "Invalid site id" };

      const supabase = await db();
      const { error } = await supabase
        .from("client_sites")
        .delete()
        .eq("id", parsed.data);

      if (error) {
        log.error("clientHealth.deleteClientSite failed", { err: error, id });
        return { ok: false, error: error.message };
      }

      revalidatePath(REVALIDATE);
      return { ok: true, data: null };
    },
  );
}

export async function setOpenTicketCount(
  input: TicketCountInput,
): Promise<ActionResult<ClientSiteRow>> {
  return withSpan(
    "clientHealth.setOpenTicketCount",
    { "site.id": input.siteId },
    async () => {
      const parsed = TicketCountSchema.safeParse(input);
      if (!parsed.success) return { ok: false, error: flatten(parsed.error) };

      const supabase = await db();
      const { data, error } = await supabase
        .from("client_sites")
        .update({
          openTicketCount: parsed.data.count,
          ticketsLastUpdated: new Date().toISOString(),
        })
        .eq("id", parsed.data.siteId)
        .select()
        .single();

      if (error) {
        log.error("clientHealth.setOpenTicketCount failed", {
          err: error,
          siteId: input.siteId,
        });
        return { ok: false, error: error.message };
      }

      revalidatePath(REVALIDATE);
      return { ok: true, data: data as ClientSiteRow };
    },
  );
}

// ── Read-side aggregation ────────────────────────────────────────────────────

export async function listClientHealth(): Promise<ClientHealthPayload[]> {
  return withSpan("clientHealth.listClientHealth", {}, async () => {
    const supabase = await db();

    // RLS scopes these reads to auth.uid().
    const { data: clients, error: clientsErr } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });

    if (clientsErr) {
      log.error("clientHealth.listClientHealth: clients fetch failed", {
        err: clientsErr,
      });
      return [];
    }

    const clientList = (clients ?? []) as ClientRow[];
    if (clientList.length === 0) return [];

    return assemblePayloads(supabase, clientList);
  });
}

export async function getClientHealth(
  clientId: string,
): Promise<ClientHealthPayload | null> {
  return withSpan(
    "clientHealth.getClientHealth",
    { "client.id": clientId },
    async () => {
      const parsed = UuidSchema.safeParse(clientId);
      if (!parsed.success) return null;

      const supabase = await db();
      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", parsed.data)
        .maybeSingle();

      if (error) {
        log.error("clientHealth.getClientHealth: client fetch failed", {
          err: error,
          clientId,
        });
        return null;
      }
      if (!client) return null;

      const [payload] = await assemblePayloads(
        supabase,
        [client as ClientRow],
      );
      return payload ?? null;
    },
  );
}

async function assemblePayloads(
  supabase: SupabaseClient<Database>,
  clientList: ClientRow[],
): Promise<ClientHealthPayload[]> {
  const clientIds = clientList.map((c) => c.id);

  const { data: sitesRaw } = await supabase
    .from("client_sites")
    .select("*")
    .in("clientId", clientIds);

  const sites = (sitesRaw ?? []) as ClientSiteRow[];
  const urls = Array.from(new Set(sites.map((s) => s.url)));

  let pulse: StatusPulseSiteRow[] = [];
  let metadata: SiteMetadataRow[] = [];
  if (urls.length > 0) {
    const [{ data: pulseData }, { data: metaData }] = await Promise.all([
      supabase.from("sites").select(STATUS_PULSE_SITE_COLUMNS).in("url", urls),
      supabase.from("site_metadata").select("*").in("url", urls),
    ]);
    pulse = (pulseData ?? []) as StatusPulseSiteRow[];
    metadata = (metaData ?? []) as SiteMetadataRow[];
  }

  const pulseByUrl = new Map(pulse.map((p) => [p.url, p]));
  const metaByUrl = new Map(metadata.map((m) => [m.url, m]));

  return clientList.map((client) => {
    const ownSites = sites.filter((s) => s.clientId === client.id);
    const siteRows = ownSites.map((site) => {
      const p = pulseByUrl.get(site.url);
      const m = metaByUrl.get(site.url);
      return {
        ...site,
        status: p?.status ?? null,
        uptime: p?.uptimePercent ?? null,
        responseTime: p?.responseTimeMs ?? null,
        sslExpiry: m?.sslExpiry ?? null,
      };
    });

    // Pick the best signals to feed the score: primary site preferred,
    // otherwise the worst-uptime site so a single bad site is reflected.
    const primary =
      siteRows.find((s) => s.isPrimary) ??
      [...siteRows].sort(
        (a, b) => (a.uptime ?? 100) - (b.uptime ?? 100),
      )[0] ??
      null;

    const totalTickets = ownSites.reduce(
      (sum, s) => sum + (s.openTicketCount ?? 0),
      0,
    );

    const score = computeHealthScore({
      uptime: primary?.uptime ?? null,
      responseTimeMs: primary?.responseTime ?? null,
      sslExpiry: primary?.sslExpiry ?? null,
      openTicketCount: totalTickets,
      contractStatus: (client.contractStatus as ContractStatus | null) ?? null,
    });

    return { client, sites: siteRows, score };
  });
}

// ── Internals ────────────────────────────────────────────────────────────────

async function requestSslRecheck(url: string): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (!baseUrl || !cronSecret) return;
  try {
    await fetch(`${baseUrl.replace(/\/$/, "")}/api/cron/ssl-recheck`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ url }),
    });
  } catch {
    // Route not deployed yet (#20) — fall through silently.
  }
}
