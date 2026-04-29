# Plan: Promote `meme-generator` to a standalone mini-app

## Goal

Move `meme-generator` out of `command-center` into its own mini-app at `meme-generator.lastrev.com`, and level it up from a stateless canvas tool into a full meme studio: saved-meme library, real image templates with multiple text zones, and AI-generated captions. Free tier gets a small library cap; paid (`pro`) tier unlocks AI and a much higher cap.

## Resolved decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Scope | **Option C** — full studio: library + image templates + AI captions, all in one PR. |
| 2 | Subdomain | **`meme-generator`** (`meme-generator.lastrev.com`). Slug stays the same. |
| 3 | Auth / app tier | `auth: true`, `tier: free`, `permission: view`, `template: full`. Per-feature gating handles the paid bits. |
| 4 | Ownership | Per-user. `meme_creations.user_id` with own-only RLS. |
| 5 | Image storage | Supabase Storage. Two buckets: **`memes`** (private, user creations, signed URLs) and **`meme-templates`** (public, template backgrounds). Both created via SQL migration. |
| 6 | Mutations | Server actions only. No client-direct Storage / DB writes. |
| 7 | Templates | **Real popular meme templates** sourced from the **imgflip public API** + Claude vision for zone refinement, via a re-runnable seed script. The 6 existing color schemes ship as abstract "Classic" templates seeded by the migration. |
| 8 | AI captioning | **In v1**, gated `memes:ai-caption` → `pro`. Vercel AI SDK + `@ai-sdk/anthropic`, `generateObject` returning a caption per text zone. Model: `claude-haiku-4-5`. Rate-limited 30/hour/user. |
| 9 | Save quotas | **Free: 5. Pro: 200. Enterprise: 500.** Enforced server-side in `saveMeme`. Quota hit → `UpgradePrompt`. |
| 10 | Title field | **Required** at save time. No auto-generated default. |
| 11 | User-uploaded backgrounds | Out of v1 (deferred). Templates are the seeded set only. |
| 12 | Public sharing | Out of v1. Memes are private to the creator. |
| 13 | Seed data | None for `meme_creations`. **`meme_templates` is split-seeded**: the migration inserts the 6 abstract color schemes; `scripts/seed-meme-templates.ts` adds popular image templates from imgflip + Claude. Re-runnable. |

## Current state

