# Plan: Promote `ai-scripts` to two standalone mini-apps

## Goal

Move the contents of `~/Documents/repos/ai-scripts` (a single Vite/Express
two-tab tool) into the `lr-apps` monorepo as **two separate mini-apps**:

1. **`chatflow-eval`** — runs curated CSV question sets against a configured
   chatflow endpoint (TheAnswerAI / Flowise-compatible) and produces
   eval-grade results with Langfuse trace links per question. Equivalent of
   the old "Eval Questions" tab.
2. **`csv-chatflow`** — uploads any CSV, sends each row (as JSON) through a
   user-selected chatflow with a configurable prompt template, and produces
   a derived results CSV. Equivalent of the old "CSV Chatflow Processor"
   tab.

Both apps are AI-power-user tools, so they live in the **`ai-tools`**
showcase group and gate AI execution behind the **`pro`** tier. CSV upload,
viewing past runs, and editing chatflow targets are **free**-tier so users
can poke around before paying.

The migration also turns the source repo's hardcoded "client config" file
(`config/kumello.json`, `config/ias.json`) into a first-class
**ChatflowTarget** entity in Supabase — per-user, with the API token stored
encrypted (NOT in env vars) — so this is no longer a build-time choice.

## Resolved decisions

These reflect the recommendation; flag any you want to revisit before I
start writing migrations.

