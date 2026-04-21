# Bundle Baseline

This document captures the JavaScript bundle baseline for `apps/web` so future
changes can be measured against a known reference point.

## How to run

```bash
pnpm --filter @repo/web analyze
```

`@next/bundle-analyzer` is wired in `apps/web/next.config.ts` and toggled on
when the `ANALYZE=true` env var is set. The script passes `--webpack`
because the analyzer plugin is webpack-only — Turbopack builds skip the
report (Next 16's Turbopack analyzer is still experimental at the time of
writing).

The reports land at:

- `apps/web/.next/analyze/client.html` — what ships to the browser
- `apps/web/.next/analyze/nodejs.html` — server bundle
- `apps/web/.next/analyze/edge.html` — edge runtime bundle

These files are gitignored (under `.next/`) and should not be committed.

## Top client-bundle contributors (initial measurement)

Captured from the first `analyze` run after wiring in Sentry + Web Vitals.
Sizes are stat (uncompressed) from the analyzer report; gzipped sizes are
roughly a third.

| # | Package                  | Notes                                                         | Mitigation                                                                                  |
| - | ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1 | `mermaid` + parser       | Pulled in by `@repo/ui/components/mermaid.tsx`                | Already imported lazily inside the component; verify no eager import elsewhere.             |
| 2 | `recharts`               | Charting library used by command-center & sentiment dashboards | Dynamic-import the chart wrapper components (route-level) so non-chart routes skip it.       |
| 3 | `@sentry/browser` + core | Required for client-side error reporting                       | Accepted — keep as-is; Sentry SDK lazy-loads heavy integrations on demand already.          |
| 4 | `@supabase/supabase-js` + `@supabase/ssr` | Auth + data layer (browser client)                | Use only `@supabase/ssr` `createBrowserClient` per route; avoid bundling `service-role`.     |
| 5 | Auth0 client (`@auth0/nextjs-auth0`)      | Login UI + token handling                          | Already split server/client by entry; ensure no server-only code reaches client components. |

## Per-route First Load JS (placeholder)

Capture after the first webpack-mode build completes end-to-end (currently a
pre-existing typecheck error in `app/apps/ai-calculator/(protected)/calculator/page.tsx`
short-circuits the route table). Until then, refer to the analyzer HTML reports
for module-level breakdowns.

| Route                     | First Load JS (gz) |
| ------------------------- | -----------------: |
| `/`                       |                TBD |
| `/my-apps`                |                TBD |
| `/apps/command-center`    |                TBD |
| `/apps/sentiment`         |                TBD |
| `/apps/accounts`          |                TBD |

## Workflow

1. Make a change you want to measure.
2. Run `pnpm --filter @repo/web analyze`.
3. Open the three HTML reports; compare module sizes against this baseline.
4. If a single dependency grows by > 50 KB gz, consider a dynamic import,
   tree-shake audit, or replacement before merging.

CI does not gate on bundle size yet — this is an on-demand local tool.
