<!-- managed by alpha-loop -->
Updated `CLAUDE.md` with actual instructions (the prior content was meta-commentary about a previous rewrite, not real guidance). 86 lines, marker preserved on line 1, all 5 required sections present, lib-listing and migration-pair lints pass.

Notable refreshes vs. the placeholder:
- **Packages** — now lists all 11 (`analytics` was missing from the prior summary): `analytics`, `auth`, `billing`, `config`, `db`, `email`, `logger`, `storage`, `test-utils`, `theme`, `ui`.
- **Tech stack** — Next 16.2 + React 19, Auth0 v4, Supabase JS v2, Stripe v17, Sentry 10, OTel 0.216, AI SDK v6 + `@ai-sdk/anthropic`, Tailwind 4, Vitest 4, Node 24+, pnpm 9.15.4.
- **Routing** — captured that `apps/web/proxy.ts` is the single Routing Middleware (CSRF, CSP nonce, rate limit, Auth0, subdomain rewrite) and that all tenant route groups live under `apps/web/app/apps/<slug>/`.
- **Non-negotiables** — kept the registry-as-source-of-truth, `requireAppLayoutAccess`, `getAuth0ClientForHost`, `turbo.json#globalEnv`, append-only migrations, lib-listing-sync, billing-gate-layering, and webhook signature rules. Added the per-package subpath-export convention.
- **lib listing** — synced to all 19 files in `apps/web/lib/`; markers placed at column 0 so the regex check matches.
