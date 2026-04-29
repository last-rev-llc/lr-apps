<!-- managed by alpha-loop -->
Rewrote `CLAUDE.md` with actual instructions (the prior file was meta-commentary describing a previous rewrite). 92 lines, 5 required sections, marker preserved on line 1.

Key corrections vs. the old summary:
- **Packages** — now lists all 10 (`auth`, `billing`, `config`, `db`, `email`, `logger`, `storage`, `test-utils`, `theme`, `ui`); the old file said 7 and missed `email`, `logger`, `storage`.
- **lib-listing block** — added the `<!-- lib-listing:start -->`/`<!-- lib-listing:end -->` markers required by `scripts/check-claude-md-lib-sync.ts`. Without them `pnpm lint` fails. Verified in sync.
- **Tech stack** — added Sentry 10, OpenTelemetry, Resend (email), Upstash Redis, Stripe v17, exact pnpm version.
- **Non-negotiables** — kept the registry/proxy/`requireAppLayoutAccess`/`getAuth0ClientForHost`/`turbo.json globalEnv`/append-only-migrations/billing rules, and added the explicit migration-pair-lint and lib-listing-lint rules surfaced from the codebase.
