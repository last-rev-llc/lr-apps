# Plan: Promote `ideas` to a standalone mini-app

## Goal

Move `ideas` out of `command-center` into its own mini-app at `ideas.lastrev.com`, with a real Supabase-backed `ideas` table and a complete write surface (manual CRUD + AI-powered planning/scoring). Today it is a sub-route under Command Center, queries a table that does not exist, and mutates from the client to that nonexistent table.

## Resolved decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Ownership | **Per-user.** Each idea has a `user_id`; RLS restricts read/write to the owner. |
| 2 | Write surface | **Full CRUD.** Create, edit, status change, rate, hide, snooze, archive (soft delete). |
| 3 | `compositeScore` | **Server-side**, stored in DB. Computed by the AI planning endpoint (and recomputed on manual feasibility/impact/effort edits). Formula baseline: `(feasibility + impact) / effortWeight` where `Low=1, Medium=2, High=3`. Drives the queue order. |
| 4 | `source` enum | **All three kept.** `manual` (primary v1 path), `generated` (future automation), `community` (future public submission). |
| 5 | Mutations | **Server actions only.** Drop the client-direct Supabase calls. Validate with `zod`. |
| 6 | Tier / gating | **App tier: `free`** for manual CRUD. **Feature gate** `ideas:ai-plan` requires `pro`. |
| 7 | Categories | **Free-text** column, no CHECK. UI shows 6 known categories as datalist suggestions; new ones allowed. |
| 8 | Seed data | **None.** App starts empty. |
| 9 | `plan` storage | **Markdown text** column. Rendered with the existing markdown renderer in the UI. |
| 10 | AI provider | **Vercel AI SDK + Anthropic Claude** via `generateObject` (structured score + markdown plan in one call). |
| 11 | Mental model | **Queue.** Idea backlog sorted by `compositeScore desc` once scored; status moves them through `new` → `backlog` → `in-progress` → `completed`. |

## Current state

**Code lives at** `apps/web/app/apps/command-center/ideas/`

```
ideas/
  page.tsx                       # async server component, calls getIdeas() -> <IdeasApp/>
  components/ideas-app.tsx       # 738-line client component (filters, sort, grid/list, scoring)
  lib/queries.ts                 # getIdeas() -> supabase.from("ideas").select("*")
  lib/types.ts                   # Idea, IdeaStatus, IdeaCategory, IdeaSource, etc.
```

**Registry:** no `ideas` entry in `apps/web/lib/app-registry.ts`. Linked from the Command Center dashboard tile.

**Database:** no migration creates `ideas`. The table is referenced only in `lib/queries.ts` and in three client-side `db.from("ideas").upsert(...)` calls inside `ideas-app.tsx` (rate / hide / snooze, all cast to `any`).

**Auth pattern (already established in repo):** `user_id uuid references auth.users(id)` + RLS policies using `auth.uid() = user_id`. Auth0 `session.user.sub` flows to Supabase via the configured client. No new infra needed.

## Target state

- Subdomain: `ideas.lastrev.com`
- Route group: `apps/ideas` (files at `apps/web/app/apps/ideas/`)
- App tier: `free`, auth `true`, permission `view`, template `full`
- Feature flag `ideas:ai-plan` requires paid tier (registered in `lib/tier-config.ts`)
- Backed by `public.ideas` table with per-user RLS
- All mutations through server actions in `apps/web/app/apps/ideas/actions.ts`
- AI planning + scoring through a dedicated server action that calls an external endpoint (see "AI integration" below — **blocked on the skill the user will provide**)
- Command Center tile updated to link to the new subdomain (or removed)

## Schema

**`supabase/migrations/20260429_ideas.sql`**