`apps/web/app/apps/command-center/meme-generator/` — `page.tsx` (5 lines) + `components/meme-generator-app.tsx` (251 lines). Pure client-side canvas renderer; six hardcoded `{bg, textColor, emoji}` "templates"; download/copy only; nothing persisted; no auth check at the data layer (it doesn't have one). Smoke test exists at `apps/web/app/apps/command-center/__tests__/meme-generator.test.tsx`.

Adjacent in the monorepo:
- `@repo/storage` — full Supabase Storage helpers, but **no app uses it yet**. This will be the first.
- AI SDK pattern is being established in the parallel `ideas` plan (`@ai-sdk/anthropic` + `generateObject`).

## Schema

Three migrations land together. All in `supabase/migrations/20260429_meme_*` with paired down-migrations.

### 1. `meme_creations` (user's saved memes)

```sql
create table if not exists public.meme_creations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null check (length(trim(title)) > 0),
  "templateId" text not null references public.meme_templates(id) on delete restrict,
  "textZones" jsonb not null default '{}'::jsonb,    -- { zoneId: text, ... } actual content per zone
  "fontSize" integer not null default 48 check ("fontSize" between 12 and 200),

  "storagePath" text not null,                       -- 'memes/<user_id>/<uuid>.png'
  "widthPx" integer not null default 600,
  "heightPx" integer not null default 450,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.meme_creations enable row level security;

create policy "Users read own memes"   on public.meme_creations for select using (auth.uid() = user_id);
create policy "Users insert own memes" on public.meme_creations for insert with check (auth.uid() = user_id);
create policy "Users update own memes" on public.meme_creations for update using (auth.uid() = user_id);
create policy "Users delete own memes" on public.meme_creations for delete using (auth.uid() = user_id);

create or replace function public.set_meme_creations_updated_at()
returns trigger language plpgsql as $$
begin new."updatedAt" = now(); return new; end;
$$;
create trigger trg_meme_creations_updated_at
  before update on public.meme_creations
  for each row execute function public.set_meme_creations_updated_at();

create index if not exists idx_meme_creations_user_created
  on public.meme_creations(user_id, "createdAt" desc);
```

### 2. `meme_templates` (catalog of image templates)

```sql
create table if not exists public.meme_templates (
  id text primary key,                              -- 'classic-top-bottom', 'two-panel', etc.
  name text not null,
  description text,
  category text not null,                           -- 'classic' | 'panel' | 'brain' | 'abstract'

  "imagePath" text,                                 -- nullable for color-scheme templates
  "imageWidth" integer not null,
  "imageHeight" integer not null,
  "backgroundColor" text,                           -- for color-scheme templates (no image)
  "defaultTextColor" text not null default '#ffffff',

  "textZones" jsonb not null,                       -- TextZone[] (see schema below)
  "isActive" boolean not null default true,
  "displayOrder" integer not null default 0,

  "createdAt" timestamptz not null default now()
);

alter table public.meme_templates enable row level security;

-- Templates are readable by all authenticated users
create policy "Authenticated users can read templates"
  on public.meme_templates for select
  using (auth.role() = 'authenticated');

create index if not exists idx_meme_templates_active_order
  on public.meme_templates("isActive", "displayOrder");
```

`textZones` jsonb is an array of:

```ts
type TextZone = {
  id: string;                         // 'top', 'bottom', 'panel-1', etc.
  label: string;                      // human label for the editor UI
  x: number; y: number;               // top-left, in image px
  width: number; height: number;
  align: "left" | "center" | "right";
  fontSize?: number;                  // optional override of the meme-wide fontSize
  color?: string;                     // optional override of the template's defaultTextColor
  uppercase?: boolean;
  defaultText?: string;
};
```

### 3. Storage buckets + RLS

In a separate migration (`20260429_meme_storage.sql`) since this touches the `storage` schema:

```sql
-- Private bucket for user-saved memes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memes', 'memes', false, 1048576, array['image/png'])
on conflict (id) do nothing;

create policy "Users read own meme blobs"
  on storage.objects for select
  using (bucket_id = 'memes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users insert own meme blobs"
  on storage.objects for insert
  with check (bucket_id = 'memes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own meme blobs"
  on storage.objects for delete
  using (bucket_id = 'memes' and auth.uid()::text = (storage.foldername(name))[1]);

-- Public bucket for template background images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meme-templates', 'meme-templates', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Read-only for all; writes only via service role (template uploads happen at deploy time)
create policy "Public can read meme templates"
  on storage.objects for select
  using (bucket_id = 'meme-templates');
```

Down-migration drops the policies and deletes the buckets.

### 4. Template seed — split between migration and AI script

**Migration seed** (in `20260429_meme_templates.sql`): inserts the 6 abstract color schemes that port the existing in-code constants. No image, just `backgroundColor` + standard top/bottom zones.

| id | name | category | image | zones |
|---|---|---|---|---|
| `classic` | Classic | classic | none | top, bottom |
| `dark-mode` | Dark Mode | classic | none | top, bottom |
| `matrix` | Matrix | classic | none | top, bottom |
| `vaporwave` | Vaporwave | classic | none | top, bottom |
| `fire` | Fire | classic | none | top, bottom |
| `ice-cold` | Ice Cold | classic | none | top, bottom |

**Image-template seed** (`scripts/seed-meme-templates.ts`, re-runnable):

```
1. Fetch popular templates from imgflip:
     GET https://api.imgflip.com/get_memes
     -> { success, data: { memes: [{ id, name, url, width, height, box_count, captions }] } }
2. For each template (configurable: top N, default 30):
     a. Skip if already in meme_templates with non-zero displayOrder.
     b. Download <url>.
     c. Upload to meme-templates bucket at <imgflip-id>.<ext>.
     d. Determine textZones:
          - If box_count <= 4: use a hard-coded layout table (1=center, 2=top/bottom,
            3=top/middle/bottom, 4=quadrants) scaled to the image dimensions.
          - Else: call Claude haiku with the image, ask for box_count zone rectangles
            via generateObject, validate against image bounds.
     e. Insert/upsert row in meme_templates with imagePath = bucket path,
        category = 'popular', displayOrder = position from imgflip.
3. Log a summary: added, updated, skipped.
```

The script lives next to the existing scripts (`scripts/seed-meme-templates.ts`), uses `@repo/db/service-role` (CLI-only), and is documented in `package.json` as `pnpm seed:meme-templates`. Run it once after deploy and again any time you want to refresh the catalog.

Why split (migration seeds color templates, script seeds image templates)?
- The migration must be deterministic and offline-runnable in CI; it can't make network calls to imgflip.
- The image templates depend on a third-party API + an AI vision call — both fit better in a one-shot operational script.
- Keeps migrations append-only and small.

## Server actions

In `apps/web/app/apps/meme-generator/actions.ts`. All `"use server"`, all `zod`-validated, all scoped by `auth.uid()`, all logged via `@repo/logger`, non-trivial ones wrapped in `withSpan`.

| Action | Tier | Purpose |
|---|---|---|
| `listTemplates()` | free | SELECT active templates ordered by `displayOrder`. Cached for ~5 min via Upstash. |
| `saveMeme(formData)` | free, **quota-gated** | Validate size/MIME on the PNG blob, count user's existing memes, reject if `count >= quota`, upload to `memes/<user_id>/<uuid>.png`, INSERT row. Returns saved row. |
| `listMyMemes()` | free | SELECT all of `auth.uid()`'s memes ordered by `createdAt desc`. Returns rows with signed URLs (1-hour expiry). |
| `getMemeSignedUrl(id)` | free | Re-sign URL for one meme. |
| `updateMemeTitle(id, title)` | free | UPDATE `title` only. |
| `deleteMeme(id)` | free | Delete blob + row. If blob delete fails, leave row and log so we can sweep later. |
| `generateMemeCaption({ topic, templateId, style? })` | **`pro`** | AI SDK call returning `{ [zoneId]: string }`. Rate-limited 30/hour/user. |

### Quota check in `saveMeme`

```ts
import { hasFeatureAccess } from "@repo/billing/has-feature-access";

const QUOTA = { free: 5, pro: 200, enterprise: 500 } as const;

const tier = await getUserTier(userId);                         // existing helper from billing
const quota = QUOTA[tier] ?? QUOTA.free;
const { count } = await supabase
  .from("meme_creations")
  .select("id", { count: "exact", head: true })
  .eq("user_id", userId);

if ((count ?? 0) >= quota) {
  throw new QuotaExceededError({
    feature: "memes:save-quota",
    current: count ?? 0,
    limit: quota,
    upgradeTier: tier === "free" ? "pro" : "enterprise",
  });
}
```

The UI catches `QuotaExceededError` and renders `<UpgradePrompt feature="memes:save-quota" />` with tier-aware copy: free users see "Upgrade to Pro for 200 saves"; pro users see "Upgrade to Enterprise for 500 saves".

### `generateMemeCaption` — AI integration

```ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const captionSchema = (zoneIds: string[]) =>
  z.object(Object.fromEntries(zoneIds.map((id) => [id, z.string().max(80)])));

export async function generateMemeCaption(input: {
  topic: string;
  templateId: string;
  style?: string;
}) {
  // ... auth + tier gate + rate-limit ...

  const template = await getTemplate(input.templateId);
  const zoneIds = template.textZones.map((z) => z.id);

  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5"),
    schema: captionSchema(zoneIds),
    system:
      "You write punchy meme captions. Keep each zone under 8 words. ALL CAPS. " +
      "No hate, slurs, or mean-spirited content. Match the structure suggested by the zone labels.",
    prompt: [
      `Topic: ${input.topic}`,
      `Style: ${input.style ?? "any"}`,
      `Template: ${template.name}`,
      `Zones (return one short caption per zone id):`,
      ...template.textZones.map((z) => `  - ${z.id}: ${z.label}`),
    ].join("\n"),
  });

  return object;                                                 // { [zoneId]: caption }
}
```

Env vars (registered in `turbo.json` `globalEnv` and `apps/web/lib/env.ts`):
- `ANTHROPIC_API_KEY`

Local dev fallback: when `ANTHROPIC_API_KEY` is unset, return deterministic stub captions (`"WHEN YOU FINALLY"`, `"SHIP THE FEATURE"` style) and log a warning. Mirrors the cringe-rizzler / ideas pattern.

## UI changes

After moving files to `apps/web/app/apps/meme-generator/`, the editor needs substantial work — the current `meme-generator-app.tsx` only knows about `topText`/`bottomText`. Multi-zone is a meaningful refactor.

### Editor layout

- **Template picker** — gallery of templates (image thumbnail + name). Categories: Classic / Panel / Abstract.
- **Text zones** — dynamic list of inputs, one per zone in the selected template, labeled per the template's `zones[].label`.
- **Font size slider** (kept).
- **Title input** (required to enable Save).
- **Generate caption with AI** button — gated. Opens a small modal asking for a topic; on submit fills the zone inputs.
- **Save / Download / Copy** action bar.
- **Quota indicator** — small text near Save: "3/5 saved memes" (or "12/500 (Pro)"); hits `<UpgradePrompt>` once at limit.

### Canvas renderer

- Replace the current top/bottom-only `drawText` with a zone-driven renderer. For each `TextZone`, compute wrapped lines, draw within the zone's bounding box.
- For image templates, `drawImage()` the template PNG first (loaded once and cached via `Image()`), then draw text zones on top.
- Color-scheme templates (the existing 6) render the same way they do today, just routed through the new zone logic with `top` and `bottom` zones synthesized.

### My Memes panel

- Separate route `apps/web/app/apps/meme-generator/library/page.tsx`, accessible from a tab or button in the header.
- Grid of saved memes: thumbnail, title (inline-editable), date, "Load into editor" button, delete (with confirm).
- Empty state when no saves.

### Token-cleanup pass

Same issue as `ideas-app.tsx`: the current file uses `text-white/X` opacity utilities and inline `bg + "40"` color strings. Audit and convert to `@repo/theme` tokens during the move so `scripts/audit-tokens.ts` stays green.

## Step-by-step

1. **Scaffold.** `pnpm create-app meme-generator --name="Meme Generator" --subdomain=meme-generator --tier=free --template=full --permission=view --auth=true`
2. **Move files.** `apps/web/app/apps/command-center/meme-generator/{page.tsx, components/meme-generator-app.tsx}` → `apps/web/app/apps/meme-generator/`. Move the existing smoke test under `__tests__/`.
3. **Migrations.** Add the three migration pairs (`meme_templates`, `meme_creations`, `meme_storage`). `pnpm lint` enforces the pairs.
4. **Template seed script.** Implement `scripts/seed-meme-templates.ts` per the spec above (imgflip API → bucket upload → Claude-vision zones for `box_count > 4`, hard-coded layouts otherwise). Add `pnpm seed:meme-templates` to the root `package.json`. Run it once against staging, verify zones look reasonable, then run against prod as part of the rollout.
5. **Refactor renderer.** Rewrite the canvas drawing logic to be zone-driven. Add image-template rendering path with image preloading.
6. **Server actions.** Implement the seven actions. Use `@repo/storage` for blob ops; use `@repo/billing/has-feature-access` for tier checks.
7. **Feature flag.** Add `memes:ai-caption` to `apps/web/lib/tier-config.ts` requiring `pro`.
8. **UI.** Template gallery, zone inputs, AI caption modal, title input, save bar, quota indicator. New `/library` route.
9. **Command Center cleanup.** Remove the `meme-generator` tile (or repoint to the new subdomain), decrement the hardcoded `"21" Routes` literal.
10. **Tests.**
    - Unit: `actions.test.ts` (each action; `saveMeme` quota at boundary; RLS rejection for cross-user); `score.test.ts`-style tests for the zone-aware caption schema generator.
    - Component: extend the existing meme-generator smoke test to cover template selection, zone editing, save flow.
    - e2e (Playwright): create with image template → AI caption (mocked) → save → reload → see in library → upload to library limit, expect upgrade prompt → delete one → save again succeeds.
11. **Verify.** `pnpm lint`, `pnpm test`, `pnpm dev`, click through end-to-end.

## Risks

- **Template image licensing.** Pulling popular meme images from imgflip (which itself hosts copyrighted source material — Drake, Distracted Boyfriend, etc.) follows industry practice but is fair-use-gray-area for a paid product. Imgflip's own terms permit `get_memes` API use; the underlying copyright on the source photographs is unaddressed by that permission. **Acceptable for an internal/personal-use tool; revisit before any external commercial launch.** Mitigations: (a) source URL is recorded in `meme_templates.imagePath` so we can audit/remove later; (b) the seed script can filter out templates whose source we want to avoid via an `EXCLUDED_TEMPLATE_IDS` constant; (c) abstract color schemes remain available as a safe fallback set.
- **imgflip API stability.** No rate limit published; treat as best-effort. The script should retry transient failures, dedupe by imgflip id, and degrade gracefully (skip a template, don't fail the whole run).
- **Claude vision zones drift.** For `box_count > 4` templates we lean on AI vision to predict zones; results may need tweaking. Script logs proposed zones; manual review before promoting to production. Add a `dryRun` flag.
- **Storage quota enforcement race.** Two concurrent `saveMeme` calls could both pass the count check at `n=4` and land at `n=6`. For a soft consumer-facing limit this is fine; if it becomes an abuse vector, switch to a `select ... for update` pattern or a database trigger.
- **Storage cleanup on delete failure.** If the blob delete fails after the row delete (or vice versa), we leak. The action ordering is row-first then blob; if blob fails we log a "needs sweep" record. Worth a periodic cleanup cron later (out of v1).
- **AI cost runaway.** `generateMemeCaption` could be hammered. Rate-limit (30/hour/user) + `pro`-tier gate + tight `max_tokens` on the model call.
- **Storage RLS for buckets.** This is the first app to use Storage, so nobody has battle-tested the bucket RLS in this repo. The `auth.uid()::text = (storage.foldername(name))[1]` pattern is Supabase-canonical but worth a manual cross-user test before merging.
- **Hardcoded Command Center stats.** Same as the ideas plan — `MODULES.length` and the `"21" Routes` literal drift after the move; fix both in the same change.
- **CLAUDE.md "27 apps" copy.** Will be 28 after `ideas`, 29 after this. Bump if precision matters.
- **The renderer rewrite is the riskiest piece.** Text wrapping inside arbitrary zone rectangles + image-template support is more code than the current `drawText` and easy to regress on. Keep the existing 6 color schemes working first, then add image templates as a second pass.

## All decisions resolved

Nothing remaining. Plan is ready to implement on your go.
