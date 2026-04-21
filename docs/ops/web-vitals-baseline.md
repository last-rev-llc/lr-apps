# Web Vitals Baseline

This document tracks Core Web Vitals (LCP, CLS, INP) for the LR Apps platform.
Metrics are collected client-side via `next/web-vitals`, posted to
`/api/vitals` (edge runtime), and emitted as structured logs (level=`info`,
message=`web-vital`). They flow into Vercel's log drain and can be queried by
`appSlug` and `path`.

## Collection

- **Source:** `apps/web/components/web-vitals-reporter.tsx` mounted in the
  root layout, reporting on every route.
- **Transport:** `navigator.sendBeacon` with `fetch(..., { keepalive: true })`
  fallback. Failed sends are silently dropped; vitals are best-effort.
- **Endpoint:** `POST /api/vitals` (edge, no auth) — validates the payload
  with zod and logs at `info`. Returns `204 No Content` on success, `400 Bad
  Request` on invalid input.

## Per-route baseline (placeholder)

To be filled in with the first 7 days of production traffic after the
initial deploy.

| Route                      | LCP p75 (ms) | CLS p75 | INP p75 (ms) | TTFB p75 (ms) |
| -------------------------- | -----------: | ------: | -----------: | ------------: |
| `/`                        |          TBD |     TBD |          TBD |           TBD |
| `/my-apps`                 |          TBD |     TBD |          TBD |           TBD |
| `/pricing`                 |          TBD |     TBD |          TBD |           TBD |
| `/apps/command-center`     |          TBD |     TBD |          TBD |           TBD |
| `/apps/accounts`           |          TBD |     TBD |          TBD |           TBD |
| `/apps/sentiment`          |          TBD |     TBD |          TBD |           TBD |

## Targets

We follow Google's "good" thresholds as initial targets:

| Metric | Good      | Needs improvement | Poor    |
| ------ | --------- | ----------------- | ------- |
| LCP    | ≤ 2500 ms | ≤ 4000 ms         | > 4000  |
| INP    | ≤ 200 ms  | ≤ 500 ms          | > 500   |
| CLS    | ≤ 0.1     | ≤ 0.25            | > 0.25  |
| TTFB   | ≤ 800 ms  | ≤ 1800 ms         | > 1800  |

## Querying

In Vercel logs:

```
message:"web-vital" appSlug:accounts metric:LCP
```

To compute p75 from a JSON-line export, group by `path` and apply a percentile
aggregator.
