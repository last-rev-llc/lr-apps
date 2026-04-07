# Phase 3: Pilot — Sentiment App Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the sentiment app to Next.js as the first real app, validating the full monorepo pattern: auth, permissions, Supabase queries, shared UI, subdomain routing, and deployment.

**Architecture:** The sentiment app becomes a route group at `apps/web/app/apps/sentiment/`. It uses Server Components for data fetching, a Client Component for the interactive chart and member filter, and `requireAccess('sentiment')` for auth gating. Chart.js is replaced by Recharts (React-native charting).

**Tech Stack:** Next.js 16, React 19, Recharts, @repo/db, @repo/auth, @repo/ui, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-03-24-nextjs-monorepo-migration-design.md`
**Depends on:** Phase 2 (complete)

---

## What We're Migrating

**From:** `apps/sentiment/` (vanilla HTML + Web Components)
**To:** `apps/web/app/apps/sentiment/` (Next.js route group)

### Pages

| Old Page | New Route | Treatment |
|----------|-----------|-----------|
| `app.html` (dashboard) | `/` (default) | Full migration — Server + Client Components |
| `index.html` (landing) | `/about` | Static page, public |
| `docs.html` | `/docs` | Static page |
| `logs.html` | `/changelog` | Static page |
| `admin.html` | Deferred | Uses shared cc-ideas/cc-prompts — Phase 6 |

### Core Components to Migrate

| Web Component | React Component | Notes |
|---------------|----------------|-------|
| `<team-sentiment>` | `<SentimentDashboard />` | Main dashboard, split into server/client parts |
| Chart.js line chart | `<SentimentChart />` | Recharts `<LineChart>` |
| Member filter dropdown | `<MemberFilter />` | shadcn Select |
| Stat cards | `<StatsRow />` | shadcn Card |
| Member cards grid | `<MemberGrid />` | Server Component |
| Daily timeline | `<Timeline />` | Server Component |
| Mood badges | `<MoodBadge />` | Small utility component |

### Supabase Table

`sentiment_entries` — already exists with 65 entries. Schema:
- `id` (text PK), `date`, `member_name`, `sentiment_score` (0-10), `mood`, `work_summary`, `blockers` (jsonb[]), `highlights` (jsonb[]), `created_at`

---

## File Map

**apps/web/app/apps/sentiment/ (create):**
- `layout.tsx` — auth-gated layout with sidebar nav
- `page.tsx` — dashboard (Server Component, fetches data)
- `loading.tsx` — skeleton loading state
- `error.tsx` — error boundary
- `about/page.tsx` — public landing/marketing page
- `docs/page.tsx` — documentation
- `changelog/page.tsx` — version history
- `components/sentiment-dashboard.tsx` — interactive client wrapper
- `components/sentiment-chart.tsx` — Recharts line chart
- `components/member-filter.tsx` — member dropdown
- `components/stats-row.tsx` — stat cards
- `components/member-grid.tsx` — member cards
- `components/timeline.tsx` — daily timeline
- `components/mood-badge.tsx` — mood indicator
- `lib/types.ts` — sentiment data types
- `lib/queries.ts` — Supabase query helpers

**apps/web/ (modify):**
- `package.json` — add recharts dependency

---

## Task 1: Add types and query helpers

**Files:**
- Create: `apps/web/app/apps/sentiment/lib/types.ts`
- Create: `apps/web/app/apps/sentiment/lib/queries.ts`

- [ ] **Step 1: Create types.ts**

```ts
export interface SentimentEntry {
  id: string;
  date: string;
  member_name: string;
  sentiment_score: number;
  mood: "positive" | "neutral" | "frustrated" | "blocked" | "excited";
  work_summary: string;
  blockers: string[];
  highlights: string[];
  created_at: string;
}

export interface MemberSummary {
  name: string;
  latestMood: string;
  latestScore: number;
  avgScore: number;
  entryCount: number;
}

export interface DayGroup {
  date: string;
  entries: SentimentEntry[];
}
```

- [ ] **Step 2: Create queries.ts**

```ts
import { createClient } from "@repo/db/server";
import type { SentimentEntry, MemberSummary, DayGroup } from "./types";

export async function getSentimentEntries(): Promise<SentimentEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sentiment_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SentimentEntry[];
}

