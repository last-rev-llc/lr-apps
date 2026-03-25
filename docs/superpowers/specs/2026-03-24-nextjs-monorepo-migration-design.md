# Next.js Monorepo Migration Design

**Date:** 2026-03-24
**Status:** Approved
**Scope:** Rewrite ~55 vanilla HTML/CSS/JS apps as a single Next.js application in a Turborepo monorepo, deployed as one Vercel project with subdomain routing.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Uniform stack, SSR/SSG flexibility, Vercel-native |
| Language | TypeScript | Type safety across shared packages, catches cross-app breakage |
| Styling | Tailwind CSS + shadcn/ui | Port glassmorphism tokens, replace 20+ Web Components with maintained equivalents |
| Package manager | pnpm | Fastest, strictest resolution, Turborepo-optimized |
| Monorepo tool | Turborepo | Workspace orchestration, lint/typecheck across packages |
| Supabase topology | Single project (existing) | Apps already share one DB, add permissions layer on top |
| Deployment | Single Vercel project | Matches current setup, one build, wildcard subdomain routing via proxy.ts |
| Auth | Supabase Auth + app_permissions table | Already using Supabase, cross-subdomain SSO via .lastrev.com cookie |
| Auth hub | auth.lastrev.com | Dedicated auth app (login, signup, my-apps, admin) |
| Domain | *.lastrev.com | New domain scheme, migrating from *.apps.lastrev.com and *.adam-harris.alphaclaw.app |
| App templates | Tiered (full + minimal) | Dashboards need sidebar/nav/auth; lightweight apps don't |

---

## Monorepo Structure

```
lr-apps/
├── turbo.json                          # Task pipeline (build, dev, lint, typecheck)
├── package.json                        # pnpm workspace root
├── pnpm-workspace.yaml                 # Workspace definitions
├── .env.local                          # Supabase keys (gitignored)
│
├── apps/
│   └── web/                            # Single Next.js 16 app
│       ├── app/
│       │   ├── (auth)/                 # auth.lastrev.com (login, signup, my-apps, admin)
│       │   ├── apps/
│       │   │   ├── command-center/     # command-center.lastrev.com (21 cc-* routes)
│       │   │   ├── generations/        # generations.lastrev.com (6 gen-* routes)
│       │   │   ├── sentiment/          # sentiment.lastrev.com
│       │   │   ├── slang-translator/   # slang.lastrev.com
│       │   │   └── ... (~29 more)
│       │   ├── layout.tsx              # Root layout (theme, providers)
│       │   └── globals.css
│       ├── proxy.ts                    # Next.js 16 proxy file (formerly middleware.ts)
│       │                               # Routes subdomains → route groups
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                             # React component library (shadcn/ui based)
│   ├── auth/                           # Supabase Auth + app-level permissions
│   ├── db/                             # Supabase client, generated types, helpers
│   ├── theme/                          # Tailwind preset (glassmorphism tokens)
│   └── config/                         # Shared tsconfig, eslint, prettier
│
└── tools/
    └── create-app/                     # CLI: scaffolds new route group + proxy entry
```

---

## Shared Packages

### packages/ui

React component library built on shadcn/ui. Migrates ~62 Web Components to React.

**Direct shadcn replacements (~20):**
- `<cc-modal>` → `<Dialog />`
- `<cc-toast>` → `<Toaster />` (Sonner)
- `<cc-tabs>` → `<Tabs />`
- `<cc-accordion>` → `<Accordion />`
- `<cc-pill-filter>`, `<cc-pill-dropdown>` → `<Badge />`, `<Select />`
- `<cc-card>` → `<Card />`
- `<cc-icons>` → Lucide icons
- `<cc-field>`, `<cc-edit-mode>` → shadcn Form + react-hook-form

**Custom components using shadcn primitives (~15):**
- `<Topbar />` — app header with user menu
- `<Sidebar />`, `<NavMenu />` — app navigation
- `<BlogPost />`, `<DocsPage />` — MDX-based content
- `<Mermaid />` — diagram renderer

