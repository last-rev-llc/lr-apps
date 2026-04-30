"use server";

import { headers } from "next/headers";
import { createServiceRoleClient } from "@repo/db/service-role";
import { log } from "@repo/logger";

export type AddClientSiteInput = {
  url: string;
  name?: string | null;
};

export type AddClientSiteResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Inserts a client site, then best-effort triggers /api/cron/check-ssl/manual
 * so the UI sees fresh SSL data without waiting for the next 06:00 UTC tick.
 * Failure of the recheck does not block the insert.
 */
export async function addClientSite(input: AddClientSiteInput): Promise<AddClientSiteResult> {
  const url = input.url.trim();
  if (!url) return { ok: false, error: "url is required" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "invalid url" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "invalid url" };
  }

  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("client_sites")
    .insert({ url, name: input.name ?? null })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert failed" };
  }

  // Fire-and-forget: invoke the manual recheck without awaiting the response.
  // Failure to schedule must NOT block the action.
  void triggerManualSslCheck(url).catch((err) => {
    log.warn("manual ssl check trigger failed", {
      url,
      err: err instanceof Error ? err.message : String(err),
    });
  });

  return { ok: true, id: data.id as string };
}

async function triggerManualSslCheck(url: string): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  if (!host) return;

  const target = `${proto}://${host}/api/cron/check-ssl/manual`;
  await fetch(target, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
}