export function getMemberSummaries(entries: SentimentEntry[]): MemberSummary[] {
  const memberMap = new Map<string, SentimentEntry[]>();
  entries.forEach((e) => {
    const list = memberMap.get(e.member_name) ?? [];
    list.push(e);
    memberMap.set(e.member_name, list);
  });

  return Array.from(memberMap.entries())
    .map(([name, memberEntries]) => {
      const sorted = [...memberEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const avgScore =
        memberEntries.reduce((sum, e) => sum + e.sentiment_score, 0) /
        memberEntries.length;
      return {
        name,
        latestMood: sorted[0].mood,
        latestScore: sorted[0].sentiment_score,
        avgScore: Math.round(avgScore * 10) / 10,
        entryCount: memberEntries.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function groupByDate(entries: SentimentEntry[]): DayGroup[] {
  const groups = new Map<string, SentimentEntry[]>();
  entries.forEach((e) => {
    const list = groups.get(e.date) ?? [];
    list.push(e);
    groups.set(e.date, list);
  });

  return Array.from(groups.entries())
    .map(([date, dayEntries]) => ({ date, entries: dayEntries }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/apps/sentiment/lib/
git commit -m "feat(sentiment): add types and Supabase query helpers"
```

---

## Task 2: Add MoodBadge and StatsRow components

**Files:**
- Create: `apps/web/app/apps/sentiment/components/mood-badge.tsx`
- Create: `apps/web/app/apps/sentiment/components/stats-row.tsx`

- [ ] **Step 1: Create mood-badge.tsx**

```tsx
import { cn } from "@repo/ui";

const moodColors: Record<string, string> = {
  positive: "bg-green-500/20 text-green-400",
  excited: "bg-purple-500/20 text-purple-400",
  neutral: "bg-muted text-muted-foreground",
  frustrated: "bg-orange-500/20 text-orange-400",
  blocked: "bg-red-500/20 text-red-400",
};

export function MoodBadge({ mood }: { mood: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        moodColors[mood] ?? moodColors.neutral,
      )}
    >
      {mood}
    </span>
  );
}
```

- [ ] **Step 2: Create stats-row.tsx**

```tsx
import { Card, CardContent } from "@repo/ui";
import type { SentimentEntry } from "../lib/types";

interface StatsRowProps {
  entries: SentimentEntry[];
}

export function StatsRow({ entries }: StatsRowProps) {
  const avgSentiment =
    entries.length > 0
      ? (
          entries.reduce((sum, e) => sum + e.sentiment_score, 0) /
          entries.length
        ).toFixed(1)
      : "—";

  const uniqueMembers = new Set(entries.map((e) => e.member_name)).size;
  const blockedDays = entries.filter((e) => e.mood === "blocked").length;
  const totalHighlights = entries.reduce(
    (sum, e) => sum + (e.highlights?.length ?? 0),
    0,
  );

  const stats = [
    { label: "Avg Sentiment", value: avgSentiment },
    { label: "Total Entries", value: entries.length },
    { label: "Team Members", value: uniqueMembers },
    { label: "Blocked Days", value: blockedDays },
    { label: "Highlights", value: totalHighlights },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/apps/sentiment/components/
git commit -m "feat(sentiment): add MoodBadge and StatsRow components"
```

---

## Task 3: Add MemberGrid and Timeline components

**Files:**
- Create: `apps/web/app/apps/sentiment/components/member-grid.tsx`
- Create: `apps/web/app/apps/sentiment/components/timeline.tsx`

- [ ] **Step 1: Create member-grid.tsx**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { MoodBadge } from "./mood-badge";
import type { MemberSummary } from "../lib/types";

interface MemberGridProps {
  members: MemberSummary[];
}

export function MemberGrid({ members }: MemberGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((m) => (
        <Card key={m.name} className="glass-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{m.name}</CardTitle>
              <MoodBadge mood={m.latestMood} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${(m.latestScore / 10) * 100}%` }}
              />
              <span className="text-xs text-muted-foreground">
                {m.latestScore}/10
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avg: {m.avgScore}</span>
              <span>{m.entryCount} entries</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create timeline.tsx**

```tsx
import { Card, CardContent } from "@repo/ui";
import { MoodBadge } from "./mood-badge";
import type { DayGroup } from "../lib/types";

interface TimelineProps {
  groups: DayGroup[];
}

export function Timeline({ groups }: TimelineProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {new Date(group.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.entries.map((entry) => (
              <Card key={entry.id} className="glass-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {entry.member_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <MoodBadge mood={entry.mood} />
                      <span className="text-xs text-accent font-bold">
                        {entry.sentiment_score}/10
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {entry.work_summary}
                  </p>
                  {entry.highlights?.length > 0 && (
                    <p className="text-xs text-green-400">
                      Highlights: {entry.highlights.join(", ")}
                    </p>
                  )}
                  {entry.blockers?.length > 0 && (
                    <p className="text-xs text-red-400">
                      Blockers: {entry.blockers.join(", ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/apps/sentiment/components/
git commit -m "feat(sentiment): add MemberGrid and Timeline components"
```

---

## Task 4: Add SentimentChart (Recharts) and MemberFilter

**Files:**
- Modify: `apps/web/package.json` (add recharts)
- Create: `apps/web/app/apps/sentiment/components/sentiment-chart.tsx`
- Create: `apps/web/app/apps/sentiment/components/member-filter.tsx`
- Create: `apps/web/app/apps/sentiment/components/sentiment-dashboard.tsx`

- [ ] **Step 1: Add recharts to apps/web**

Add `"recharts": "^2"` to `apps/web/package.json` dependencies. Run `pnpm install`.

- [ ] **Step 2: Create sentiment-chart.tsx**

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { SentimentEntry } from "../lib/types";

const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

interface SentimentChartProps {
  entries: SentimentEntry[];
  selectedMember: string;
}

export function SentimentChart({ entries, selectedMember }: SentimentChartProps) {
  if (entries.length === 0) return null;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (selectedMember !== "all") {
    const memberEntries = sortedEntries.filter(
      (e) => e.member_name === selectedMember,
    );
    const chartData = memberEntries.map((e) => ({
      date: e.date,
      score: e.sentiment_score,
    }));

    return (
      <div className="glass-sm p-4">
        <h3 className="text-sm font-medium mb-4">Sentiment Trend — {selectedMember}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 22, 41, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // All members — multi-line chart
  const members = [...new Set(sortedEntries.map((e) => e.member_name))];
  const dates = [...new Set(sortedEntries.map((e) => e.date))].sort();
  const chartData = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    members.forEach((member) => {
      const entry = sortedEntries.find(
        (e) => e.date === date && e.member_name === member,
      );
      if (entry) point[member] = entry.sentiment_score;
    });
    return point;
  });

  return (
    <div className="glass-sm p-4">
      <h3 className="text-sm font-medium mb-4">Team Sentiment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip
            contentStyle={{
              background: "rgba(15, 22, 41, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {members.map((member, i) => (
            <Line
              key={member}
              type="monotone"
              dataKey={member}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Create member-filter.tsx**

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

interface MemberFilterProps {
  members: string[];
  value: string;
  onChange: (value: string) => void;
}

export function MemberFilter({ members, value, onChange }: MemberFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48 glass-sm">
        <SelectValue placeholder="All Members" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Members</SelectItem>
        {members.map((m) => (
          <SelectItem key={m} value={m}>
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

NOTE: The Select component may not have been created in Phase 2 (the shadcn CLI failed and we created components manually). If `@repo/ui/components/select` doesn't exist, the implementer should create it using Radix UI Select (`@radix-ui/react-select`). Add the radix package to packages/ui if needed.

- [ ] **Step 4: Create sentiment-dashboard.tsx (client wrapper)**

This client component wraps the interactive parts (chart + filter). It receives all data from the server and handles client-side filtering.

```tsx
"use client";

import { useState, useMemo } from "react";
import { MemberFilter } from "./member-filter";
import { SentimentChart } from "./sentiment-chart";
import { StatsRow } from "./stats-row";
import { MemberGrid } from "./member-grid";
import { Timeline } from "./timeline";
import { getMemberSummaries, groupByDate } from "../lib/queries";
import type { SentimentEntry } from "../lib/types";

interface SentimentDashboardProps {
  entries: SentimentEntry[];
}

export function SentimentDashboard({ entries }: SentimentDashboardProps) {
  const [selectedMember, setSelectedMember] = useState("all");

  const members = useMemo(
    () => [...new Set(entries.map((e) => e.member_name))].sort(),
    [entries],
  );

  const filteredEntries = useMemo(
    () =>
      selectedMember === "all"
        ? entries
        : entries.filter((e) => e.member_name === selectedMember),
    [entries, selectedMember],
  );

  const memberSummaries = useMemo(
    () => getMemberSummaries(filteredEntries),
    [filteredEntries],
  );

  const dayGroups = useMemo(
    () => groupByDate(filteredEntries),
    [filteredEntries],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Dashboard</h2>
        <MemberFilter
          members={members}
          value={selectedMember}
          onChange={setSelectedMember}
        />
      </div>

      <StatsRow entries={filteredEntries} />
      <SentimentChart entries={entries} selectedMember={selectedMember} />
      <MemberGrid members={memberSummaries} />

      <div>
        <h2 className="text-lg font-medium mb-4">Timeline</h2>
        <Timeline groups={dayGroups} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
pnpm install
pnpm turbo run build --filter=@repo/web
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/apps/sentiment/components/ apps/web/package.json
git commit -m "feat(sentiment): add chart, filter, and dashboard client components"
```

---

## Task 5: Create sentiment app layout and pages

**Files:**
- Create: `apps/web/app/apps/sentiment/layout.tsx`
- Create: `apps/web/app/apps/sentiment/page.tsx`
- Create: `apps/web/app/apps/sentiment/loading.tsx`
- Create: `apps/web/app/apps/sentiment/error.tsx`
- Create: `apps/web/app/apps/sentiment/about/page.tsx`
- Create: `apps/web/app/apps/sentiment/docs/page.tsx`
- Create: `apps/web/app/apps/sentiment/changelog/page.tsx`

- [ ] **Step 1: Create layout.tsx**

Auth-gated layout with navigation.

```tsx
import { requireAccess } from "@repo/auth/server";
import type { ReactNode } from "react";

export default async function SentimentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAccess("sentiment");

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-heading text-xl text-accent">Sentiment</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/dashboard" className="text-foreground hover:text-accent">
                Dashboard
              </a>
              <a href="/about" className="text-muted-foreground hover:text-accent">
                About
              </a>
              <a href="/docs" className="text-muted-foreground hover:text-accent">
                Docs
              </a>
              <a href="/changelog" className="text-muted-foreground hover:text-accent">
                Changelog
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
```

NOTE: Nav links use relative paths. The proxy rewrites `sentiment.lastrev.com/docs` → `/apps/sentiment/docs`, so links should be relative (no `/apps/sentiment` prefix). In dev mode with `?app=sentiment`, this means the links will be relative to the rewritten base.

- [ ] **Step 2: Create page.tsx (dashboard)**

Server Component that fetches data and passes to client dashboard.

```tsx
import { getSentimentEntries } from "./lib/queries";
import { SentimentDashboard } from "./components/sentiment-dashboard";

export default async function SentimentPage() {
  const entries = await getSentimentEntries();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-accent">Team Sentiment</h1>
        <p className="text-muted-foreground text-sm">
          Track mood, blockers, and highlights across your team.
        </p>
      </div>
      <SentimentDashboard entries={entries} />
    </div>
  );
}
```

- [ ] **Step 3: Create loading.tsx**

```tsx
import { Card, CardContent } from "@repo/ui";

export default function SentimentLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="glass-sm">
            <CardContent className="p-4">
              <div className="h-8 w-12 bg-muted rounded animate-pulse mx-auto mb-2" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="glass-sm p-4 h-64 animate-pulse" />
    </div>
  );
}
```

- [ ] **Step 4: Create error.tsx**

```tsx
"use client";

import { Button } from "@repo/ui";

export default function SentimentError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="glass p-8 text-center max-w-md">
        <h2 className="font-heading text-xl text-accent mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {error.message || "Failed to load sentiment data."}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create about/page.tsx (marketing/landing)**

```tsx
export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl text-accent mb-2">
          Track Team Sentiment in Real-Time
        </h1>
        <p className="text-muted-foreground">
          Monitor mood, identify blockers, celebrate highlights.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Mood Tracking", desc: "Daily sentiment scores from 1-10 with mood labels" },
          { title: "Blocker Detection", desc: "Surface and address team blockers early" },
          { title: "Highlight Capture", desc: "Celebrate wins and positive moments" },
          { title: "Trend Analysis", desc: "Interactive charts showing sentiment over time" },
          { title: "Team Dashboard", desc: "At-a-glance view of every team member" },
          { title: "Member Filtering", desc: "Drill into individual team member data" },
        ].map((f) => (
          <div key={f.title} className="glass-sm p-4">
            <h3 className="text-sm font-medium text-accent mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create docs/page.tsx**

```tsx
export default function DocsPage() {
  return (
    <div className="max-w-2xl mx-auto prose prose-invert">
      <h1 className="font-heading text-2xl text-accent">Documentation</h1>

      <h2>Overview</h2>
      <p>
        Team Sentiment tracks daily mood scores, work summaries, blockers, and
        highlights for each team member. Data is stored in Supabase and
        displayed as interactive charts and timelines.
      </p>

      <h2>Data Schema</h2>
      <p>Each entry in <code>sentiment_entries</code> includes:</p>
      <ul>
        <li><strong>date</strong> — entry date</li>
        <li><strong>member_name</strong> — team member</li>
        <li><strong>sentiment_score</strong> — mood score (0-10)</li>
        <li><strong>mood</strong> — label (positive, neutral, frustrated, blocked, excited)</li>
        <li><strong>work_summary</strong> — brief work description</li>
        <li><strong>blockers</strong> — array of blocker strings</li>
        <li><strong>highlights</strong> — array of highlight strings</li>
      </ul>

      <h2>Scoring Guide</h2>
      <ul>
        <li><strong>9-10:</strong> Excited — exceptional day</li>
        <li><strong>7-8:</strong> Positive — good progress</li>
        <li><strong>5-6:</strong> Neutral — average day</li>
        <li><strong>3-4:</strong> Frustrated — challenges present</li>
        <li><strong>1-2:</strong> Blocked — unable to make progress</li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 7: Create changelog/page.tsx**

```tsx
export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl text-accent">Changelog</h1>

      <div className="glass-sm p-4">
        <h2 className="text-sm font-medium text-accent">v3.0.0 — Next.js Migration</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Migrated from vanilla HTML + Web Components to Next.js 16 with React
          Server Components, Recharts, and Tailwind v4. Part of the lr-apps
          monorepo migration.
        </p>
      </div>

      <div className="glass-sm p-4">
        <h2 className="text-sm font-medium text-accent">v2.0.0 — Architectural Refactoring</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Separated app from landing page. Created marketing page, docs, and
          changelog. Migrated data from JSON to Supabase. Extracted custom
          elements to modules.
        </p>
      </div>

      <div className="glass-sm p-4">
        <h2 className="text-sm font-medium text-accent">v1.0.0 — Initial Release</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Team sentiment tracking dashboard with daily mood scores, timeline,
          blocker/highlight tracking, and Chart.js visualization.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify build**

```bash
pnpm turbo run build --filter=@repo/web
```

Expected: New routes appear: `/apps/sentiment`, `/apps/sentiment/about`, `/apps/sentiment/docs`, `/apps/sentiment/changelog`

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/apps/sentiment/
git commit -m "feat(sentiment): add layout, dashboard page, about, docs, and changelog"
```

---

## Task 6: Verify full pipeline and deploy

- [ ] **Step 1: Run typecheck**

```bash
pnpm turbo run typecheck
```

- [ ] **Step 2: Run tests**

```bash
pnpm turbo run test
```

Expected: 26+ tests pass (no new tests in this phase — sentiment is data-driven and best tested via E2E later).

- [ ] **Step 3: Run build**

```bash
pnpm turbo run build --filter=@repo/web
```

- [ ] **Step 4: Test locally**

```bash
pnpm turbo run dev --filter=@repo/web
```

Visit `http://localhost:3000?app=sentiment` — should render the sentiment dashboard if you're authenticated and have permissions. If Supabase env vars are set, data should load from the `sentiment_entries` table.

- [ ] **Step 5: Deploy**

```bash
vercel deploy --prod
```

- [ ] **Step 6: Verify production**

Visit `https://sentiment.lastrev.com` (once wildcard domain is configured) or use the Vercel preview URL.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore(sentiment): phase 3 pilot complete — deployed"
```

---

## Phase 3 Completion Criteria

- [ ] Sentiment dashboard renders with data from Supabase
- [ ] Recharts line chart shows sentiment trends (single member + all members)
- [ ] Member filter works (client-side filtering)
- [ ] Stats row shows aggregated metrics
- [ ] Member grid shows team member cards with mood badges
- [ ] Timeline shows entries grouped by date
- [ ] Auth gating works via `requireAccess('sentiment')`
- [ ] About, Docs, and Changelog pages render
- [ ] Loading and error states work
- [ ] Build passes, typecheck clean
- [ ] Deployed to production
- [ ] Pattern validated for Phase 4+ migrations
