#!/usr/bin/env node
// Audits the live Supabase `contacts` table against the proposed DDL for the
// CRM-app migration (see docs/guides/promote-users-to-crm-app.md).
//
// Strategy: hit PostgREST's OpenAPI endpoint (no extra deps, no SQL exec
// privilege needed beyond the service role). The OpenAPI document includes
// each exposed table's column names, types, format, nullable flag, and
// defaults. Diff that against EXPECTED_COLUMNS and print a punch-list.
//
// Required env (same as scripts/db-seed.ts):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Usage:
//   pnpm tsx scripts/audit-contacts-schema.ts
//   pnpm tsx scripts/audit-contacts-schema.ts --json

interface ExpectedColumn {
  /** Canonical Postgres type. PostgREST reports `format` for the underlying type. */
  type: string;
  nullable: boolean;
  /** Optional notes shown if the live column drifts. */
  note?: string;
}

const EXPECTED_COLUMNS: Record<string, ExpectedColumn> = {
  id: { type: "uuid", nullable: false },
  name: { type: "text", nullable: false },
  email: { type: "text", nullable: true },
  phone: { type: "text", nullable: true },
  title: { type: "text", nullable: true },
  company: { type: "text", nullable: true },
  type: { type: "text", nullable: true, note: "expected check constraint: team|client|prospect|partner|vendor|contractor|personal|other" },
  avatar: { type: "text", nullable: true },
  location: { type: "text", nullable: true },
  timezone: { type: "text", nullable: true },
  slack_id: { type: "text", nullable: true },
  slack_handle: { type: "text", nullable: true },
  github_handle: { type: "text", nullable: true },
  linkedin_url: { type: "text", nullable: true },
  twitter_handle: { type: "text", nullable: true },
  website: { type: "text", nullable: true },
  tags: { type: "jsonb", nullable: false, note: "default '[]'::jsonb — verify both type AND default" },
  notes: { type: "text", nullable: true },
  insights: { type: "jsonb", nullable: true },
  last_researched_at: { type: "timestamp with time zone", nullable: true },
  confidence: { type: "text", nullable: true },
  source: { type: "text", nullable: true },
  created_at: { type: "timestamp with time zone", nullable: false },
  updated_at: { type: "timestamp with time zone", nullable: false },
};

interface OpenApiProperty {
  type?: string;
  format?: string;
  description?: string;
  default?: unknown;
}

interface OpenApiDefinition {
  required?: string[];
  properties?: Record<string, OpenApiProperty>;
}

interface OpenApiDoc {
  definitions?: Record<string, OpenApiDefinition>;
}

interface ColumnDiff {
  name: string;
  status: "ok" | "missing-in-live" | "extra-in-live" | "type-mismatch" | "nullability-mismatch";
  expected?: ExpectedColumn;
  live?: { type: string; nullable: boolean };
  note?: string;
}

interface AuditReport {
  table: "contacts";
  found: boolean;
  columns: ColumnDiff[];
  summary: { ok: number; drift: number; missing: number; extra: number };
}

