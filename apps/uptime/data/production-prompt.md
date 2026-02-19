# StatusPulse — Full Build Prompt

> **How to use:** Copy this entire file into a new Claude / Cursor / AI coding session.
> It contains everything needed to build out the remaining features from the existing scaffold.
> The scaffold (Prisma schema, auth, cron endpoint, Stripe webhook, layout) is already committed.

---

## Context

You are building **StatusPulse**, a multi-tenant uptime monitoring SaaS. The project scaffold already exists in this repo with:

- ✅ Next.js 15 App Router + React 19 + TypeScript
- ✅ Prisma schema (User, Workspace, Membership, Site, Check, Incident, IncidentUpdate, AlertRule, StatusPage)
- ✅ Auth.js v5 (GitHub + Google)
- ✅ Middleware protecting dashboard routes
- ✅ `/api/cron/check` endpoint (pings sites, records checks, auto-creates/resolves incidents)
- ✅ `/api/webhooks/stripe` endpoint
- ✅ Server Actions: `createSite`, `deleteSite`
- ✅ Zod validation schemas
- ✅ Root layout with dark Glass & Depth theme
- ✅ Landing page
- ✅ Dashboard layout with sidebar
- ✅ Dashboard page (placeholder)
- ✅ Seed script with 6 demo sites
- ✅ `vercel.json` cron config

**Your job:** Build out ALL remaining features to make this a fully functional, deployable SaaS.

---

## Tech Stack (locked in)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| UI | React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Auth.js v5 (NextAuth beta) |
| Database | Prisma + PostgreSQL (Neon) |
| Payments | Stripe |
| Cache | Upstash Redis |
| Email | Resend |
| Monitoring | Sentry |
| Deployment | Vercel |

---

## Step 1: Install shadcn/ui Components

```bash
npx shadcn@latest init
npx shadcn@latest add avatar badge button card dialog dropdown-menu form input label select separator sidebar sonner tabs textarea toggle toggle-group tooltip chart
```

---

## Step 2: Build the Dashboard Page

**File:** `src/app/(dashboard)/dashboard/page.tsx`

This is the main page users see after login. It must include:

1. **Status Banner** — Full-width bar at top
   - Green: "✅ All Systems Operational" when all sites are UP
   - Red: "⚠️ X Systems Experiencing Issues" when any site is DOWN/DEGRADED

2. **Filter Pills** — Row of toggle buttons: All | 🟢 Up | 🟡 Degraded | 🔴 Down
   - Clicking a pill filters the grid below
   - Use shadcn/ui ToggleGroup

3. **Add Site Button** — Opens a Dialog with form fields:
   - Name (required)
   - URL (required, validated as URL)
   - Description (optional)
   - Uses the existing `createSite` server action

4. **Sites Grid** — Responsive card grid (1→2→3 columns)
   - Each card shows:
     - Site name + URL
     - Status badge (colored pill: green/yellow/red)
     - Response time stat + Uptime percentage stat
     - **30-day uptime bar chart**: A row of 30 thin vertical bars (2px gap), color-coded by status (green=up, yellow=degraded, red=down). Height proportional to response time. Oldest on left, newest on right. Tooltip on hover showing date + status + response time.
     - Labels below bars: oldest date (left) — newest date (right)
   - Click card → navigate to `/dashboard/sites/[id]`
   - Delete button (appears on hover, top-right corner)

**Data fetching:** Server Component queries `db.site.findMany()` with recent checks for bar chart data. Pass to a client component for interactivity (filters, search).

### Site Card Component

```tsx
// src/components/features/sites/site-card.tsx
// Glass card with:
// - bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-2xl p-5
// - hover:border-amber-500/30 hover:-translate-y-0.5 hover:shadow-lg transition-all
// - Status badge: colored pill with icon + text
// - Stats row: response time + uptime %
// - UptimeBars component (30 colored divs in a flex row)
```

### Uptime Bars Component

```tsx
// src/components/features/sites/uptime-bars.tsx
"use client";
// Renders 30 thin bars (flex: 1, gap: 2px, height: 32px container)
// Each bar: rounded-sm, colored by status
// Height: proportional to response time (min 20%, max 100%)
// Tooltip via Radix Tooltip showing "Feb 12: UP (245ms)"
```

---

## Step 3: Site Detail Page

**File:** `src/app/(dashboard)/sites/[id]/page.tsx`

Reached by clicking a site card. Shows:

1. **Header** — Site name, URL, large status badge, Edit/Delete buttons
2. **Stats Row** — Response time, uptime %, last checked timestamp
3. **Response Time Chart** — 30-day bar/line chart using shadcn/ui Chart (Recharts)
   - X-axis: dates, Y-axis: response time (ms)
   - Color bars by status
4. **30-Day Uptime Bars** — Same component as dashboard but larger (height: 40px)
5. **Incident History** — List of incidents for this site
   - Timestamp, description, duration, resolved/ongoing status
   - Color-coded: green for resolved, red for ongoing
6. **Alert Rules** — List of configured alerts with enable/disable toggle

**Data fetching:** Server component loads site + last 30 days of checks + incidents.

---