| # | Decision | Choice |
|---|---|---|
| 1 | Scope | **Option C** — two apps + new shared package, in one logical PR series (one PR per app + one for the shared package). |
| 2 | Subdomains | **`chatflow-eval`** and **`csv-chatflow`**. Two separate registry entries. |
| 3 | Auth / app tier | Both: `auth: true`, `permission: view`, `template: full`, `showcaseGroup: ai-tools`. Base tier `free` (lets users see history and configure targets); AI execution itself gated per-feature by `pro`. |
| 4 | Per-feature gates | `chatflow-eval:run` → `pro`, `csv-chatflow:run` → `pro`. Free users can read/configure but cannot launch a queue. |
| 5 | Ownership | Per-user. `chatflow_targets`, `chatflow_runs`, `chatflow_run_rows` all scoped to `auth.uid()` with own-only RLS. |
| 6 | Secret storage | Chatflow API tokens are stored **encrypted at rest** using `pgsodium` (Supabase's native option) in `chatflow_targets.api_token_encrypted`. Never returned to the client; never logged. Server actions decrypt only at the moment of the outbound HTTP call. **No env-var fallback.** |
| 7 | CSV storage | Supabase Storage. Two buckets: **`chatflow-uploads`** (private, user-uploaded CSVs) and **`chatflow-results`** (private, generated result CSVs). Both keyed on `user_id` folder prefix; signed URLs only. |
| 8 | Mutations | Server actions only. No client-direct DB or Storage writes. Long-running queue execution is a server action that streams progress over a Supabase Realtime channel (see "Execution model"). |
| 9 | Question sets | Stored in DB as `question_sets` (per chatflow target), not on disk. Free tier capped at 3 sets; pro at 50; enterprise unlimited. Each set is a list of `{ uid, question }` rows. |
| 10 | Run history | Every queue execution creates a `chatflow_runs` row + one `chatflow_run_rows` per processed row. Results are queryable, exportable, and re-runnable. CSV output is generated on demand from the rows. |
| 11 | Concurrency cap | Free: max 3, Pro: max 10, Enterprise: max 25. Enforced server-side. |
| 12 | Langfuse links | Optional. Each `chatflow_target` has an optional `base_trace_url`; if set, per-row results display a deep link `{base_trace_url}/traces?tag={tag_uid}`. |
| 13 | CSV-chatflow prompt | The hardcoded "identify the question, transform to FAQ, generate 3-5 more" prompt is **not** baked in. It becomes a per-target `prompt_template` field with `{{rowJson}}` interpolation, defaulting to a curated FAQ-generator template. Pro users can edit. |
| 14 | Chatflow target editor | A small CRUD UI shared by both apps (lives in `@repo/ai-eval` package) — list / create / edit / delete chatflow targets. |
| 15 | Eval CSV upgrade path | The old `Question, UID, ResponseText, ResponseJSON` format isn't preserved on disk; users importing existing CSVs use the **Import Question Set** flow which parses `Question` (and optionally `UID`) columns into a fresh `question_set`. |

## Current state (source repo)

`~/Documents/repos/ai-scripts` ships:

- **Frontend:** React 18 + Vite, three pages: `Home.jsx`, `EvalQuestions.jsx`, `CSVChatflow.jsx`.
- **Backend:** Express on `:3010`, two controllers (`questionsController.js`, `csvChatflowController.js`).
- **Configs:** `config/kumello.json`, `config/ias.json` (selected by `CLIENT_CONFIG` env var).
- **Data:** `data/questions.csv`, `data/ias-questions/*.csv`, `data/csv-uploads/<timestamped uploads>`.
- **Hardcoded:** API tokens read from `process.env.{KUMELLO_API_TOKEN,IAS_STAGING_API_TOKEN}`; CSV chatflow prompt baked into `csvChatflowController.js`.
- **Queue logic** is duplicated across `useQuestions.js` and `useCSVChatflow.js`. Both implement rolling concurrency with abort.

The shape of the outbound HTTP call is identical for both tools:
```
POST {apiHost}/api/v1/prediction/{chatflowId}
  Authorization: Bearer {apiToken}
  body: { question, streaming: false, chatId, trackingMetadata: {...} }
```
The differences are (a) what goes into `question` and (b) how the response is parsed.

## Target state (in lr-apps)

```
apps/web/app/apps/
  chatflow-eval/                        ← NEW app
    page.tsx, layout.tsx
    actions.ts                          server actions
    components/
      target-picker.tsx
      question-set-picker.tsx
      run-controls.tsx
      run-history.tsx
      results-table.tsx
    lib/
      cancel-token.ts
    __tests__/
  csv-chatflow/                         ← NEW app
    page.tsx, layout.tsx
    actions.ts
    components/
      csv-upload.tsx
      target-picker.tsx
      prompt-template-editor.tsx
      run-controls.tsx
      results-table.tsx
    lib/
    __tests__/

packages/
  ai-eval/                              ← NEW shared package
    src/
      index.ts
      chatflow-client.ts                outbound POST + abort
      queue.ts                          rolling-concurrency engine (one impl for both apps)
      schema.ts                         zod for ChatflowTarget, QuestionSet, RunRow
      langfuse.ts                       generateLangfuseLink(tag, uid, baseUrl)
      csv.ts                            parse/format helpers (multi-line quoted fields)
      tier-limits.ts                    QUOTAS, CONCURRENCY_CAP per tier
      target-store.ts                   server-only CRUD for chatflow_targets
      run-store.ts                      server-only CRUD for chatflow_runs / rows
      ui/                               shared client components
        TargetEditor.tsx
        TargetPicker.tsx
        StatusBar.tsx
        ProgressOverlay.tsx
        ResultsTable.tsx
    package.json
    tsconfig.json

supabase/migrations/
  20260505_chatflow_01_targets.sql      + .down.sql
  20260505_chatflow_02_question_sets.sql + .down.sql
  20260505_chatflow_03_runs.sql         + .down.sql
  20260505_chatflow_04_storage.sql      + .down.sql
```

## Schema

All in dated migrations under `supabase/migrations/`, each with a paired
`*.down.sql`. Append-only — enforced by `scripts/check-migration-pairs.ts`.

### 1. `chatflow_targets` — configured chatflow endpoints (per user)

```sql
create extension if not exists pgsodium;

create table if not exists public.chatflow_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null check (length(trim(name)) > 0),
  api_host text not null,
  chatflow_id text not null,
  api_token_encrypted text not null,                 -- pgsodium.crypto_aead_det_encrypt output
  api_token_key_id uuid not null,                    -- pgsodium key id

  base_trace_url text,                               -- optional Langfuse project URL
  default_tag text,
  prompt_template text,                              -- only used by csv-chatflow; null for eval-only
  streaming boolean not null default false,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.chatflow_targets enable row level security;

create policy "Users read own chatflow targets"   on public.chatflow_targets for select using (auth.uid() = user_id);
create policy "Users insert own chatflow targets" on public.chatflow_targets for insert with check (auth.uid() = user_id);
create policy "Users update own chatflow targets" on public.chatflow_targets for update using (auth.uid() = user_id);
create policy "Users delete own chatflow targets" on public.chatflow_targets for delete using (auth.uid() = user_id);

create index if not exists idx_chatflow_targets_user on public.chatflow_targets(user_id);
```

`api_token_encrypted` is opaque to the application layer; only the
`@repo/ai-eval/target-store` server module (running with the service role
key) can decrypt and use it. The decrypted token never leaves the server
boundary — it goes straight into the outbound `Authorization` header.

### 2. `question_sets` and `question_set_items` (chatflow-eval)

```sql
create table if not exists public.question_sets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.chatflow_targets(id) on delete cascade,

  name text not null,
  tag text,                                          -- per-set tag for tracking_tag

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.question_set_items (
  id uuid default gen_random_uuid() primary key,
  set_id uuid not null references public.question_sets(id) on delete cascade,

  uid text not null,                                 -- short stable id for tracking_tag
  question text not null,
  position integer not null default 0,

  unique (set_id, uid)
);

alter table public.question_sets       enable row level security;
alter table public.question_set_items  enable row level security;

create policy "Users read own question_sets"   on public.question_sets for select using (auth.uid() = user_id);
create policy "Users insert own question_sets" on public.question_sets for insert with check (auth.uid() = user_id);
create policy "Users update own question_sets" on public.question_sets for update using (auth.uid() = user_id);
create policy "Users delete own question_sets" on public.question_sets for delete using (auth.uid() = user_id);

create policy "Users read own question_set_items" on public.question_set_items for select
  using (exists (select 1 from public.question_sets s where s.id = set_id and s.user_id = auth.uid()));
create policy "Users insert own question_set_items" on public.question_set_items for insert
  with check (exists (select 1 from public.question_sets s where s.id = set_id and s.user_id = auth.uid()));
create policy "Users update own question_set_items" on public.question_set_items for update
  using (exists (select 1 from public.question_sets s where s.id = set_id and s.user_id = auth.uid()));
create policy "Users delete own question_set_items" on public.question_set_items for delete
  using (exists (select 1 from public.question_sets s where s.id = set_id and s.user_id = auth.uid()));
```

### 3. `chatflow_runs` and `chatflow_run_rows` (both apps)

A `chatflow_run` represents one queue execution from either app — eval mode
or csv mode is distinguished by `mode`.

```sql
create type public.chatflow_run_mode as enum ('eval', 'csv');
create type public.chatflow_run_status as enum ('queued', 'running', 'completed', 'cancelled', 'errored');

create table if not exists public.chatflow_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.chatflow_targets(id) on delete restrict,

  mode public.chatflow_run_mode not null,
  status public.chatflow_run_status not null default 'queued',

  -- For eval mode:
  question_set_id uuid references public.question_sets(id) on delete set null,
  -- For csv mode:
  upload_storage_path text,                          -- 'chatflow-uploads/<user>/<uuid>.csv'
  prompt_template text,                              -- snapshot of target.prompt_template at run time

  tag text,                                          -- snapshot for tracking
  concurrency integer not null default 5,

  total_rows integer not null default 0,
  completed_rows integer not null default 0,
  errored_rows integer not null default 0,

  results_storage_path text,                         -- generated on completion

  "startedAt" timestamptz not null default now(),
  "finishedAt" timestamptz,

  error text                                          -- if status='errored'
);

create table if not exists public.chatflow_run_rows (
  id uuid default gen_random_uuid() primary key,
  run_id uuid not null references public.chatflow_runs(id) on delete cascade,

  position integer not null,
  uid text not null,
  input jsonb not null,                              -- {question} for eval, {row: {...}} for csv
  status public.chatflow_run_status not null default 'queued',

  response_text text,
  response_json jsonb,
  langfuse_link text,
  error text,

  "startedAt" timestamptz,
  "finishedAt" timestamptz,

  unique (run_id, uid)
);

alter table public.chatflow_runs      enable row level security;
alter table public.chatflow_run_rows  enable row level security;

create policy "Users read own runs"   on public.chatflow_runs for select using (auth.uid() = user_id);
create policy "Users insert own runs" on public.chatflow_runs for insert with check (auth.uid() = user_id);
create policy "Users update own runs" on public.chatflow_runs for update using (auth.uid() = user_id);
create policy "Users delete own runs" on public.chatflow_runs for delete using (auth.uid() = user_id);

create policy "Users read own run rows"   on public.chatflow_run_rows for select
  using (exists (select 1 from public.chatflow_runs r where r.id = run_id and r.user_id = auth.uid()));
create policy "Users insert own run rows" on public.chatflow_run_rows for insert
  with check (exists (select 1 from public.chatflow_runs r where r.id = run_id and r.user_id = auth.uid()));
create policy "Users update own run rows" on public.chatflow_run_rows for update
  using (exists (select 1 from public.chatflow_runs r where r.id = run_id and r.user_id = auth.uid()));

create index if not exists idx_chatflow_runs_user_started on public.chatflow_runs(user_id, "startedAt" desc);
create index if not exists idx_chatflow_run_rows_run on public.chatflow_run_rows(run_id, position);
```

`updatedAt` triggers and a `set_chatflow_*_updated_at()` function pattern
follow the meme-generator precedent.

### 4. Storage buckets + RLS

```sql
-- Private bucket for user-uploaded CSVs (csv-chatflow input)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chatflow-uploads', 'chatflow-uploads', false, 26214400, array['text/csv','application/csv'])
on conflict (id) do nothing;

create policy "Users read own chatflow uploads"
  on storage.objects for select
  using (bucket_id = 'chatflow-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users insert own chatflow uploads"
  on storage.objects for insert
  with check (bucket_id = 'chatflow-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own chatflow uploads"
  on storage.objects for delete
  using (bucket_id = 'chatflow-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

-- Private bucket for run results (output CSVs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chatflow-results', 'chatflow-results', false, 52428800, array['text/csv'])
on conflict (id) do nothing;

create policy "Users read own chatflow results"
  on storage.objects for select
  using (bucket_id = 'chatflow-results' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own chatflow results"
  on storage.objects for delete
  using (bucket_id = 'chatflow-results' and auth.uid()::text = (storage.foldername(name))[1]);

-- Inserts to chatflow-results are service-role only (server actions write
-- the results CSV after a run completes). No insert policy = no client writes.
```

`storage.foldername(name))[1] = auth.uid()` is the same pattern the
meme-generator migration established. Path layout:
`<user_id>/<run_id>/<filename>.csv`.

## Execution model — how the queue runs server-side

The hardest design choice: the source app's queue runs **in the browser**,
making concurrent fetch calls directly to the chatflow API. Two reasons we
can't keep that model:

1. The chatflow API token is per-user secret in the new world; it cannot be
   shipped to the client.
2. We want runs to survive page reloads and show up in history.

### Approach: server-action-launched run + Supabase Realtime progress

1. **`startRun` server action** validates inputs, creates a
   `chatflow_runs` row in `queued`, materializes one `chatflow_run_rows`
   row per input (positional, with stable `uid`), and returns the
   `runId`. All in a single transaction.
2. The same action then **dispatches** to a fire-and-forget queue
   processor (still server-side, same Vercel Function invocation) that
   runs the rolling-concurrency loop. This relies on Vercel Fluid Compute's
   `waitUntil`-style execution — we use `after()` from
   `next/server`.
3. The processor pulls rows in batches, calls the chatflow API with
   `concurrency` parallel fetches, updates each row as it completes (status,
   response_text/response_json, langfuse_link, error), and broadcasts
   progress over a Supabase Realtime channel
   `chatflow:run:<runId>`.
4. The client subscribes to that channel via `@supabase/ssr` and re-renders
   the results table as rows complete. Reloading rebuilds state from the
   DB.
5. **Cancellation:** a `cancelRun` server action sets `status='cancelled'`
   on the run row. The processor checks this flag between rows and exits
   cleanly. In-flight fetches are aborted via `AbortController` tracked in
   a per-run `Map<runId, AbortController>` held in module state — best-effort,
   fine if the process recycles since the next checkpoint will see
   `cancelled` and stop.

### Function timeout sanity check

Vercel Fluid Compute default timeout is **300s** (5 min). For long runs
(thousands of rows), one invocation isn't enough. Two options:

- **MVP:** cap a single run at `min(rows, concurrency × 30)` so it fits in
  one invocation. Reject larger sets in the UI with "Split your set into
  smaller batches." Document this clearly.
- **Phase 2:** introduce **Vercel Queues** (public beta) and have the
  processor enqueue per-row jobs. Each row is its own ~10s function call.
  Resilient to crashes, durable retries, no 5-minute cliff.

**Decision: MVP for v1.** The Queues integration is a follow-up that can
land without changing the schema.

## API surface — server actions

In `packages/ai-eval/src/` (re-exported from each app's `actions.ts`):

| Action | App | Tier | Purpose |
|---|---|---|---|
| `listTargets()` | both | free | SELECT user's chatflow targets. |
| `createTarget(input)` | both | free | INSERT a target; encrypt token via pgsodium. |
| `updateTarget(id, input)` | both | free | UPDATE; if `apiToken` provided, re-encrypt. |
| `deleteTarget(id)` | both | free | DELETE (cascades to question_sets and runs). |
| `listQuestionSets(targetId)` | eval | free | SELECT user's sets for a target. |
| `createQuestionSet(input)` | eval | **`pro`** | Quota-gated (free=3, pro=50). Bulk insert items. |
| `updateQuestionSet(id, input)` | eval | free | Edit name/tag; replace items. |
| `deleteQuestionSet(id)` | eval | free | DELETE. |
| `importQuestionSetCSV(targetId, csv)` | eval | **`pro`** | Parse `Question[, UID]` columns; validate; upsert into a new question_set. |
| `startEvalRun(input)` | eval | **`pro`** (`chatflow-eval:run`) | Validate, create run+rows, schedule processor. Returns runId. |
| `uploadCSVForChatflow(file)` | csv | free | Stream PNG-style upload to `chatflow-uploads/`. Validate header row. Returns `storagePath` + parsed headers/sample rows. |
| `startCSVRun(input)` | csv | **`pro`** (`csv-chatflow:run`) | Validate, copy snapshot of `prompt_template`, create run+rows, schedule processor. |
| `cancelRun(runId)` | both | free | Set run.status='cancelled'. |
| `listRuns(opts?)` | both | free | Paginated history for current user, filterable by mode/target. |
| `getRunWithRows(runId)` | both | free | Run + paginated rows for the results view. |
| `exportRunCSV(runId)` | both | free | Generate output CSV (eval format = Question/UID/ResponseText/ResponseJSON/LangfuseLink/Tag; csv format = headers + ResponseJSON column appended), upload to `chatflow-results/`, return signed URL. |

All actions are `"use server"`, all `zod`-validated at the boundary, all
scoped via `auth.uid()`, all logged via `@repo/logger`, with `withSpan`
around `startEvalRun` / `startCSVRun` / `exportRunCSV`.

### Quota / tier enforcement

```ts
// packages/ai-eval/src/tier-limits.ts
export const QUESTION_SET_QUOTA = { free: 3, pro: 50, enterprise: -1 } as const;
export const CONCURRENCY_CAP    = { free: 3, pro: 10, enterprise: 25 } as const;
export const RUNS_PER_DAY       = { free: 5, pro: 200, enterprise: 2000 } as const;
```

Enforced server-side in `startEvalRun` / `startCSVRun` via
`@repo/billing/has-feature-access` for the AI-execution gate, and via
direct count queries for quotas. Hits raise `QuotaExceededError` ➝ UI
renders `<UpgradePrompt feature="..." />`.

## Outbound HTTP

`packages/ai-eval/src/chatflow-client.ts` is the single place we hit the
chatflow API:

```ts
export async function callChatflow(opts: {
  apiHost: string;
  apiToken: string;                     // already decrypted, never logged
  chatflowId: string;
  question: string;
  chatId: string;
  trackingMetadata: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<{ text: string; raw: unknown }> {
  const url = `${opts.apiHost.replace(/\/$/, "")}/api/v1/prediction/${opts.chatflowId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiToken}`,
    },
    body: JSON.stringify({
      question: opts.question,
      streaming: false,
      chatId: opts.chatId,
      trackingMetadata: opts.trackingMetadata,
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChatflowHTTPError(res.status, text);
  }
  const data = await res.json();
  return { text: data.text ?? data.response ?? JSON.stringify(data), raw: data };
}
```

`ChatflowHTTPError` includes `status`, surface-safe `bodyExcerpt` (first
500 chars, with token redacted by regex). Logged at `warn`; user sees a
generic "Chatflow returned 503" on the row.

### Tracking metadata shape (preserved from source repo)

```ts
{
  is_eval: true,
  eval_key: tag ? `questions_eval_${tag}_${YYYY-MM-DD}` : `questions_eval_${YYYY-MM-DD}`,
  sourceFile: 'lr-apps:chatflow-eval' | 'lr-apps:csv-chatflow',
  batchProcessor: true,
  tag,
  tracking_tag: `${tag}_${uid}`,
  question_uid: uid,
  rowData?,                             // csv mode only
}
```

Langfuse link composition (when `target.base_trace_url` is set):

```ts
`${baseUrl}/traces?tag=${encodeURIComponent(`${tag}_${uid}`)}`
```

## UI

### Shared (`@repo/ai-eval/ui`)

- **`<TargetEditor>`** — modal/drawer form: name, apiHost, chatflowId, apiToken (write-only field; placeholder "•••••••" when editing existing), baseTraceUrl, defaultTag, promptTemplate (csv mode only). Validates URL, masks token field, never reads the existing token back.
- **`<TargetPicker>`** — dropdown of user's targets + "+ New target" button.
- **`<StatusBar>`** — total / completed / errored / active counts + auto-save indicator.
- **`<ProgressOverlay>`** — modal with progress bar + cancel button.
- **`<ResultsTable>`** — virtualized; per-row status pill, response (JSON pretty-printed if applicable), Langfuse link, error message, single-row re-run button.

### `chatflow-eval`

- **Header:** `<TargetPicker>` + "Manage targets" button.
- **Question set bar:** `<QuestionSetPicker>` (with "Import CSV…" and "+ New set" buttons) + tag override field.
- **Run controls:** Concurrency input (capped per tier), tag override, Run All / Run Selected / Stop / Export CSV.
- **Status bar + results table.**
- **Run history sidebar/route** at `/runs` listing prior runs with re-run-from-here.

### `csv-chatflow`

- **Header:** `<TargetPicker>` + "Manage targets" button.
- **Upload area:** drag-and-drop CSV. Shows headers + first 5 rows as a sanity check. Pro users see "Edit prompt template" link (opens `<PromptTemplateEditor>` with `{{rowJson}}` interpolation preview).
- **Run controls:** Concurrency input, Run All / Run Selected / Stop / Download Results.
- **Results table** showing: input (compacted JSON of original row), output (parsed array if response is JSON, else text), error.
- **Run history.**

### Token-cleanup pass

The source repo uses raw hex/CSS-variable colors. During port:
- Map `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--text-primary`, etc., to `@repo/theme` tokens.
- Replace status-color literals (`bg-red-500/10`, `text-accent-error`) with theme tokens. `pnpm audit:tokens` enforces.

## App registry entries

Add to `apps/web/lib/app-registry.ts`:

```ts
{
  slug: "chatflow-eval",
  name: "Chatflow Eval",
  subdomain: "chatflow-eval",
  routeGroup: "apps/chatflow-eval",
  auth: true,
  permission: "view",
  template: "full",
  tier: "free",
  features: { "chatflow-eval:run": "pro" },
  showcaseGroup: "ai-tools",
},
{
  slug: "csv-chatflow",
  name: "CSV Chatflow",
  subdomain: "csv-chatflow",
  routeGroup: "apps/csv-chatflow",
  auth: true,
  permission: "view",
  template: "full",
  tier: "free",
  features: { "csv-chatflow:run": "pro" },
  showcaseGroup: "ai-tools",
},
```

Update `tier-config.ts` so `chatflow-eval:run` and `csv-chatflow:run` are
known feature gates.

## Environment

No new chatflow-specific env vars (tokens are user-owned in DB). Required
in `turbo.json` `globalEnv` (already present, just verify):

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PGSODIUM_KEY_ID` — UUID of the pgsodium key created during DB setup,
  used by `target-store` to know which key to encrypt with. **New.** Add
  to `globalEnv` and `.env.example`. Provisioned once via
  `supabase/seed.sql` (or a one-shot script that runs
  `pgsodium.create_key()` and prints the id).

## Tests

### Unit (Vitest)

- `packages/ai-eval/src/__tests__/queue.test.ts` — rolling concurrency, abort, completion ordering, never-exceeds-cap.
- `packages/ai-eval/src/__tests__/chatflow-client.test.ts` — happy path, 4xx/5xx mapping, abort propagation, token never appears in error messages.
- `packages/ai-eval/src/__tests__/csv.test.ts` — multi-line quoted fields, escaped quotes, CRLF/LF normalization (port the source repo's `parseCSVFile` + tests).
- `packages/ai-eval/src/__tests__/langfuse.test.ts` — link generation with/without tag, encoding.
- `packages/ai-eval/src/__tests__/target-store.test.ts` — encrypt → decrypt round-trip; cross-user RLS rejection.
- `apps/web/app/apps/chatflow-eval/__tests__/actions.test.ts` — quota at boundary; tier gate; `startEvalRun` schedules processor; `cancelRun` flips status.
- Same for `csv-chatflow/__tests__/actions.test.ts`.

### Component

- `<TargetEditor>` — write-only token field (existing token never read into state).
- `<ResultsTable>` — JSON pretty-printing fallback, Langfuse link visibility tied to base_trace_url presence.

### e2e (Playwright)

`chatflow-eval`:
1. Create target → import 5-question CSV → start run → mocked chatflow returns 5 results → results visible → export CSV → file downloads with expected columns.
2. Free user attempts Start Run → sees upgrade prompt; no run row created.
3. Cancel mid-run → row count stops growing; status='cancelled'; no further updates.

`csv-chatflow`:
1. Upload 10-row CSV → preview shows headers + sample → start run → results visible → download CSV → ResponseJSON column populated.
2. Free user attempts Start Run → upgrade prompt.
3. Pro user edits prompt template, runs, results reflect new template (mocked chatflow echoes template substring).

### Integration (real Supabase, mocked chatflow)

- `pgsodium` key round-trip (insert encrypted, fetch decrypted via service role, never via anon).
- Storage RLS: cross-user CSV read attempt rejected.
- Realtime channel: subscribe → run completes → at least one progress event delivered.

## Step-by-step

1. **Scaffold both apps:**
   ```
   pnpm create-app chatflow-eval --name="Chatflow Eval" --subdomain=chatflow-eval --tier=free --template=full --permission=view --auth=true
   pnpm create-app csv-chatflow  --name="CSV Chatflow"  --subdomain=csv-chatflow  --tier=free --template=full --permission=view --auth=true
   ```
2. **Create the shared package:** `packages/ai-eval/` with the structure above. Add to `pnpm-workspace.yaml` (already a glob — verify) and to `apps/web/package.json` deps as `"@repo/ai-eval": "workspace:*"`.
3. **Migrations.** Add the four `20260505_chatflow_*.sql` pairs. `pnpm lint` enforces pairing. Run `pnpm db:reset` locally; verify RLS via the existing test-utilities pattern.
4. **pgsodium key provisioning.** Add a one-shot `scripts/seed-pgsodium-key.ts` that runs `select pgsodium.create_key()` and prints the id; document in `docs/ops/`. Add `PGSODIUM_KEY_ID` to `.env.example` and `turbo.json` `globalEnv`.
5. **Implement `@repo/ai-eval` core:** `chatflow-client.ts`, `queue.ts`, `csv.ts`, `langfuse.ts`, `target-store.ts`, `run-store.ts`, `tier-limits.ts`, `schema.ts`. Port the `parseCSVFile` logic verbatim (it handles multi-line quoted fields well; don't rewrite).
6. **Implement `@repo/ai-eval/ui` shared components.** Token-clean (theme tokens only).
7. **Implement `chatflow-eval` server actions** in `apps/web/app/apps/chatflow-eval/actions.ts` — thin wrappers over the package, with auth + tier checks.
8. **Implement `chatflow-eval` UI** — page composition only (most components from the package).
9. **Implement `csv-chatflow` server actions and UI** symmetrically.
10. **Run history routes** at `/apps/chatflow-eval/runs` and `/apps/csv-chatflow/runs`. Per-run detail at `/runs/[id]`.
11. **Realtime wiring.** Subscribe in the page to `chatflow:run:<runId>`; merge incoming row updates into local state. Server processor publishes per-row updates.
12. **Tests** — unit, component, e2e, integration.
13. **Docs.**
    - Update `apps/web/lib/` listing in `CLAUDE.md` if any new lib files (probably none — most code lives in the package).
    - Bump app count in `CLAUDE.md` overview.
    - Add `docs/ops/chatflow-eval-rotation.md` covering pgsodium key rotation.
14. **Migrate seed data (one-shot, optional).** If anyone is actively using the source repo, write a one-off Node script that reads `config/*.json` + `data/**/*.csv` and POSTs to the new server actions (using a session cookie) to recreate targets and question sets. Probably not worth it — easier to re-import in the new UI.
15. **Verify.** `pnpm lint`, `pnpm test`, `pnpm dev`, click through end-to-end on both subdomains.
16. **Decommission.** Confirm with team, then archive `~/Documents/repos/ai-scripts` (don't delete; keep as historical reference).

## Risks

- **Secret storage is the highest-stakes change.** `pgsodium` is Supabase-canonical but new to this repo. Must verify:
  - Key never leaves the DB.
  - Encrypted column never returned to the client (omit from any `select` that crosses the trust boundary; explicit projections, not `*`).
  - Decrypt happens only inside `target-store` server module, only at outbound-call time, and the decrypted token is **never logged**.
  - Errors that include the decrypted token (e.g. accidentally including it in a thrown `Error.message`) are filtered. The `ChatflowHTTPError` redaction regex needs a real test case.
- **Long-running queue + 300s function timeout.** v1 caps run size to fit in one invocation. If a user really needs 10k rows, they'll have to split. Phase 2 with Vercel Queues is the proper fix; design the schema today so it doesn't need to change.
- **Realtime delivery is not guaranteed.** If the user reloads or the realtime channel drops, the UI must reconcile by polling `getRunWithRows(runId)` on focus or every N seconds while a run is active. Build that fallback in v1, don't rely on Realtime alone.
- **Concurrency cancellation is best-effort.** Module-state `Map<runId, AbortController>` doesn't survive function recycles. The `status='cancelled'` flag is the source of truth; abort is an optimization. Document this.
- **CSV upload size.** 25MB cap matches Supabase Storage policy in the migration. Beyond that, users need a different tool. Surface this clearly.
- **Prompt template injection.** `csv-chatflow` interpolates `{{rowJson}}` into a user-edited prompt sent to a third-party AI. Trust boundary: the prompt template is per-user (the user is configuring their own attack surface), so injection by the user against themselves is not a security concern. But validate that `prompt_template` length is bounded (e.g., ≤ 16KB) and that interpolation doesn't blow up on missing/cyclic refs.
- **Token rotation UX.** Editing a target with a token field that's masked-but-editable is awkward. The flow:
  - When token field is left blank → keep existing encrypted token.
  - When token field has any value → re-encrypt with that value.
  - Surface this clearly with a hint label "Leave blank to keep existing token."
- **pgsodium learning curve.** No app uses it yet. Build a small `target-store.test.ts` that exercises encrypt/decrypt before any UI code, so we know the pattern is solid.
- **`after()` / Fluid Compute background work** is the dispatch mechanism. If Vercel changes how this works, the queue needs to switch to a different background-execution mechanism. Encapsulate the dispatch in one function so the swap is mechanical.
- **Question-set quota race.** Two concurrent `createQuestionSet` calls could both pass the count check at `n=2` and land at `n=4` (free cap = 3). Same caveat as meme-generator's quota race; acceptable for v1.
- **Storage cleanup on user delete.** Cascading row deletes don't delete blobs. A periodic cleanup cron is a known follow-up. v1 leaks blobs on user-account deletion; flag in `docs/ops/` so it's tracked.
- **Source-repo CSV format compatibility.** The new schema doesn't match the old `Question, UID, ResponseText, ResponseJSON` shape on disk. Users with existing CSVs use the import flow. Export produces the same column shape they had before so round-trip is sane.
- **The two apps both need `<TargetEditor>` + `<TargetPicker>` + run history.** Putting them in `@repo/ai-eval/ui` is correct; resist the urge to inline-copy when one app diverges. If real divergence shows up later, fork at that point.

## Open questions

None blocking. A few worth confirming before I implement:

1. **`pgsodium` vs an external KMS.** I've picked pgsodium for in-DB encryption with `auth.uid()`-scoped RLS. If you'd rather offload to AWS KMS / Vercel-managed env-encryption, the schema changes (drop `api_token_encrypted`, store an opaque `kms_key_arn` reference instead).
2. **Per-feature gates `chatflow-eval:run` / `csv-chatflow:run` at `pro`** — confirm tier. If you want a free-tier "trial run" allowance (e.g. 5 calls/month), that's a quota table addition.
3. **Subdomains `chatflow-eval` and `csv-chatflow`** — last call on naming. `eval` and `csv-eval`? `flowise-eval`? Let me know if the slugs should be different.
4. **Two PRs vs one.** Logical PR series:
   - PR 1: `@repo/ai-eval` package + migrations + pgsodium plumbing (nothing user-visible).
   - PR 2: `chatflow-eval` app.
   - PR 3: `csv-chatflow` app.
   That's my recommendation. If you'd rather ship as one big PR, fine — the work is sequenced internally.

## Files touched (rough inventory)

**New:**
- `apps/web/app/apps/chatflow-eval/` — page, layout, actions, components, lib, tests.
- `apps/web/app/apps/csv-chatflow/`  — same.
- `packages/ai-eval/` — entire package.
- `supabase/migrations/20260505_chatflow_0{1..4}_*.sql` (× up + down).
- `scripts/seed-pgsodium-key.ts`.
- `docs/ops/chatflow-eval-rotation.md`.

**Modified:**
- `apps/web/lib/app-registry.ts` — two new entries.
- `apps/web/lib/tier-config.ts` — two new feature gates.
- `apps/web/lib/env.ts` — `PGSODIUM_KEY_ID`.
- `apps/web/package.json` — `@repo/ai-eval` workspace dep.
- `turbo.json` `globalEnv` — `PGSODIUM_KEY_ID`.
- `.env.example` — `PGSODIUM_KEY_ID`.
- `CLAUDE.md` — bump app count; verify lib listing unchanged.
- `apps/web/components/app-showcase-grouped-grids.tsx` (or whatever surfaces showcase groups) — auto-picks up new `ai-tools` entries; verify.
- Possibly hardcoded route counts in marketing components (see meme-generator plan note about `MODULES.length`); audit.