function fail(message: string): never {
  // eslint-disable-next-line no-console
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function fetchOpenApi(url: string, key: string): Promise<OpenApiDoc> {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/openapi+json",
    },
  });
  if (!res.ok) {
    fail(`PostgREST OpenAPI request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as OpenApiDoc;
}

function normalizeFormat(prop: OpenApiProperty): string {
  // PostgREST reports the underlying Postgres type in `format`; `type` is the
  // JSON-schema bucket. Prefer `format`.
  if (prop.format) return prop.format;
  if (prop.type === "string") return "text";
  if (prop.type === "integer") return "integer";
  if (prop.type === "number") return "numeric";
  if (prop.type === "boolean") return "boolean";
  if (prop.type === "array") return "array";
  if (prop.type === "object") return "jsonb";
  return prop.type ?? "unknown";
}

function nullableFromOpenApi(name: string, def: OpenApiDefinition): boolean {
  // OpenAPI 2.0 from PostgREST flags non-nullable columns by listing them in
  // `required`. Anything not in `required` is nullable.
  return !(def.required ?? []).includes(name);
}

function diff(def: OpenApiDefinition): ColumnDiff[] {
  const liveProps = def.properties ?? {};
  const liveNames = new Set(Object.keys(liveProps));
  const expectedNames = new Set(Object.keys(EXPECTED_COLUMNS));

  const diffs: ColumnDiff[] = [];

  for (const name of expectedNames) {
    const expected = EXPECTED_COLUMNS[name];
    if (!liveNames.has(name)) {
      diffs.push({ name, status: "missing-in-live", expected });
      continue;
    }
    const liveProp = liveProps[name]!;
    const liveType = normalizeFormat(liveProp);
    const liveNullable = nullableFromOpenApi(name, def);
    const live = { type: liveType, nullable: liveNullable };

    if (liveType !== expected.type) {
      diffs.push({ name, status: "type-mismatch", expected, live, note: expected.note });
      continue;
    }
    if (liveNullable !== expected.nullable) {
      diffs.push({ name, status: "nullability-mismatch", expected, live, note: expected.note });
      continue;
    }
    diffs.push({ name, status: "ok", expected, live });
  }

  for (const name of liveNames) {
    if (!expectedNames.has(name)) {
      const liveProp = liveProps[name]!;
      diffs.push({
        name,
        status: "extra-in-live",
        live: { type: normalizeFormat(liveProp), nullable: nullableFromOpenApi(name, def) },
      });
    }
  }

  return diffs;
}

function summarize(diffs: ColumnDiff[]): AuditReport["summary"] {
  return {
    ok: diffs.filter((d) => d.status === "ok").length,
    drift: diffs.filter((d) => d.status === "type-mismatch" || d.status === "nullability-mismatch").length,
    missing: diffs.filter((d) => d.status === "missing-in-live").length,
    extra: diffs.filter((d) => d.status === "extra-in-live").length,
  };
}

function printHuman(report: AuditReport): void {
  // eslint-disable-next-line no-console
  const log = console.log;
  log(`\nContacts schema audit — table found: ${report.found ? "yes" : "no"}`);
  if (!report.found) return;

  for (const d of report.columns) {
    if (d.status === "ok") {
      log(`  ✓ ${d.name.padEnd(22)} ${d.live!.type}${d.live!.nullable ? " (nullable)" : ""}`);
    } else if (d.status === "missing-in-live") {
      log(`  ✖ ${d.name.padEnd(22)} MISSING in live (expected ${d.expected!.type}${d.expected!.nullable ? "" : " NOT NULL"})`);
    } else if (d.status === "extra-in-live") {
      log(`  ? ${d.name.padEnd(22)} EXTRA in live (${d.live!.type}${d.live!.nullable ? " nullable" : " NOT NULL"}) — not in proposed DDL`);
    } else if (d.status === "type-mismatch") {
      log(`  Δ ${d.name.padEnd(22)} type drift: live=${d.live!.type} expected=${d.expected!.type}${d.note ? ` — ${d.note}` : ""}`);
    } else if (d.status === "nullability-mismatch") {
      log(`  Δ ${d.name.padEnd(22)} nullability drift: live=${d.live!.nullable ? "nullable" : "NOT NULL"} expected=${d.expected!.nullable ? "nullable" : "NOT NULL"}`);
    }
  }
  const s = report.summary;
  log(`\nSummary — ok: ${s.ok}, drift: ${s.drift}, missing: ${s.missing}, extra: ${s.extra}`);
  log(s.drift + s.missing + s.extra === 0
    ? "Live schema matches the proposed DDL.\n"
    : "Resolve drift / missing / extra before finalizing the migration.\n");
}

export async function audit(): Promise<AuditReport> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is required");
  if (!key) fail("SUPABASE_SERVICE_ROLE_KEY is required");

  const doc = await fetchOpenApi(url, key);
  const def = doc.definitions?.["contacts"];

  if (!def) {
    return { table: "contacts", found: false, columns: [], summary: { ok: 0, drift: 0, missing: 0, extra: 0 } };
  }

  const columns = diff(def);
  return { table: "contacts", found: true, columns, summary: summarize(columns) };
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  const json = process.argv.includes("--json");
  audit()
    .then((report) => {
      if (json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(report, null, 2));
      } else {
        printHuman(report);
      }
      const hasIssues = !report.found || report.summary.drift + report.summary.missing > 0;
      process.exit(hasIssues ? 1 : 0);
    })
    .catch((err) => fail(err instanceof Error ? err.message : String(err)));
}