## Step 4: Incidents Page

**File:** `src/app/(dashboard)/incidents/page.tsx`

Lists all incidents across all sites in the workspace:

- Filterable by status: All | Investigating | Identified | Monitoring | Resolved
- Each incident shows: site name, title, status badge, started time, duration
- Click to expand: show incident updates timeline
- "Add Update" button on active incidents (adds IncidentUpdate row)

---

## Step 5: Public Status Page

**File:** `src/app/status/[slug]/page.tsx`

This is a PUBLIC page (no auth required). Beautiful, minimal status page showing:

- Workspace name/logo at top
- Overall status banner
- List of all sites with current status + 30-day uptime bars
- Active incidents section
- "Powered by StatusPulse" footer with signup CTA

**Important:** Use `generateStaticParams` + ISR (`revalidate: 60`) for performance.

---

## Step 6: Status Page Management

**File:** `src/app/(dashboard)/status-pages/page.tsx`

CRUD for status pages:
- List existing status pages with slug, title, public/private toggle
- Create new: title, slug (auto-generated from title), description
- Edit: title, description, toggle public
- Preview link opening `/status/[slug]` in new tab
- Copy public URL button

---

## Step 7: Alert Configuration

**File:** `src/app/(dashboard)/alerts/page.tsx`

Manage alert rules:
- List all rules grouped by site
- Create: select site, type (DOWN/DEGRADED/RECOVERY/RESPONSE_TIME), channel (EMAIL/SLACK/WEBHOOK), destination, threshold (for response time)
- Toggle enable/disable
- Test button (sends a test alert)

### Alert Delivery Implementation

```typescript
// src/lib/alerts.ts
// When cron detects a status change:
// 1. Query AlertRules for the site
// 2. For each matching rule:
//    - EMAIL: send via Resend API
//    - SLACK: POST to webhook URL
//    - WEBHOOK: POST JSON payload to destination URL
```

---

## Step 8: Settings & Team Management

### Workspace Settings
**File:** `src/app/(dashboard)/settings/page.tsx`
- Workspace name (editable)
- Workspace slug (read-only)
- Current plan display
- Danger zone: delete workspace

### Team Management
**File:** `src/app/(dashboard)/settings/team/page.tsx`
- List members with role badges (Owner/Admin/Member/Viewer)
- Invite by email (creates Invite row, sends email via Resend)
- Change role dropdown
- Remove member

### Billing
**File:** `src/app/(dashboard)/settings/billing/page.tsx`
- Current plan card
- Usage stats (sites used / limit, check interval)
- Upgrade button → Stripe Checkout
- Manage subscription → Stripe Customer Portal
- Plan comparison table

---

## Step 9: Stripe Billing Integration

### Checkout Flow
```typescript
// src/actions/billing.ts
"use server";
// createCheckoutSession(): Creates Stripe checkout for Pro/Enterprise
// createPortalSession(): Opens Stripe customer portal for subscription management
```

### Plan Limits Enforcement
```typescript
// src/lib/plans.ts
export const PLAN_LIMITS = {
  FREE:       { sites: 5,  checkIntervalMs: 600000,  historyDays: 7,  statusPages: 1, members: 1  },
  PRO:        { sites: 25, checkIntervalMs: 300000,  historyDays: 30, statusPages: 3, members: 5  },
  ENTERPRISE: { sites: -1, checkIntervalMs: 60000,   historyDays: 90, statusPages: -1, members: -1 },
};
// -1 = unlimited
// Enforce in createSite action, cron check interval, etc.
```

---

## Step 10: Registration & Onboarding

**File:** `src/app/(auth)/register/page.tsx`

After OAuth signup:
1. Create User (handled by Auth.js adapter)
2. Show "Create Workspace" form (name → auto-generate slug)
3. Create Workspace + Membership (role: OWNER)
4. Redirect to `/dashboard`

**File:** `src/app/(auth)/login/page.tsx`
- GitHub + Google sign-in buttons
- Glass card centered on page

---

## Step 11: Polish & Production Readiness

### Error Handling
- `src/app/error.tsx` — Global error boundary with retry button
- `src/app/not-found.tsx` — Custom 404
- `src/app/(dashboard)/dashboard/loading.tsx` — Skeleton cards

### Rate Limiting
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});
// Apply in API routes and server actions
```

### SEO
- Metadata on every page
- `robots.txt` in public/
- Open Graph image
- Sitemap generation

### Mobile Responsive
- Sidebar collapses to hamburger on mobile
- Cards stack to single column
- Filter pills wrap
- Modals are full-width on small screens

---

## Design System Reference

### Colors (Dark Mode)
| Token | Value | Tailwind |
|-------|-------|---------|
| Background | `#0a0e1a` | `from-[#0a0e1a]` |
| Card | `rgba(255,255,255,0.08)` | `bg-white/[0.08]` |
| Border | `rgba(255,255,255,0.15)` | `border-white/15` |
| Text | `#f8fafc` | `text-slate-50` |
| Muted | `#94a3b8` | `text-slate-400` |
| Accent | `#f59e0b` | `text-amber-500` |
| Up/Success | `#10b981` | `text-emerald-500` |
| Down/Error | `#ef4444` | `text-red-500` |
| Degraded/Warn | `#f59e0b` | `text-amber-500` |

