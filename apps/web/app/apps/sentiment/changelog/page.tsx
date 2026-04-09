import { Card, CardContent } from "@repo/ui";

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl text-accent">Changelog</h1>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-medium text-accent">v3.0.0 — Next.js Migration</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Migrated from vanilla HTML + Web Components to Next.js 16 with React
            Server Components, Recharts, and Tailwind v4. Part of the lr-apps
            monorepo migration.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-medium text-accent">v2.0.0 — Architectural Refactoring</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Separated app from landing page. Created marketing page, docs, and
            changelog. Migrated data from JSON to Supabase. Extracted custom
            elements to modules.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-medium text-accent">v1.0.0 — Initial Release</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Team sentiment tracking dashboard with daily mood scores, timeline,
            blocker/highlight tracking, and Chart.js visualization.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
