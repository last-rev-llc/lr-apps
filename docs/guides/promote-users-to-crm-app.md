# Plan: Promote `command-center/users` to standalone `crm` app

## Goal

Move the `users` sub-app out of `command-center` into its own mini-app at `crm.apps.lastrev.com`, and expand it from a read-only contact directory into a full lightweight CRM: create/update/delete contacts, manual notes, and AI-driven enrichment that populates the `insights` payload (communication style, personality, interests, conversation starters, topics to avoid). The existing `contacts` table — which currently lives in Supabase but is **not tracked in this repo** — gets a formal migration as part of the move.

## Resolved decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Slug + subdomain | **`crm`** → `crm.apps.lastrev.com`. Old sub-app slug `users` is retired. |
| 2 | Scope | **Expand**: port the existing list/detail UI **plus** add CRUD (create/update/delete contact, edit notes/tags) and an AI enrichment endpoint. |
| 3 | Auth / tier | `auth: true`, `tier: enterprise`, `permission: admin`, `template: full`. Re-evaluate after v1 if a non-admin read-only role is needed. |
| 4 | Insights pipeline | AI-driven via a server endpoint inside the app (Vercel AI SDK + `@ai-sdk/anthropic`, `generateObject` against the `ContactInsights` shape). Triggered per-contact from the detail panel; rate-limited; writes to `contacts.insights` and `contacts.last_researched_at`. |
| 5 | Schema | **New migration** in `supabase/migrations/` that captures the existing `contacts` table shape (so it's tracked going forward), plus RLS, indexes, and `updatedAt` trigger. Paired `up.sql` + `down.sql`. |
| 6 | Old location | **Remove** from `command-center` MODULES grid, delete the sub-app directory, and add a temporary redirect from `command-center.apps.lastrev.com/users` → `https://crm.apps.lastrev.com`. |

## Current state

`apps/web/app/apps/command-center/users/`:

- `page.tsx` (10 lines) — server component, calls `getContacts()`, renders `<UsersApp>`.
- `components/users-app.tsx` (410 lines) — client component. Search + filter (type, company) + sort + grid/list view + detail-panel toggle.
- `components/contact-detail.tsx` (595 lines) — client detail panel. Read-only.
- `lib/queries.ts` — `getContacts()` only. Reads from Supabase `contacts` via `@repo/db/server`. Parses `tags` and `insights` JSON fields.
- `lib/types.ts` — `Contact`, `ContactInsights`, `CommunicationStyle`, `Personality`, `Interests`, sort/view enums.

External references:

- `apps/web/app/apps/command-center/__tests__/users.test.tsx` — smoke test importing `UsersApp`.
- `apps/web/app/apps/command-center/page.tsx:36` — MODULES grid entry (`slug: "users"`, `label: "Users"`, `category: "Admin"`).

No write paths exist today. No `contacts` migration in `supabase/migrations/`. The `last_researched_at`/`insights` fields are populated externally — that pipeline will be replaced by the new in-app endpoint.

## Schema

One migration pair: `supabase/migrations/<DATE>_crm_contacts.{up,down}.sql`.

The `contacts` table already exists in Supabase. The migration is written to be **idempotent and non-destructive** (`create table if not exists`, `do $$ ... $$` guards on policy/index creation) so that applying it against an environment that already has the table is a no-op for shape but adds anything missing (RLS, trigger, indexes). Verify column names against the live table before finalizing.

```sql
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  title text,
  company text,
  type text check (type in ('team','client','prospect','partner','vendor','contractor','personal','other')),
  avatar text,
  location text,
  timezone text,
  slack_id text,
  slack_handle text,
  github_handle text,
  linkedin_url text,
  twitter_handle text,
  website text,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  insights jsonb,
  last_researched_at timestamptz,
  confidence text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

-- RLS: enterprise admin app — gate via app-level admin permission, not per-row.
-- Allow authenticated users with the `crm:admin` permission to read/write. Per-row
-- ownership is not modeled (contacts are org-shared). Service role bypasses RLS as usual.
-- (If a less-privileged read role is added later, split into separate select/insert/update/delete policies.)
create policy "crm admins manage contacts"
  on public.contacts for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.set_contacts_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_contacts_updated_at();

create index if not exists idx_contacts_name on public.contacts (name);
create index if not exists idx_contacts_company on public.contacts (company);
create index if not exists idx_contacts_type on public.contacts (type);
create index if not exists idx_contacts_last_researched on public.contacts (last_researched_at desc nulls last);
```

Down migration drops the trigger, function, policy, and indexes — but **not the table** (data preservation; it predates this repo). If a clean drop is desired in dev, that's a separate scripted step, not the down-migration.

### Live schema audit

Run `pnpm tsx scripts/audit-contacts-schema.ts` (requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in env) before finalizing the migration. The script introspects the live `contacts` table via PostgREST's OpenAPI endpoint and prints a per-column punch list:

- `✓` ok
- `Δ` type drift / nullability drift (column exists, shape differs)
- `✖` missing in live (column in proposed DDL but not in live table)
- `?` extra in live (live column not in proposed DDL — decide: add to DDL, drop in a follow-up migration, or leave as legacy)

Exit code is non-zero if any drift or missing columns are found, so it's safe to wire into CI later. For machine-readable output, pass `--json`. The expected schema is hard-coded in the script's `EXPECTED_COLUMNS` map — keep it in sync with `lib/types.ts` and the migration DDL above.

## Routing & registry

Add via `pnpm create-app crm --name="CRM" --tier=enterprise --permission=admin --template=full`. That:

1. Appends an entry to `apps/web/lib/app-registry.ts`:
   ```ts
   { slug: "crm", name: "CRM", subdomain: "crm", routeGroup: "apps/crm", auth: true, permission: "admin", template: "full", tier: "enterprise", features: {} },
   ```
2. Creates `apps/web/app/apps/crm/{page.tsx,layout.tsx,__tests__/page.test.tsx}` from the `full` template (layout already wires `requireAppLayoutAccess("crm")`).

The proxy will then route `crm.apps.lastrev.com` → `/apps/crm/...` automatically (`apps/web/proxy.ts` reads the registry).

## Target file layout

```
apps/web/app/apps/crm/
  layout.tsx                       # generated; wires requireAppLayoutAccess("crm")
  page.tsx                         # server component; getContacts() → <CrmApp>
  loading.tsx
  error.tsx
  components/
    crm-app.tsx                    # ported from users-app.tsx; renamed; CRUD wired
    contact-detail.tsx             # ported; edit/save/delete + "Re-research" button
    contact-form.tsx               # NEW: create + edit form (used by detail + new-contact dialog)
  lib/
    queries.ts                     # getContacts, getContactById
    actions.ts                     # NEW: createContact, updateContact, deleteContact (server actions)
    enrich.ts                      # NEW: AI enrichment via @ai-sdk/anthropic generateObject
    schemas.ts                     # NEW: zod schemas for ContactInput + ContactInsights
    types.ts                       # ported from users/lib/types.ts (unchanged)
  api/
    enrich/
      route.ts                     # POST /api/enrich — body: { contactId } → runs enrich.ts, persists, returns updated insights
  __tests__/
    page.test.tsx                  # smoke (generated)
    crm-app.test.tsx               # ported from command-center/__tests__/users.test.tsx
    actions.test.ts                # NEW: server-action contracts
    enrich.test.ts                 # NEW: enrichment endpoint (mocked AI client)
```

## Mutations

All writes via **server actions** in `lib/actions.ts` (matching the `cringe-rizzler` and `cc-flags` pattern). Each action:

- `"use server"` directive at top.
- Validates input with a `zod` schema from `lib/schemas.ts`.
- Uses `@repo/db/server` (RLS-respecting) for the write.
- Re-validates the affected path (`revalidatePath("/")` inside the app) so the list refreshes after mutation.
- Wrapped in `withSpan` from `lib/otel.ts`.

```ts
// apps/web/app/apps/crm/lib/actions.ts
"use server";
export async function createContact(input: ContactInput): Promise<Contact> { /* ... */ }
export async function updateContact(id: string, input: Partial<ContactInput>): Promise<Contact> { /* ... */ }
export async function deleteContact(id: string): Promise<void> { /* ... */ }
```

The "Re-research" button in `contact-detail.tsx` calls the API route (not a server action) so it can stream/long-poll if needed.

## AI enrichment endpoint

`POST /api/enrich` under the `crm` app (`apps/web/app/apps/crm/api/enrich/route.ts`).

- **Input:** `{ contactId: string }`.
- **Auth:** the route handler calls `requireAppLayoutAccess("crm")` (or the route-handler equivalent — we use `requireAccess("crm", "admin")` from `@repo/auth`).
- **Rate limit:** `lib/rate-limit.ts` — e.g. 30/hour/user.
- **AI call:** Vercel AI SDK + `@ai-sdk/anthropic`, `generateObject` with a zod schema mirroring `ContactInsights`. Model: `claude-sonnet-4-6` for quality (research-heavy task; not just cosmetic generation). Prompt assembled from the contact's existing fields (name, title, company, social handles, notes) — see prompt below.
- **Persistence:** writes the returned object to `contacts.insights` and stamps `last_researched_at = now()`.
- **Response:** `{ insights: ContactInsights, last_researched_at: string }`.
- **Tracing:** wrapped in `withSpan("crm.enrich", { contactId })`.

#### Draft prompt (v0 — to be refined)

This is a starting point. The user will provide more detail on tone and the relationship-specific framing later; treat the wording below as a placeholder structure that gets the schema-shaped output flowing end-to-end.

**System message:**

```
You are a relationship-intelligence analyst helping Adam Harris (founder of
Last Rev) prepare to communicate effectively with the people in his network.
Given the structured profile of one contact, infer how Adam should approach
them: how they communicate, what motivates them, what to talk about, and
what to avoid.

Rules:
- Ground every claim in evidence from the provided profile fields. Do not
  invent biographical facts (employment history, achievements, family).
- When a field cannot be confidently inferred, omit it rather than guess.
  Lower the `confidence` value accordingly ("high" only when title, company,
  notes, and at least one social handle are all present and coherent).
- Keep all string fields concise (one short sentence; no markdown).
- For `interests.sharedWithAdam`, only list things both clearly applicable to
  the contact AND likely to resonate with a technical founder running a
  consultancy/product studio. If unclear, return an empty array.
- `topicsToAvoid` should be evidence-based (e.g. "competitor of $employer")
  not generic warnings ("avoid politics").
- Never include private, sensitive, or speculative health/political/
  religious content.
```

**User message (templated per contact):**

```
Contact profile:
- Name: {name}
- Title: {title ?? "(unknown)"}
- Company: {company ?? "(unknown)"}
- Type: {type ?? "(unknown)"}
- Email: {email ?? "(none)"}
- Location / timezone: {location ?? "?"} / {timezone ?? "?"}
- LinkedIn: {linkedin_url ?? "(none)"}
- GitHub: {github_handle ?? "(none)"}
- Twitter/X: {twitter_handle ?? "(none)"}
- Slack: {slack_handle ?? "(none)"}
- Website: {website ?? "(none)"}
- Tags: {tags.join(", ") || "(none)"}
- Existing notes: {notes ?? "(none)"}

Produce a ContactInsights object matching the provided schema. Be specific
to this person — generic advice ("be professional", "ask about their work")
should never appear.
```

**Schema (zod, mirrors `lib/types.ts`):**

```ts
const InsightsSchema = z.object({
  confidence: z.enum(["high", "medium", "low"]),
  summary: z.string().min(1).max(280),
  bestApproach: z.string().min(1).max(280),
  communicationStyle: z.object({
    formality: z.string().nullable(),
    tone: z.string().nullable(),
    responseSpeed: z.string().nullable(),
    preferredChannel: z.string().nullable(),
  }),
  personality: z.object({
    decisionStyle: z.string().nullable(),
    detailOrientation: z.string().nullable(),
    conflictStyle: z.string().nullable(),
    motivators: z.array(z.string()).max(6),
    stressors: z.array(z.string()).max(6),
  }),
  interests: z.object({
    professional: z.array(z.string()).max(8),
    personal: z.array(z.string()).max(8),
    sharedWithAdam: z.array(z.string()).max(6),
  }),
  conversationStarters: z.array(z.string()).max(6),
  topicsToAvoid: z.array(z.string()).max(6),
});
```

> **Open question:** does the existing external research pipeline (whatever populates `last_researched_at` today) need to be deprecated/disabled at the same time, or do we leave both writers running for a transition period? Suggest deprecating in the same change to avoid clobbering writes.

## Components — what changes from the port

- `users-app.tsx` → `crm-app.tsx`. Rename. Header copy changes from `"👥 Contacts"` to `"CRM"`; the existing subtitle (`"{n} contacts · {m} with insights"`) stays, so the page still tells you what's inside without needing the literal word "Contacts" in the title. Add a "+ New Contact" button that opens `<ContactForm>` in a dialog.
- `contact-detail.tsx`: add an "Edit" toggle that swaps the read-only view for `<ContactForm>` bound to the selected contact, plus a "Delete" button (confirm dialog) and a "Re-research" button that hits `/api/enrich`.
- `contact-form.tsx` (new): single form used by both create and edit. Fields driven by the zod schema. Uses `@repo/ui` form primitives.

No styling overhaul — the existing dark-glass design is fine. Tokens already come from `@repo/theme`; the audit-tokens script will catch any inline hex that sneaks in during the port.

## Auth & tier

- App-level: `requireAppLayoutAccess("crm")` (already wired by the `full` template).
- Permission: `crm:admin` (the registry entry's `permission: "admin"` becomes the required permission via the standard `requireAccess` flow).
- Tier: `enterprise`. Per-feature flags not needed for v1; revisit when adding read-only role.

## Cleanup of the old location

In the same PR (or a closely-following one):

1. **Remove** `apps/web/app/apps/command-center/users/` directory entirely.
2. **Remove** the `slug: "users"` entry from the MODULES array in `apps/web/app/apps/command-center/page.tsx:36`.
3. **Remove** `apps/web/app/apps/command-center/__tests__/users.test.tsx` (replaced by `apps/web/app/apps/crm/__tests__/crm-app.test.tsx`).
4. **Add a redirect** so `command-center.apps.lastrev.com/users` → `https://crm.apps.lastrev.com`. Two options:
   - **Preferred:** add `command-center/users/page.tsx` that does `redirect("https://crm.apps.lastrev.com")` (Next's `redirect()` from `next/navigation`). Simple, lives next to the rest of the command-center routes, easy to remove later.
   - Alternative: a `next.config.ts` redirect. Avoid — `next.config.ts` redirects are global and harder to scope to one host.
5. Plan to **delete the redirect** ~30 days after release once analytics confirm zero residual traffic.

## Migration sequence (PR breakdown)

One bundled PR is fine here — each piece is small, the surfaces are tightly coupled, and splitting would create a half-working state where the new app exists but the old one is still the canonical entry point.

1. **Audit the live schema:** `pnpm tsx scripts/audit-contacts-schema.ts`. Reconcile any drift before writing the migration (update `EXPECTED_COLUMNS` and the DDL until output is clean).
2. `pnpm create-app crm --name="CRM" --tier=enterprise --permission=admin --template=full` — registry + scaffolded app.
3. Add the contacts migration pair under `supabase/migrations/`.
4. Port `lib/types.ts`, `lib/queries.ts`, `components/users-app.tsx`, `components/contact-detail.tsx` into `apps/web/app/apps/crm/`. Rename `UsersApp` → `CrmApp` and the page header to `"CRM"`.
5. Add `lib/schemas.ts`, `lib/actions.ts`, `lib/enrich.ts`, `components/contact-form.tsx`.
6. Add `api/enrich/route.ts`.
7. Wire CRUD UI into `crm-app.tsx` and `contact-detail.tsx`.
8. Port + adapt the test to `apps/web/app/apps/crm/__tests__/crm-app.test.tsx`. Add `actions.test.ts` and `enrich.test.ts`.
9. Delete `apps/web/app/apps/command-center/users/` and `command-center/__tests__/users.test.tsx`.
10. Remove the `users` MODULES entry in `command-center/page.tsx`.
11. Add the redirect stub at `command-center/users/page.tsx`.
12. Run `pnpm lint` (catches `app-registry` + lib-listing drift, migration pairs, token audit). Run `pnpm test`.

## Open items / risks

- **Live schema audit.** Run `scripts/audit-contacts-schema.ts` and resolve all drift/missing/extra columns before writing the migration.
- **Existing insights writer.** Identify and disable whatever currently writes to `contacts.insights` / `contacts.last_researched_at` so the new endpoint isn't fighting it.
- **Insights prompt.** v0 prompt is a placeholder — the user will provide more relationship-specific framing later. The schema is the contract; prompt wording can iterate without changing the API.
- **Permission name.** `admin` is the app-level permission slot; if `crm:admin` collides with anything in `app-permissions` table, pick a more specific name.
- **Subdomain `crm` availability.** Confirm `crm` isn't taken in `app-registry.ts` (it shouldn't be, but `create-app` will error out if so).
- **Detail-panel size.** `contact-detail.tsx` is 595 lines. The port is a good moment to split it into edit/view sub-components rather than carrying the monolith forward — but only if it falls out of the CRUD work naturally; don't refactor for its own sake.