### Card Pattern
```tsx
<div className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl transition-all hover:border-amber-500/30 hover:-translate-y-0.5 hover:shadow-lg">
```

### Status Badge Pattern
```tsx
<span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-500">
  🟢 Operational
</span>
```

### Button Patterns
```tsx
// Primary
<button className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-all">

// Ghost/Glass
<button className="rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm backdrop-blur-xl hover:bg-white/[0.12] transition-all">
```

---

## Pricing Table

| Feature | Free | Pro ($19/mo) | Enterprise ($49/mo) |
|---------|------|-------------|---------------------|
| Sites | 5 | 25 | Unlimited |
| Check interval | 10 min | 5 min | 1 min |
| History retention | 7 days | 30 days | 90 days |
| Alert channels | Email only | Email + Slack | All + webhook |
| Status pages | 1 | 3 | Unlimited |
| Team members | 1 | 5 | Unlimited |
| Support | Community | Email | Priority |

---

## File Checklist

When complete, the repo should have ALL of these files with working code:

### Pages
- [ ] `src/app/page.tsx` — Landing ✅ (exists)
- [ ] `src/app/(auth)/login/page.tsx` — OAuth login
- [ ] `src/app/(auth)/register/page.tsx` — Signup + create workspace
- [ ] `src/app/(dashboard)/dashboard/page.tsx` — Main dashboard ✅ (needs buildout)
- [ ] `src/app/(dashboard)/sites/[id]/page.tsx` — Site detail
- [ ] `src/app/(dashboard)/incidents/page.tsx` — All incidents
- [ ] `src/app/(dashboard)/status-pages/page.tsx` — Manage status pages
- [ ] `src/app/(dashboard)/alerts/page.tsx` — Alert rules
- [ ] `src/app/(dashboard)/settings/page.tsx` — Workspace settings
- [ ] `src/app/(dashboard)/settings/team/page.tsx` — Team management
- [ ] `src/app/(dashboard)/settings/billing/page.tsx` — Billing/Stripe
- [ ] `src/app/status/[slug]/page.tsx` — Public status page
- [ ] `src/app/error.tsx` — Error boundary
- [ ] `src/app/not-found.tsx` — 404
- [ ] `src/app/(dashboard)/dashboard/loading.tsx` — Loading skeleton

### Components
- [ ] `src/components/layout/header.tsx`
- [ ] `src/components/layout/app-sidebar.tsx` (shadcn/ui Sidebar)
- [ ] `src/components/layout/mobile-nav.tsx`
- [ ] `src/components/shared/page-header.tsx`
- [ ] `src/components/shared/empty-state.tsx`
- [ ] `src/components/shared/loading-skeleton.tsx`
- [ ] `src/components/features/sites/site-card.tsx`
- [ ] `src/components/features/sites/uptime-bars.tsx`
- [ ] `src/components/features/sites/response-chart.tsx`
- [ ] `src/components/features/sites/add-site-dialog.tsx`
- [ ] `src/components/features/sites/site-filters.tsx`
- [ ] `src/components/features/incidents/incident-list.tsx`
- [ ] `src/components/features/incidents/incident-timeline.tsx`
- [ ] `src/components/features/status-page/status-page-preview.tsx`
- [ ] `src/components/features/alerts/alert-rule-form.tsx`

### Lib & Actions
- [ ] `src/lib/auth.ts` ✅
- [ ] `src/lib/db.ts` ✅
- [ ] `src/lib/stripe.ts` ✅
- [ ] `src/lib/utils.ts` ✅
- [ ] `src/lib/alerts.ts` — Alert delivery (email, Slack, webhook)
- [ ] `src/lib/plans.ts` — Plan limits config
- [ ] `src/lib/rate-limit.ts` — Upstash rate limiter
- [ ] `src/lib/validations/site.ts` ✅
- [ ] `src/actions/sites.ts` ✅
- [ ] `src/actions/billing.ts` — Stripe checkout/portal
- [ ] `src/actions/alerts.ts` — Alert CRUD
- [ ] `src/actions/team.ts` — Invite/remove members
- [ ] `src/actions/status-pages.ts` — Status page CRUD

### API Routes
- [ ] `src/app/api/auth/[...nextauth]/route.ts` ✅
- [ ] `src/app/api/cron/check/route.ts` ✅
- [ ] `src/app/api/webhooks/stripe/route.ts` ✅

---

## Important Conventions

1. **Server Components by default** — only `"use client"` for interactive parts
2. **Server Actions for all mutations** — no API routes for CRUD
3. **Zod validation** on all form inputs
4. **Optimistic UI** with `useOptimistic` where appropriate
5. **Loading states** — skeleton components, not spinners
6. **Error boundaries** per section
7. **Mobile-first** responsive design
8. **Accessible** — proper ARIA labels, keyboard navigation, focus management
9. **Type-safe** — no `any`, full Prisma types
10. **Consistent naming** — kebab-case files, PascalCase components, camelCase functions
