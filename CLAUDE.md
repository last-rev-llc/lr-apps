<!-- managed by alpha-loop -->
Two small updates applied:

1. **TypeScript version** — changed `5.9` to `5` (package.json uses `^5`, not pinned)
2. **`lib/` directory listing** — added `app-host.ts`, `proxy-utils.ts`, and `require-app-layout-access.ts` which exist in the codebase but were missing from the docs

Everything else checked out accurately against the current codebase.

## Stripe Test Seed

Populates Stripe test mode with Free, Pro, and Enterprise products and monthly prices.

```bash
npx tsx scripts/seed-stripe.ts
```

**Required env var:** `STRIPE_SECRET_KEY` must be a test key (starts with `sk_test_`). The script will refuse to run against live keys.

**What it creates:**
- Three products: Free ($0/mo), Pro ($19/mo), Enterprise ($99/mo)
- One monthly recurring price per product
- Logs the resulting `price_id` for each — copy these into `.env` as `STRIPE_PRICE_ID_FREE`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_ENTERPRISE`.