```sql
create table if not exists public.ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text not null default '',
  category text,                                   -- free-text, datalist suggestions in UI

  status text not null default 'new'
    check (status in ('new','backlog','in-progress','completed','archived')),
  source text not null default 'manual'
    check (source in ('generated','community','manual')),

  feasibility integer check (feasibility between 0 and 10),
  impact integer check (impact between 0 and 10),
  effort text check (effort in ('Low','Medium','High')),
  "compositeScore" numeric,

  rating numeric check (rating between 0 and 5),
  hidden boolean not null default false,
  "snoozedUntil" timestamptz,

  tags jsonb not null default '[]'::jsonb,
  author text,                                     -- display name; user_id is the source of truth
  "sourceUrl" text,
  plan text,                                       -- AI-generated markdown plan
  "planModel" text,                                -- e.g. "claude-sonnet-4-6" — for re-run decisions
  "planGeneratedAt" timestamptz,

  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.ideas enable row level security;

create policy "Users read own ideas"   on public.ideas for select using (auth.uid() = user_id);
create policy "Users insert own ideas" on public.ideas for insert with check (auth.uid() = user_id);
create policy "Users update own ideas" on public.ideas for update using (auth.uid() = user_id);
create policy "Users delete own ideas" on public.ideas for delete using (auth.uid() = user_id);

create or replace function public.set_ideas_updated_at()
returns trigger language plpgsql as $$
begin new."updatedAt" = now(); return new; end;
$$;

create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_ideas_updated_at();

create index if not exists idx_ideas_user_status_created
  on public.ideas(user_id, status, "createdAt" desc);
create index if not exists idx_ideas_user_hidden_snoozed
  on public.ideas(user_id, hidden, "snoozedUntil");
```

**`supabase/migrations/20260429_ideas.down.sql`**

```sql
drop trigger if exists trg_ideas_updated_at on public.ideas;
drop function if exists public.set_ideas_updated_at();
drop policy if exists "Users delete own ideas" on public.ideas;
drop policy if exists "Users update own ideas" on public.ideas;
drop policy if exists "Users insert own ideas" on public.ideas;
drop policy if exists "Users read own ideas" on public.ideas;
drop index if exists public.idx_ideas_user_hidden_snoozed;
drop index if exists public.idx_ideas_user_status_created;
drop table if exists public.ideas;
```

Notes:
- Quoted camelCase columns match the existing `Idea` type and `queries.ts` — avoids touching `lib/types.ts`.
- `tags` is `jsonb` so the `JSON.parse` in `queries.ts` becomes redundant; remove it during the move.
- `compositeScore` is **not** a generated column — written by the AI action and (cheaply) recomputed by the manual edit action when feasibility/impact/effort change.
- `category` is intentionally untyped at the DB layer; the type union in `lib/types.ts` stays as the *suggested* values.

## Server actions

All in `apps/web/app/apps/ideas/actions.ts`, each `"use server"`, each:
- `zod`-validates input
- Resolves `user_id` from the Auth0 session (no client-supplied `user_id`)
- Uses `@repo/db/server`
- Returns a typed result; throws on validation failure
- Logged via `@repo/logger`, wrapped in `withSpan` from `lib/otel.ts` for non-trivial work

| Action | Purpose | Tier gate |
|---|---|---|
| `createIdea({ title, description, category?, tags?, source?, sourceUrl? })` | INSERT new idea, default status `new`, source `manual`. | free |
| `updateIdea(id, patch)` | UPDATE title/description/category/tags/sourceUrl/feasibility/impact/effort. Recompute `compositeScore` if scoring inputs change. | free |
| `setIdeaStatus(id, status)` | UPDATE status; set `completedAt` when transitioning to `completed`, clear it otherwise. | free |
| `rateIdea(id, stars)` | UPDATE rating (0–5; 0 to clear). Replaces today's client-side upsert. | free |
| `toggleHideIdea(id)` | Flip `hidden`. Replaces today's client-side upsert. | free |
| `snoozeIdea(id, duration \| null)` | Set `snoozedUntil` from `"1d"\|"1w"\|"2w"\|"1mo"` or `null` to unsnooze. Replaces today's client-side upsert. | free |
| `archiveIdea(id)` | Soft delete: status → `archived`. | free |
| `deleteIdea(id)` | Hard delete. Confirm-modal in UI. | free |
| `planAndScoreIdea(id)` | Calls the AI endpoint with title+description, persists `feasibility`, `impact`, `effort`, `compositeScore`, `plan`. | **paid** (`ideas:ai-plan`) |

**Composite-score helper** lives in `apps/web/app/apps/ideas/lib/score.ts`:

```ts
const EFFORT_WEIGHT = { Low: 1, Medium: 2, High: 3 } as const;
export function computeComposite(feasibility: number | null, impact: number | null, effort: string | null): number | null {
  if (feasibility == null || impact == null || !effort) return null;
  const w = EFFORT_WEIGHT[effort as keyof typeof EFFORT_WEIGHT];
  return w ? (feasibility + impact) / w : null;
}
```

