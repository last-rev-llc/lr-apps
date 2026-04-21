<!-- managed by alpha-loop -->
Rewrote `CLAUDE.md` with actual instructions (the prior content was meta-commentary about a previous rewrite, not instructions). 103 lines, 5 required sections, marker preserved on line 1.

Grounded in the current codebase:
- **Overview** — `proxy.ts` subdomain routing + Auth0 middleware merge, auth hub on `auth.lastrev.com`
- **Tech Stack** — pnpm 9, Turbo 2, Next 16, React 19, TS 5, Auth0 v4, Supabase v2, Stripe, Tailwind 4, Vitest 3, Playwright 1, ESLint 9, punchlist-qa
- **Directory Structure** — real tree for `apps/web` (including `(auth)/(dashboard)`, `(auth)/(forms)`, `api/`, every `lib/` file) and all seven packages (`auth`, `billing`, `config`, `db`, `test-utils`, `theme`, `ui`)
- **Code Style** — kebab-case, `@repo/*` / `@/*` aliases, server-only service role, no hardcoded colors
- **Non-Negotiables** — registry as source of truth, `requireAppLayoutAccess` gating, `mergeAuthMiddlewareResponse` in proxy, `getAuth0ClientForHost`, `turbo.json` `globalEnv`, append-only migrations, billing via `@repo/billing`