**Animation components (Framer Motion, ~10):**
- `<FadeIn />`, `<SlideIn />`, `<Stagger />`
- `<Confetti />` (canvas-confetti), `<Particles />` (tsparticles)
- `<Typewriter />`, `<Lightbox />`

### packages/db

- `createClient()` — server-side and client-side Supabase clients via `@supabase/ssr`
- Generated types from `supabase gen types typescript`
- Typed query helpers replacing current `supabase-client.js` REST wrapper
- Existing tables (`app_profiles`, `app_subscriptions`) will be evaluated during Phase 2 and either migrated into the new `app_permissions` schema or deprecated

### packages/auth

- `requireAccess(appSlug)` — server-side permission check, used in layouts
  - Permissions are hierarchical: `admin` implies `edit` implies `view`
  - Checking for `view` succeeds if the user has `view`, `edit`, or `admin`
- `<AuthProvider />` — client-side session context
- Cross-subdomain SSO: cookie domain set to `.lastrev.com`
- Replaces `<cc-auth>` password gate with real user authentication

### packages/theme

- Tailwind preset with glassmorphism tokens:
  - Amber accent (#f59e0b)
  - Navy gradient background (#0a0e1a → #1a1b3a)
  - Backdrop blur / glass effect utilities
- shadcn theme CSS variables mapped to existing color palette
- Geist Sans (interface) + Geist Mono (code/data) fonts
- Dark mode default

### packages/config

- `tsconfig.base.json` — strict TypeScript base config
- Shared ESLint + Prettier configs
- Shared `next.config.ts` factory if needed

---

## App Consolidation

### Consolidated into command-center.lastrev.com (21 → 1)

All `cc-*` apps become routes under a shared dashboard layout with sidebar navigation:

- leads, agents, ai-scripts, app-access, architecture, client-health
- concerts, contentful, crons, gallery, ideas, iron
- meeting-summaries, meme-generator, pr-review, recipes, rizz-guide
- shopping-list, team-usf, users, alphaclaw

### Consolidated into generations.lastrev.com (6 → 1)

Gen hub with routes: alpha, boomers, silent, gen-x, gen-y, gen-z

### Standalone apps (~29)

Each gets its own route group and subdomain:

| App | Subdomain | Template |
|-----|-----------|----------|
| accounts | accounts.lastrev.com | full |
| sentiment | sentiment.lastrev.com | full |
| slang-translator | slang.lastrev.com | minimal |
| ai-calculator | calculator.lastrev.com | minimal |
| dad-joke-of-the-day | dad-jokes.lastrev.com | minimal |
| meeting-summaries | meetings.lastrev.com | full |
| superstars | superstars.lastrev.com | minimal |
| travel-collection | travel.lastrev.com | minimal |
| cringe-rizzler | cringe.lastrev.com | minimal |
| proper-wine-pour | wine.lastrev.com | minimal |
| roblox-dances | roblox.lastrev.com | minimal |
| alpha-wins | alpha-wins.lastrev.com | minimal |
| uptime | uptime.lastrev.com | full |
| standup | standup.lastrev.com | full |
| sprint-planning | sprint.lastrev.com | full |
| sales | sales.lastrev.com | full |
| daily-updates | updates.lastrev.com | full |
| summaries | summaries.lastrev.com | full |
| lighthouse | lighthouse.lastrev.com | full |
| soccer-training | soccer.lastrev.com | minimal |
| hspt-practice | hspt-practice.lastrev.com | minimal |
| hspt-tutor | hspt-tutor.lastrev.com | minimal |
| area-52 | area-52.lastrev.com | minimal |
| brommie-quake | brommie.lastrev.com | minimal |
| age-of-apes | apes.lastrev.com | minimal |

Plus: `auth.lastrev.com` as the central auth hub (not the `accounts` app — that remains a standalone client management app).

**Total: ~32 route groups in one Next.js app** (2 consolidated + ~29 standalone + 1 auth hub)

---

## Auth & Permissions

### Flow

```
User visits sentiment.lastrev.com
  → proxy.ts (Next.js 16 proxy file) checks Supabase session cookie (scoped to .lastrev.com)
  → No session? Redirect to auth.lastrev.com/login
  → Has session? Check app_permissions for user + "sentiment"
  → No permission? 403 / redirect to auth.lastrev.com/unauthorized
  → Has permission (view, edit, or admin)? Render the app
```

### auth.lastrev.com — Central auth hub

- Login / signup / forgot password
- "My Apps" dashboard showing permitted apps
- Admin panel for managing users and permissions

### Database schema

```sql
create table public.app_permissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app_slug text not null,
  permission text not null
    check (permission in ('view', 'edit', 'admin')),
  created_at timestamptz default now(),
  unique(user_id, app_slug)
);

alter table public.app_permissions enable row level security;

create policy "Users read own permissions"
  on public.app_permissions for select
  using (auth.uid() = user_id);

create policy "Admins manage all permissions"
  on public.app_permissions for all
  using (
    exists (
      select 1 from public.app_permissions
      where user_id = auth.uid()
      and app_slug = 'auth'
      and permission = 'admin'
    )
  );
```

### Admin bootstrap

The first admin user must be seeded directly via Supabase SQL editor or a migration script, since the RLS policy requires an existing admin to create new admins:

```sql
-- Run once after creating the table and signing up the first admin user
insert into public.app_permissions (user_id, app_slug, permission)
values ('<first-admin-user-id>', 'auth', 'admin');
```

### Cross-subdomain SSO

- `@supabase/ssr` configured with cookie domain `.lastrev.com`
- Single login at auth.lastrev.com, session valid across all subdomains

### Permission levels (hierarchical)

- `view` — read-only access
- `edit` — can modify data (implies view)
- `admin` — can manage app settings and invite users (implies edit and view)

`requireAccess(appSlug, 'edit')` succeeds for users with `edit` or `admin` permission.

### Public apps

Apps can set `auth: false` in their config to skip the permission check (e.g., dad-jokes, superstars).

---

## Deployment

### Single Vercel project

- One Vercel project (`lr-apps`) linked to the GitHub repo
- Root directory: `apps/web/`
- Wildcard domain: `*.lastrev.com`
- `proxy.ts` (Next.js 16 proxy file, formerly `middleware.ts`) reads hostname, rewrites to correct route group

### Domain migration

Current domains (`*.apps.lastrev.com`, `*.adam-harris.alphaclaw.app`) will be replaced by `*.lastrev.com`. During migration, old rewrite rules remain active for un-migrated apps. DNS cutover happens in Phase 7 cleanup.

### Environment variables

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` set on the Vercel project
- App-specific env vars as needed

### proxy.ts routing

Maps subdomains to route groups:
- `command-center.lastrev.com` → `/apps/command-center/*`
- `sentiment.lastrev.com` → `/apps/sentiment/*`
- `auth.lastrev.com` → `/(auth)/*`
- Unknown subdomains → redirect to `auth.lastrev.com` (or 404)

### App registry

A central `lib/app-registry.ts` file maps all app slugs, subdomains, names, and auth requirements. Used by:
- `proxy.ts` for subdomain routing
- `auth.lastrev.com/my-apps` to list available apps
- `create-app` CLI to register new apps

### Old infrastructure removal

- Root `vercel.json` (120+ rewrite rules) deleted after migration complete
- `shared/` directory deleted after all apps migrated (must remain active during migration for un-migrated vanilla apps)
- Old `apps/` vanilla HTML directories deleted per phase

---

## App Templates

### create-app CLI

```bash
pnpm create-app my-new-app                    # defaults to minimal
pnpm create-app my-new-app --template full     # dashboard template
```

Scaffolds a new route group inside `apps/web/app/apps/`, adds the subdomain mapping to `proxy.ts`, and registers the app in `lib/app-registry.ts`.

### Minimal template

```
app/apps/<name>/
├── layout.tsx          # Theme + optional auth provider
├── page.tsx            # Starter page
└── loading.tsx         # Skeleton loading state
```

Includes: `@repo/theme`, `@repo/ui`, `@repo/db`

### Full template

```
app/apps/<name>/
├── layout.tsx          # Auth-gated + Sidebar + Topbar
├── page.tsx            # Dashboard starter with card grid
├── loading.tsx         # Skeleton loading state
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
└── components/
    ├── app-sidebar.tsx # Pre-wired sidebar nav
    └── app-topbar.tsx  # Pre-wired topbar with user menu
```

Adds: `@repo/auth`

### App config

Each app declares its identity in a config consumed by `@repo/auth` and the app registry:

```ts
export const appConfig = {
  slug: 'my-new-app',
  name: 'My New App',
  auth: true,
  permission: 'view',  // minimum permission level required
}
```

---

## Migration Strategy

### Phase 1 — Scaffold

- Turborepo + pnpm workspace root
- `apps/web/` — empty Next.js 16 app with `proxy.ts`
- `packages/config` — shared tsconfig, eslint, prettier
- `packages/theme` — Tailwind preset with glassmorphism tokens
- `lib/app-registry.ts` — central app registry
- Verify: deploys to Vercel with wildcard domain

### Phase 2 — Shared packages

- `packages/db` — Supabase client, generate types, evaluate existing `app_profiles`/`app_subscriptions` tables
- `packages/auth` — requireAccess(), cross-subdomain cookies, auth provider
- `packages/ui` — ~20 direct shadcn drops (Dialog, Tabs, Card, Accordion, Toast, etc.)
- `(auth)` route group — login/signup/my-apps at auth.lastrev.com
- Seed first admin user
- Create `app_permissions` table and RLS policies

### Phase 3 — Pilot: sentiment

- First real app migration, validates full pattern
- Auth, permissions, Supabase queries, custom components, subdomain routing
- Fix shared package issues before scaling

### Phase 4 — Simple standalone apps (~15)

- Minimal-template apps: dad-joke-of-the-day, slang-translator, ai-calculator, proper-wine-pour, etc.
- Small, mostly static — fastest to convert

### Phase 5 — Showcase & content apps (~10)

- superstars, travel-collection, cringe-rizzler, roblox-dances
- Migrate animation components (Framer Motion)
- generations consolidated app

### Phase 6 — Complex apps (~10)

- command-center — 21 routes, dashboard grid, 20+ modules
- Migrate modules one route at a time
- Port gridstack.js layout
- uptime, sprint-planning, standup, sales

### Phase 7 — Cleanup

- Delete old vanilla HTML directories
- Delete root vercel.json (120+ rewrite rules)
- Delete shared/ directory
- DNS cutover from *.apps.lastrev.com / *.alphaclaw.app to *.lastrev.com
- Update create-app templates based on lessons learned

Each phase is independently deployable. Old vanilla apps continue working via existing rewrite rules until replaced. The `shared/` subdomain must remain active until all vanilla apps are migrated.

---

## Local Development

- `pnpm dev` runs the Next.js dev server via Turborepo
- Subdomain routing locally requires `/etc/hosts` entries or a local wildcard DNS tool (e.g., `dnsmasq`) mapping `*.lastrev.localhost` → `127.0.0.1`
- `proxy.ts` should also accept `*.lastrev.localhost` for local development
- Alternative: test with `localhost:3000` using a `?app=sentiment` query param override in dev mode

---

## Testing Strategy

- **Unit tests:** Vitest for shared packages (`packages/ui`, `packages/auth`, `packages/db`)
- **Component tests:** Vitest + React Testing Library for UI components
- **E2E tests:** Playwright for critical flows (auth, subdomain routing, permission gating)
- **Smoke tests:** After each phase, verify every migrated app loads and authenticates correctly
- **Visual regression:** Optional — Playwright screenshots compared against baseline for glassmorphism UI fidelity

---

## Removed from scope

- `trinity-qa` — separate repo (paid client project)
- `last-rev-marketing` — separate repo
- `client-scorecard` — removed
- `ux-review` — removed
- `lastrev-redesign` — removed