Used by both `updateIdea` (manual edits) and `planAndScoreIdea` (AI returns the inputs; we still derive the score so it stays consistent).

## Feature gating

Add to `apps/web/lib/tier-config.ts`:

```ts
"ideas:ai-plan": { requiredTier: "pro", label: "AI idea planning & scoring" },
```

Then in `planAndScoreIdea`:
```ts
import { hasFeatureAccess } from "@repo/billing/has-feature-access";
// ...
if (!(await hasFeatureAccess(userId, "ideas:ai-plan"))) {
  throw new FeatureAccessError("ideas:ai-plan");
}
```

Client UI: render the "Plan & score with AI" button always; on click, if access denied, show the existing `<UpgradePrompt/>` from `apps/web/components/`.

## AI integration

Stack: **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) using `generateObject` for typed structured output. Lives in `apps/web/app/apps/ideas/lib/ai-plan.ts`, called from the `planAndScoreIdea` server action.

**Schema (zod) returned by the model:**
```ts
const PlanSchema = z.object({
  feasibility: z.number().int().min(0).max(10).describe("How achievable with typical web-dev resources, 0-10"),
  impact: z.number().int().min(0).max(10).describe("Expected value if completed, 0-10"),
  effort: z.enum(["Low", "Medium", "High"]),
  plan: z.string().describe("A markdown action plan: 5-10 short bullets or numbered steps"),
});
```

**Action shape:**
```ts
const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-6"),
  schema: PlanSchema,
  system: IDEAS_PLANNER_SYSTEM_PROMPT,
  prompt: `Title: ${title}\nDescription: ${description}\nCategory: ${category ?? "uncategorized"}`,
});

const compositeScore = computeComposite(object.feasibility, object.impact, object.effort);

await supabase.from("ideas").update({
  feasibility: object.feasibility,
  impact: object.impact,
  effort: object.effort,
  compositeScore,
  plan: object.plan,
  planModel: "claude-sonnet-4-6",
  planGeneratedAt: new Date().toISOString(),
}).eq("id", id).eq("user_id", userId);
```

**System prompt** (in `apps/web/app/apps/ideas/lib/ai-plan.ts`, exported for testing):
```
You are an idea evaluation assistant for a personal/team product backlog.
For a given idea, return a feasibility score (0–10), impact score (0–10), an
effort tier (Low/Medium/High), and a concise markdown plan to build it.
The plan should be 5–10 short steps, each actionable. Do not editorialize.
```

**Why `generateObject` over `streamText`:**
- One call returns both score + plan with type safety
- No streaming UI needed — the user clicks "Plan & score with AI" and waits ~3–8s; show a spinner
- If we want streamed plan rendering later, switch to `streamObject` without changing the schema

**Dependencies (add to `apps/web/package.json`):**
- `ai` (latest)
- `@ai-sdk/anthropic` (latest)

**Env vars** (register in `turbo.json` `globalEnv` + `apps/web/lib/env.ts`):
- `ANTHROPIC_API_KEY` — used by `@ai-sdk/anthropic`

**Caching / cost guard:**
- No DB-side cache for v1. Re-running the action overwrites prior values (intentional — user can re-score after editing).
- Rate-limit the action via `lib/rate-limit.ts` keyed by `user_id` (e.g. 20 calls / hour) so a stuck loop can't burn the budget.
- Surface `planModel` and `planGeneratedAt` in the UI so it's visible when a plan is stale relative to the current model.

**Local dev fallback:**
- When `ANTHROPIC_API_KEY` is unset, the action returns a deterministic stub (mirrors the cringe-rizzler pattern). Logs a warning. Lets the rest of the app run end-to-end without a key.

## Step-by-step

### 1. Scaffold

```
pnpm create-app ideas \
  --name="Ideas" \
  --subdomain=ideas \
  --tier=free \
  --template=full \
  --permission=view \
  --auth=true
```

### 2. Move files into the new app

From `apps/web/app/apps/command-center/ideas/` → `apps/web/app/apps/ideas/`:
- `page.tsx` (overwrite scaffolded)
- `components/ideas-app.tsx`
- `lib/queries.ts`
- `lib/types.ts`

Keep the scaffolded `layout.tsx` (wires `requireAppLayoutAccess`).

### 3. Rewrite `ideas-app.tsx` mutations

