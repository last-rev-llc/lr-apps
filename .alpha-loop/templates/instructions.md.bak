<!-- managed by alpha-loop -->
Rewrote `CLAUDE.md`. The previous contents were a stale meta-commentary (just describing edits that had been applied) rather than instructions. I replaced it with the required 5-section structure grounded in the current codebase:

- **Overview** — Next.js 16 host routing multi-tenant apps by subdomain via `proxy.ts` + `app-registry.ts`
- **Tech Stack** — pnpm/Turbo, Next 16, React 19, TS 5, Auth0 v4, Supabase v2, Stripe, Tailwind 4, Vitest/Playwright, ESLint 9, punchlist-qa
- **Directory Structure** — actual tree for `apps/web` (including `(auth)/(dashboard)` + `(forms)` groups, `api/`, `lib/` files `app-host.ts`, `proxy-utils.ts`, `require-app-layout-access.ts`, etc.) and each `packages/*`
- **Code Style** — kebab-case files, `@repo/*` imports, `@/*` alias, no hardcoded hex, service-role is server-only
- **Non-Negotiables** — app-registry is source of truth, gate with `requireAppLayoutAccess`, merge Auth0 middleware, add env vars to `turbo.json` `globalEnv`, migrations are append-only

Kept the managed-by marker as line 1 and stayed well under 150 lines. Omitted testing/git/review/security per the instructions.
