# Plan: Promote `client-health` to a standalone mini-app

## Goal

Move `client-health` out of `command-center` into its own internal-only mini-app at `client-health.apps.lastrev.com`. Re-scope it from "uptime dashboard, junior version" into a **360° client-health dashboard** that combines site uptime (from the existing `uptime` data), SSL expiry, open support tickets, and a composite health score per client. Free for the dashboard view; paid (`pro`) for alerting and AI-generated relationship summaries. The public `uptime` app stays as-is for customer-facing status.

## Prerequisite — subdomain pattern change

You called out that all apps will live as **sub-sub-domains under `apps.lastrev.com`** (e.g. `client-health.apps.lastrev.com`). This is a repo-wide architectural shift, not something to do per-app. Today the proxy maps `<slug>.lastrev.com` → `/apps/<routeGroup>/...`.

**Before the client-health work lands, the following needs to happen in a separate, dedicated PR:**
1. DNS/cert: add wildcard for `*.apps.lastrev.com` (separate cert from `*.lastrev.com` — wildcards don't traverse a label).
2. `apps/web/proxy.ts`: recognize host pattern `<slug>.apps.lastrev.com` (likely alongside the legacy `<slug>.lastrev.com` during transition, or a hard cutover).
3. `apps/web/lib/app-registry.ts`: confirm whether the `subdomain` field stays as the leftmost label (`client-health`) and the host is constructed elsewhere, or if it should hold the full host. Lightly prefer the former.
4. `apps/web/lib/platform-urls.ts`: update cross-app link helpers.
5. Auth0: add `*.apps.lastrev.com` to allowed callback URLs / Allowed Web Origins. `getAuth0ClientForHost` already derives base URL from host, so the factory should keep working — verify.
6. `CLAUDE.md`: update the routing description.

The `ideas` and `meme-generator` plans assumed `<slug>.lastrev.com` and need a one-line update each (the `subdomain` value stays correct; only the URL examples change).

The rest of this plan assumes the prerequisite is done.

## Resolved decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Relationship to `uptime` | **Split.** `uptime.apps.lastrev.com` stays the public/customer-facing status page (status-pulse-fed). `client-health.apps.lastrev.com` is internal — broader scope. |
| 2 | Data source for site status | **Extend.** Read `sites` (owned externally by `last-rev-llc/status-pulse`); add **`site_metadata`** table in lr-apps for fields status-pulse doesn't track (SSL, ownership, notes). Joined by URL match. |
| 3 | Scope ceiling | **Full client-health app (Option C).** Aggregates site uptime + SSL + open ticket counts + (later) sentiment/meetings into a per-client composite score. |
| 4 | Tier model | **App tier `free`** (anyone signed in can view). **Paid (`pro`) features**: AI relationship summaries, alerting (email/Slack on critical health drops), and historical trend snapshots. |
| 5 | Ownership today | **Per-user.** `user_id` on every row, own-only RLS. **Designed to migrate to workspace-scoping later** — see "Workspace migration path" section. |
| 6 | Subdomain | `client-health.apps.lastrev.com` (slug stays `client-health`). |
| 7 | Mutations | Server actions only, `zod`-validated, scoped by `auth.uid()`. |
| 8 | SSL monitoring | New cron in lr-apps: `app/api/cron/check-ssl/route.ts`, validated via `lib/cron-auth.ts`, runs daily, writes to `site_metadata`. |
| 9 | AI summaries | Vercel AI SDK + `@ai-sdk/anthropic`, `claude-haiku-4-5` for routine summaries / `claude-sonnet-4-6` for the headline relationship summary. Gated `client-health:ai-summary` → `pro`. |
| 10 | Alerting | Resend email for v1 (already configured via `@repo/email`). Slack as a pro-tier follow-up. |
| 11 | Jira / external ticket integration | **Manual count for v1.** Each `client_sites` row has an `openTicketCount` field the user updates. Real Jira API integration is v2 (needs PAT or OAuth). |
| 12 | Subdomain prerequisite | **Separate PR.** Routing/DNS/Auth0 changes ship before this app lands. |
| 13 | Health-score weights | **Locked: `uptime 0.30 / responseTime 0.10 / ssl 0.20 / ticketLoad 0.20 / contract 0.20`.** |
| 14 | SSL thresholds | **`<30d warn`, `<7d critical`, `expired = critical`** (matches existing `SSL_WARN_DAYS`). |
| 15 | Alert delivery v1 | **Email only** via Resend. Slack deferred. |
| 16 | Settings table | **Single `client_health_settings`** per-user table for alert prefs (and any future setting). |

## Current state

```
apps/web/app/apps/command-center/client-health/
  page.tsx                              # 10 lines
  components/health-app.tsx             # 313 lines, "use client", token-violations heavy
  lib/queries.ts                        # 29 lines — tries `uptime_sites`, falls back to `client_health`
  lib/types.ts                          # 14 lines — { id, name, url, status, responseTime, uptime, lastCheck, sslExpiry }
```

What works / doesn't:
- **Doesn't work today.** `getHealthSites()` queries two tables that **don't exist in any migration**: `uptime_sites` and `client_health`. Page renders empty.
- The existing `uptime` app reads `sites` (which exists, populated externally by [`last-rev-llc/status-pulse`](https://github.com/last-rev-llc/status-pulse)) and works.
- Conceptual overlap is large: 4 of the 8 fields in `HealthSite` map directly to columns in `Site` (uptime app's type).
- The `accounts` app is also broken in a related way (queries a missing `clients` table). This plan introduces `clients` and so **partially fixes accounts** as a side effect — see "Cross-app impact" below.

## Architecture: data sources & signals

Composite health is derived from multiple signals, each owned by a different system:

| Signal | Source | In v1? |
|---|---|---|
| Site uptime % | `sites` (status-pulse) | ✅ |
| Response time | `sites` (status-pulse) | ✅ |
| Site status (up/degraded/down) | `sites` (status-pulse) | ✅ |
| SSL expiry | `site_metadata` (this app's cron) | ✅ |
| Open support tickets | `client_sites.openTicketCount` (manual entry) | ✅ |
| Last contact / meeting | `meeting-summaries` data | ❌ v2 |
| Sentiment trend | `sentiment` data | ❌ v2 |
| Lighthouse score | `lighthouse` data | ❌ v2 |
| Contract status | `clients.contractStatus` (manual) | ✅ |

The composite score is a weighted sum normalized to 0–100, computed on read in v1 (no snapshot table yet — add later if we want historical trend).

## Schema

Five paired migrations, all dated `20260429_`. All use per-user RLS via `auth.uid() = user_id`.

### 1. `clients`

Workspace's clients (the entity being monitored). `accounts` queries a `clients` table that doesn't exist; this introduces it and unblocks both apps.

```sql
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null check (length(trim(name)) > 0),
  industry text,
  status text not null default 'active'
    check (status in ('active','paused','churned','prospect')),

  "contractStatus" text check ("contractStatus" in ('active','expiring-soon','expired','none')),
  "contractEndDate" date,

  "primaryContactName" text,
  "primaryContactEmail" text,
  notes text,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Users read own clients"   on public.clients for select using (auth.uid() = user_id);
create policy "Users insert own clients" on public.clients for insert with check (auth.uid() = user_id);
create policy "Users update own clients" on public.clients for update using (auth.uid() = user_id);
create policy "Users delete own clients" on public.clients for delete using (auth.uid() = user_id);

create index if not exists idx_clients_user_status on public.clients(user_id, status);
```

(Adds the standard `updatedAt` trigger — same pattern as `ideas` plan.)

### 2. `client_sites`

A client → site mapping. Each row identifies a URL belonging to a client. Joins to status-pulse's `sites` by URL.

```sql
create table if not exists public.client_sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  "clientId" uuid not null references public.clients(id) on delete cascade,

  label text not null,                                  -- "Production", "Staging", etc.
  url text not null,                                    -- canonical URL; matches sites.url

  "isPrimary" boolean not null default false,
  "openTicketCount" integer not null default 0 check ("openTicketCount" >= 0),
  "ticketsLastUpdated" timestamptz,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),

  unique (user_id, "clientId", url)
);

-- RLS: own-only, same shape as clients.
-- Index: (user_id, clientId) for per-client lookups.
```

### 3. `site_metadata`

The "extend" answer. Stores fields status-pulse doesn't track. Keyed by URL (not `sites.id`) since `sites` rows may not exist for every URL we want to monitor (e.g. a staging site we haven't told status-pulse about).

```sql
create table if not exists public.site_metadata (
  url text primary key,                                 -- canonical URL

  "sslExpiry" timestamptz,
  "sslIssuer" text,
  "sslLastChecked" timestamptz,
  "sslLastError" text,                                  -- last failure message, null on success

  notes text,                                           -- internal notes (per-workspace later)

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.site_metadata enable row level security;

-- v1: any authenticated user can read; only service role / cron writes.
-- (No per-user partitioning here — site SSL data is intrinsically site-level, not user-level.)
create policy "Authenticated read site metadata"
  on public.site_metadata for select
  using (auth.role() = 'authenticated');
```

Writes happen via the SSL cron using the service-role client (`@repo/db/service-role`). No user-facing write path in v1.

### 4. `client_health_settings` (pro alert prefs + future settings)

One row per `user_id`. Holds alerting preferences and any future per-user knobs.

```sql
create table if not exists public.client_health_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  "emailEnabled" boolean not null default true,
  "alertEmail" text,                                    -- null = use Auth0 session email
  "sslWarnDays" integer not null default 30 check ("sslWarnDays" between 1 and 365),
  "healthDropThreshold" integer not null default 20 check ("healthDropThreshold" between 1 and 100),

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.client_health_settings enable row level security;

create policy "Users read own settings"   on public.client_health_settings for select using (auth.uid() = user_id);
create policy "Users insert own settings" on public.client_health_settings for insert with check (auth.uid() = user_id);
create policy "Users update own settings" on public.client_health_settings for update using (auth.uid() = user_id);
```

(Standard `updatedAt` trigger.)

### 5. `client_health_alerts` (pro)

Stored alerts for the alerting feature. Lets us de-dupe ("don't email twice for the same SSL warning") and show a notification history in the UI.

```sql
create table if not exists public.client_health_alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  "clientId" uuid references public.clients(id) on delete cascade,

  type text not null
    check (type in ('site-down','ssl-expiring','ssl-expired','ticket-spike','health-score-drop')),
  severity text not null check (severity in ('info','warning','critical')),
  message text not null,

  "deliveredAt" timestamptz,
  "acknowledgedAt" timestamptz,

  "createdAt" timestamptz not null default now()
);

-- RLS own-only; index on (user_id, createdAt desc).
```

### 6. (No migration — note only) Health score is computed on read

`computeHealthScore(client, sites, metadata)` lives in `apps/web/app/apps/client-health/lib/score.ts`. Pure function. No DB column for v1; if we add historical snapshots later, that's a new migration.

## Workspace migration path

You said "by person for now, but will be shared once workspaces are fully built out." All five tables use `user_id` today. The eventual migration will look like:

1. New `workspaces` + `workspace_members` tables (separate effort).
2. Add `workspaceId uuid` to `clients`, `client_sites`, `client_health_alerts`. Backfill: each user's rows get a default workspace.
3. RLS policies switch from `auth.uid() = user_id` to `is_workspace_member(auth.uid(), workspaceId)`.
4. `user_id` becomes either nullable (kept as "creator") or dropped.

To keep this clean, **don't put any per-user logic in column names** (e.g. don't call it `myClientId`). The migration is structurally simple as long as the schema is honest about ownership being a row-level concern. `site_metadata` doesn't change at all — it's already site-level, not user-level.

## Server actions

In `apps/web/app/apps/client-health/actions.ts`. All `"use server"`, `zod`-validated, scoped by `auth.uid()`, logged via `@repo/logger`, wrapped in `withSpan` where meaningful.

| Action | Tier | Purpose |
|---|---|---|
| `createClient(input)` | free | INSERT into `clients`. |
| `updateClient(id, patch)` | free | UPDATE name/industry/status/contract/contact/notes. |
| `deleteClient(id)` | free | Cascade-deletes `client_sites` and alerts. |
| `addClientSite({ clientId, label, url, isPrimary? })` | free | INSERT into `client_sites`. Triggers an immediate SSL check (best-effort, async). |
| `updateClientSite(id, patch)` | free | UPDATE label/url/isPrimary/openTicketCount. |
| `deleteClientSite(id)` | free | DELETE row; SSL data in `site_metadata` stays (might be referenced by other users). |
| `setOpenTicketCount(siteId, count)` | free | Convenience action — same as `updateClientSite` but tighter validation. |
| `listClientHealth()` | free | SELECT all clients + their sites + joined `sites` (status-pulse) + `site_metadata`. Composes the dashboard payload server-side. Returns `{ client, sites: [{ ...siteMeta, status, uptime }], score }`. |
| `getClientHealth(clientId)` | free | Same shape, single client. |
| `acknowledgeAlert(alertId)` | pro | Sets `acknowledgedAt`. |
| `summarizeClientHealth(clientId)` | **pro** | AI summary — see "AI integration" below. |
| `updateAlertSettings({ emailEnabled, alertEmail?, sslWarnDays?, healthDropThreshold? })` | **pro** | Upsert into `client_health_settings` (one row per `user_id`). v1 surfaces email on/off + override email; thresholds default to the constants in this doc. |

Health-score helper (in `lib/score.ts`):
```ts
const WEIGHTS = {
  uptime:        0.30,    // % uptime
  responseTime:  0.10,    // <300 ideal, >800 bad
  ssl:           0.20,    // days to expiry; <7 critical, <30 warn
  ticketLoad:    0.20,    // openTicketCount per site, capped
  contract:      0.20,    // active=full, expiring-soon=half, expired=zero
} as const;

export function computeHealthScore(input: HealthInputs): { score: number; breakdown: Record<keyof typeof WEIGHTS, number> } { ... }
```

Returns 0–100 with a per-signal breakdown for the UI tooltip.

## SSL monitoring cron

```
app/api/cron/check-ssl/route.ts
```

- POST handler, validated via `lib/cron-auth.ts` (`CRON_SECRET`).
- Schedule via Vercel cron: **daily**, 06:00 UTC. Configured in `apps/web/vercel.json`.
- Pulls every distinct URL from `client_sites`.
- For each URL, opens a TLS connection, reads the certificate, extracts `notAfter` and issuer.
- UPSERTs into `site_metadata` with `sslExpiry`, `sslIssuer`, `sslLastChecked = now()`. On failure, writes `sslLastError` and leaves prior values.
- Concurrency: limit to 10 concurrent TLS handshakes via a small p-limit (don't pull a new dep — write a tiny semaphore in `lib/concurrent.ts`).
- Triggers alert generation (next section) for newly expiring/expired certs.

The cron is also exposed as `app/api/cron/check-ssl/manual/route.ts` for ad-hoc runs from a server action (`addClientSite` triggers a single-URL re-check immediately so the user sees data without waiting for the next 06:00 UTC tick).

## Alerting (pro)

Triggered from inside the SSL cron after the SSL pass and from a separate hourly cron `app/api/cron/check-status/route.ts` that scans `sites` for status changes.

- For each user, compute current health per client. Read their `client_health_settings` row to honor `emailEnabled`, `alertEmail`, `sslWarnDays`, `healthDropThreshold`. Fall back to defaults if no row exists.
- If a client transitions into `critical` (any site `down`, SSL `<7d`, or score drops by ≥`healthDropThreshold` since last acknowledged alert), insert into `client_health_alerts` and send a Resend email via `@repo/email` (skipping if `emailEnabled = false`).
- Email recipient: `alertEmail` if set, else the session/Auth0 email of the user.
- Dedupe: don't fire if an unacknowledged alert of the same `(type, clientId)` already exists.
- Email template: new template under `packages/email/templates/` — shares the existing render scaffold.
- Slack: deferred. When added, the column lands on `client_health_settings` and the alerting code branches.

## AI integration — `summarizeClientHealth`

Vercel AI SDK + `@ai-sdk/anthropic`. `generateObject` returning a typed structured summary so the UI can render sections cleanly (not just freeform markdown).

```ts
const SummarySchema = z.object({
  headline: z.string().describe("One-line current health assessment"),
  positives: z.array(z.string()).max(5).describe("What's going well"),
  concerns: z.array(z.string()).max(5).describe("What's at risk or trending poorly"),
  recommendations: z.array(z.string()).max(5).describe("Concrete next actions"),
});

const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-6"),    // sonnet for the headline-summary action
  schema: SummarySchema,
  system: "You are an account-management copilot. Given structured client health signals, write a punchy executive summary aimed at the account owner. Keep each bullet under 18 words. Be specific — reference actual numbers from the input.",
  prompt: JSON.stringify({ client, sites, ssl, tickets, score, breakdown }, null, 2),
});
```

- Tier-gated `client-health:ai-summary` → `pro`.
- Rate-limited 20 calls/hour/user via `lib/rate-limit.ts`.
- Cached for 1 hour per `clientId` in Upstash (the same data ⇒ same answer).
- Local-dev fallback: deterministic stub when `ANTHROPIC_API_KEY` unset.

Env vars (registered in `turbo.json` `globalEnv` and `apps/web/lib/env.ts`):
- `ANTHROPIC_API_KEY` (already added by ideas/memes plan)

## UI structure

```
apps/web/app/apps/client-health/
  layout.tsx                            # scaffolded — gates via requireAppLayoutAccess
  page.tsx                              # overview: list of clients + composite scores
  [clientId]/page.tsx                   # per-client deep dive
  alerts/page.tsx                       # alert history (pro)
  settings/page.tsx                     # alert prefs (pro)
  components/
    client-card.tsx                     # used on overview
    client-detail.tsx                   # used on per-client page
    health-score-ring.tsx               # the 0-100 visual
    site-row.tsx                        # one row per site within a client
    ssl-badge.tsx                       # green/yellow/red with days-left
    ai-summary-panel.tsx                # gated, calls summarizeClientHealth
    alert-list.tsx
  lib/
    queries.ts                          # the joined-payload assembler
    score.ts                            # computeHealthScore
    types.ts
  __tests__/
```

Notes:
- Heavy refactor of the existing `health-app.tsx` (313 lines, sites-only). Most of it is unsalvageable for the new shape — the new overview is client-grouped, not site-grouped. The current SSL warning panel and status dot logic are reusable.
- Token cleanup pass during the move: same `text-white/X` and `var(--color-*)` issues as `ideas` and `memes`.

## Cross-app impact

- **`accounts` app gets unblocked.** It's been broken since launch because `clients` doesn't exist. Landing this migration fixes its read path. The `accounts` UI was designed for a richer schema (contacts, repos, github, jira, contentful, meetings) that this migration doesn't fully reproduce — so `accounts` will start showing real client names but most subfields stay empty until a follow-up plan extends the schema. **Recommend including a brief one-liner in the PR description noting that `accounts` is partially unblocked but still incomplete.**
- **`uptime` is unaffected** — it keeps reading `sites`.
- **`command-center`** loses its `client-health` tile (or repoints it).
- **`CLAUDE.md`** "27 apps" copy → 28 (or 29 after `ideas`, 30 after `memes`).

## Step-by-step

1. **Prerequisite PR** — subdomain pattern change (`apps.lastrev.com`). Separate effort.
2. **Scaffold.** `pnpm create-app client-health --name="Client Health" --subdomain=client-health --tier=free --template=full --permission=view --auth=true`.
3. **Migrations.** Five paired up/down migrations (`clients`, `client_sites`, `site_metadata`, `client_health_settings`, `client_health_alerts`). `pnpm lint` enforces the pairs.
4. **Move + rewrite UI.** Delete `command-center/client-health/`. New file structure under `app/apps/client-health/`. Most of `health-app.tsx` becomes new components; reuse the SSL banner and status logic.
5. **Server actions + score helper.**
6. **SSL cron + manual single-URL trigger.** Wire into `apps/web/vercel.json`.
7. **Alerting cron + Resend email template.**
8. **AI summary action + UI panel.** Gated behind new `client-health:ai-summary` feature flag in `lib/tier-config.ts`.
9. **Command Center cleanup.** Remove tile, decrement hardcoded route count.
10. **Tests.**
    - Unit: `actions.test.ts` (each action; cross-user RLS rejection); `score.test.ts` (table-driven for each weight axis); `cron/check-ssl.test.ts` (mock TLS, exercise success + failure paths).
    - Component: overview rendering with mocked health payloads; AI panel renders stub.
    - e2e (Playwright): create client → add site → mock SSL data → see score → ack alert → AI summary mocked.
11. **Verify.** `pnpm lint`, `pnpm test`, `pnpm dev`, click through on `client-health.apps.lastrev.com`.

## Risks

- **The subdomain prerequisite is real work.** If it slips, this app slips with it. Worth scoping that out before committing dates here.
- **`sites` schema drift.** status-pulse owns the `sites` table; if its schema changes, our join breaks. Mitigation: pin the columns we read in `queries.ts`, write a tiny smoke test that fails loudly if a column disappears, document the dependency in CLAUDE.md.
- **Per-user `clients` is the wrong long-term shape but right v1 shape.** Workspace migration is straightforward but easy to forget — captured above so it doesn't get lost.
- **SSL check via raw TLS may surprise some hosts.** Some sites front behind Cloudflare / odd SNI. Have the cron log failures and surface them as "SSL data unavailable" in the UI rather than alerting.
- **Cron cost.** Two daily-ish crons with potentially many URLs. With current org size this is fine; revisit if `client_sites` grows past a few hundred.
- **Alert spam.** First implementation of alerting in this repo. Aggressive de-dupe rules. Add a "snooze for 24h" affordance on each alert.
- **Manual `openTicketCount` will go stale fast.** People won't update it. v1 acceptance: it's better than nothing; v2 is the real Jira integration.
- **AI summary cost.** Sonnet on every "Refresh summary" click could add up. 1-hour cache + rate limit + pro-tier gate are the three lines of defense.
- **`accounts` partial-unblock confusion.** People may expect `accounts` to "just work" once `clients` exists. It'll improve but won't be done. Be explicit in the PR description.
- **CLAUDE.md `lib-listing` block.** This plan adds new files under `apps/web/lib/` only if we extract shared helpers there (e.g. `lib/concurrent.ts` for the TLS p-limit). If we add anything, the listing block must be updated in the same PR or `pnpm lint` fails.

## All decisions resolved

Nothing remaining. Plan is ready to implement once the subdomain-prerequisite PR lands.
