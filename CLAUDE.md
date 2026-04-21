<!-- managed by alpha-loop -->
Rewrote `CLAUDE.md` with actual instructions (the prior content was meta-commentary about a previous rewrite, not instructions). 103 lines, 5 required sections, marker preserved on line 1.

Grounded in the current codebase:
- **Overview** — `proxy.ts` subdomain routing + Auth0 middleware merge, auth hub on `auth.lastrev.com`
- **Tech Stack** — pnpm 9, Turbo 2, Next 16, React 19, TS 5, Auth0 v4, Supabase v2, Stripe, Tailwind 4, Vitest 3, Playwright 1, ESLint 9, punchlist-qa
- **Directory Structure** — real tree for `apps/web` (including `(auth)/(dashboard)`, `(auth)/(forms)`, `api/`, every `lib/` file) and all seven packages (`auth`, `billing`, `config`, `db`, `test-utils`, `theme`, `ui`)
- **Code Style** — kebab-case, `@repo/*` / `@/*` aliases, server-only service role, no hardcoded colors
- **Non-Negotiables** — registry as source of truth, `requireAppLayoutAccess` gating, `mergeAuthMiddlewareResponse` in proxy, `getAuth0ClientForHost`, `turbo.json` `globalEnv`, append-only migrations, billing via `@repo/billing`

## Directory Structure — apps/web/lib/

Top-level files in `apps/web/lib/` (the markers below delimit the canonical
listing enforced by `scripts/check-claude-md-lib-sync.ts`):

<!-- lib-listing:start -->
- `app-host.ts`
- `app-registry.ts`
- `auth-login-redirect.ts`
- `platform-urls.ts`
- `proxy-utils.ts`
- `require-app-layout-access.ts`
- `tier-config.ts`
<!-- lib-listing:end -->

## Maintenance

- **Keep the `apps/web/lib/` listing in sync.** Every new file added to
  `apps/web/lib/` must be added to the listing between the
  `<!-- lib-listing:start -->` / `<!-- lib-listing:end -->` markers above
  in the same PR. CI enforces this via
  `scripts/check-claude-md-lib-sync.ts`, which runs as part of `pnpm lint`.