- Remove `import { createClient } from "@repo/db/client"`, the `db` instance, the `ideasTable()` helper, and all three client-direct upserts.
- Replace `rateIdea`, `toggleHide`, `snoozeIdea` with calls to the corresponding server actions (kept in `apps/web/app/apps/ideas/actions.ts`).
- Add UI surfaces that don't exist today: **New Idea** button → modal/form, **Edit** button per card, **Status pill** as a dropdown, **Plan & score with AI** button (gated), **Archive** + **Delete** in a row menu.

### 4. Migration

Add `20260429_ideas.sql` + `20260429_ideas.down.sql` (above). `pnpm lint` enforces the pair via `scripts/check-migration-pairs.ts`.

### 5. Server actions + score helper

Create `apps/web/app/apps/ideas/actions.ts` and `apps/web/app/apps/ideas/lib/score.ts`. Each action wraps `withSpan`, validates with `zod`, scopes by `auth.uid()`. `planAndScoreIdea` is stubbed deterministically until the skill lands.

### 6. Feature flag

Add `ideas:ai-plan` to `lib/tier-config.ts`. Update `apps/web/components/UpgradePrompt.tsx` copy if needed.

### 7. Update Command Center

In `apps/web/app/apps/command-center/page.tsx`:
- Either remove the `ideas` tile from `MODULES`, or repoint `href` to the new subdomain (use a helper from `lib/platform-urls.ts` if one exists for cross-app links).
- Update the hardcoded `"21" Routes` count.

Delete `apps/web/app/apps/command-center/ideas/`.

### 8. Tests

- **Unit** (Vitest, `apps/web/app/apps/ideas/__tests__/`):
  - `actions.test.ts` — one per action, hitting a real test Supabase instance via `@repo/test-utils` (existing pattern in repo). Cover happy path + RLS rejection (other-user row).
  - `score.test.ts` — `computeComposite` table-driven tests for the formula edge cases (null inputs, all three effort tiers).
  - `queries.test.ts` — sort order, JSON parsing for legacy string `tags` column.
- **e2e** (Playwright, `apps/web/tests/`):
  - `ideas.spec.ts` — sign in → create → edit category/tags → rate → snooze → archive → confirm only own ideas visible.
  - AI action mocked at the network layer for now; revisit once the skill lands.

### 9. Verify

- `pnpm lint` — registry shape, lib-listing, migration pair, token audit (no inline `var(--color-*)` should leak from current `ideas-app.tsx` — see Risks)
- `pnpm test --filter @repo/web`
- `pnpm dev` → visit `?app=ideas` (or `ideas.localhost:3000`)
- Confirm tile is gone from Command Center and no broken links remain

## Out of scope for v1 (deliberately deferred)

- **`source: generated` automation.** Cron/endpoint that creates ideas without a user prompt. Schema supports it (`source` column), but no producer exists yet.
- **`source: community` submission flow.** Public route + abuse-resistant submission form; need rate limiting + moderation. Defer until there's a use case.
- **Real-time / multi-user collaboration.** Last-write-wins; refresh to see updates.
- **Search backend.** Client-side search over the loaded list; revisit when a user has >500 ideas.
- **Tag autocomplete.** Freeform `jsonb` array; add a `distinct unnest(tags)` query if/when users ask.

## Risks

- **AI cost runaway.** Anthropic calls aren't free; a buggy useEffect or impatient user could rack up calls. Mitigate with rate limit (20/hour/user) + the existing `pro`-tier gate.
- **Token violations in `ideas-app.tsx`.** The current file uses `var(--color-pill-X)` inline styles and `text-white/...` opacity utilities. `scripts/audit-tokens.ts` may flag these. Worth a follow-up cleanup pass; not a blocker for the move itself.
- **Stale links to `command-center/ideas`.** Anything in docs/Slack/bookmarks will 404 after the directory delete. If that matters, add a redirect from `/apps/command-center/ideas` to the new subdomain in `proxy.ts`.
- **Hardcoded Command Center stats.** `MODULES.length` and the `"21" Routes` literal drift after the move; fix both in the same change.
- **CLAUDE.md "27 apps" copy.** Becomes 28. Approximate, but worth bumping for accuracy.
- **Markdown rendering.** The current `ideas-app.tsx` doesn't render markdown anywhere — need to add a renderer (use whatever's already in `@repo/ui` or pull in `react-markdown`) for the `plan` field.

## All decisions resolved

Nothing remaining. Plan is ready to implement on your go.
