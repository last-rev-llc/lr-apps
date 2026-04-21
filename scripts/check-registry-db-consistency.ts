#!/usr/bin/env tsx
/**
 * CI guard: every slug in `apps/web/lib/app-registry.ts` must have at least
 * one row in the `app_permissions` seed data. Prevents shipping an app that
 * has no grantable permissions entry.
 *
 * Skips silently when SUPABASE_TEST_URL is unset so local devs without a
 * running Supabase aren't blocked.
 *
 * Uses raw fetch against PostgREST to avoid pulling @supabase/supabase-js into
 * the root package's dependency tree.
 */
import { getAllApps } from "../apps/web/lib/app-registry.ts";

async function main(): Promise<void> {
  const url = process.env["SUPABASE_TEST_URL"];
  const serviceKey =
    process.env["SUPABASE_TEST_SERVICE_ROLE_KEY"] ??
    process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceKey) {
    console.warn(
      "[check-registry-db-consistency] SUPABASE_TEST_URL or service-role key not set — skipping (set both to run in CI).",
    );
    return;
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/app_permissions?select=app_slug`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error(
      `[check-registry-db-consistency] PostgREST returned ${res.status}: ${await res.text()}`,
    );
    process.exit(1);
  }

  const rows = (await res.json()) as Array<{ app_slug: string }>;
  const dbSlugs = new Set(rows.map((r) => r.app_slug));
  const registrySlugs = getAllApps().map((a) => a.slug);
  const missing = registrySlugs.filter((slug) => !dbSlugs.has(slug));

  if (missing.length > 0) {
    console.error(
      "[check-registry-db-consistency] The following registry slugs have no app_permissions seed row:",
    );
    for (const slug of missing) console.error(`  - ${slug}`);
    console.error(
      "\nAdd a `view` row for each missing slug to supabase/seed.sql.",
    );
    process.exit(1);
  }

  console.log(
    `[check-registry-db-consistency] OK — all ${registrySlugs.length} registry slugs have seed data.`,
  );
}

main().catch((err) => {
  console.error("[check-registry-db-consistency] unexpected error:", err);
  process.exit(1);
});
