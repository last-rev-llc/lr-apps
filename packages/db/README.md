# @repo/db

Typed Supabase clients, query helpers, and a Redis-backed read cache for the LR Apps platform. All cross-package DB access goes through this package — never instantiate `@supabase/supabase-js` directly in app or feature code.

## Exports

| Subpath | Purpose |
| --- | --- |
| `@repo/db` | Re-exports the most-used helpers and types (`createServerClient`, `getAppPermission`, `getUserSubscription`, `upsertPermission`, `logAuditEvent`, cache primitives, `Database` types). |
| `@repo/db/server` | Cookies-bound SSR client for Server Components and Route Handlers. |
| `@repo/db/client` | Browser anon client. Public reads only. |
| `@repo/db/service-role` | Server-only privileged client. Bypasses RLS. |
| `@repo/db/middleware` | SSR client wired for Next.js middleware/proxy. |
| `@repo/db/audit` | `logAuditEvent` for the `audit_log` table. |
| `@repo/db/cache` | Upstash Redis facade (`cacheGet`, `cacheSet`, `cacheDel`, `cacheKeys`, TTL constants). |
| `@repo/db/types` | Generated `Database` type and table-row aliases. |

## Choosing a client

The choice is about *who* the query runs as. Pick the most-restrictive client that works.

### `@repo/db/server` — SSR (default for app code)

Use from Server Components, Route Handlers, and Server Actions that act on behalf of the signed-in user. Reads cookies and runs queries with the user's RLS context. In production the Auth0 session fronts the request, so this client falls back to the service role key for the actual Postgres connection while still scoping by user ID at the query layer.

```ts
import { createServerClient } from "@repo/db";
import { getAppPermission } from "@repo/db";

export default async function Page() {
  const supabase = await createServerClient();
  const permission = await getAppPermission(supabase, userId, "command-center");
  // ...
}
```

### `@repo/db/client` — browser

Use only from `"use client"` components that need realtime or live queries against tables protected by RLS for `anon`. Never pass user-scoped tokens to this client.

```ts
"use client";
import { createClient } from "@repo/db/client";

const supabase = createClient();
```

### `@repo/db/service-role` — privileged server-only

Use from cron handlers, Stripe webhooks, and self-enroll flows where the request has no user session yet but the server still needs to write rows. **Never import this from a route that streams data back to the browser** — leaking results from a service-role query past row-level security defeats RLS.

```ts
import { createServiceRoleClient } from "@repo/db/service-role";

export async function POST(req: Request) {
  const admin = createServiceRoleClient();
  await admin.from("webhook_events").insert({ ... });
}
```

| | `server.ts` | `client.ts` | `service-role.ts` |
| --- | --- | --- | --- |
| Runs on | server | browser | server |
| Auth | user (via cookies) | anon | service role (bypasses RLS) |
| Use for | most app code | realtime UI | webhooks, cron, self-enroll |

## Typed query helpers

Defined in `src/queries.ts`. All three accept any `SupabaseClient<Database>`, so they work with the SSR client, the service-role client, or test mocks.

### `getAppPermission(client, userId, slug): Promise<Permission | null>`

Reads the user's permission row for an app slug. Cached in Redis at `perm:{userId}:{slug}` for `PERM_TTL_SECONDS` (60 s); falls back to a direct Postgres read when Upstash is not configured. Returns `null` when no row exists (caller should treat this as "no access").

```ts
const permission = await getAppPermission(supabase, userId, "ideas");
if (permission !== "owner") return notFound();
```

### `getUserSubscription(client, userId): Promise<SubscriptionRow | null>`

Reads the user's `subscriptions` row. Cached at `sub:{userId}` for `SUB_TTL_SECONDS` (300 s). Used by `@repo/billing` to enforce tier gating.

```ts
const sub = await getUserSubscription(supabase, userId);
const tier = sub?.tier ?? "free";
```

### `upsertPermission(client, userId, slug, permission): Promise<AppPermission>`

Inserts or updates an `app_permissions` row keyed on `(user_id, app_slug)`. Invalidates the corresponding cache entry on success. Use a service-role client when the caller is the platform itself (self-enroll, admin grant). Use the SSR client when an authenticated user is granting permission to themselves under a policy that allows it.

```ts
import { createServiceRoleClient } from "@repo/db/service-role";

const admin = createServiceRoleClient();
await upsertPermission(admin, userId, "command-center", "owner");
```

## Caching

The cache layer is opt-in via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. When unset (e.g. local dev), every helper falls through to a direct Postgres read — there is no broken state, just lower throughput. `CACHE_VERSION` is derived from `VERCEL_GIT_COMMIT_SHA`, so each deploy invalidates the indefinite `app:*` keys without a manual flush.

If you add a new query helper, follow the existing pattern: read-through cache with a versioned key, write-through invalidation after mutation, and a TTL that matches the freshness requirement.

## Migrations

Schema changes ship as paired up/down SQL files under `supabase/migrations/`. See [`docs/guides/migrations.md`](../../docs/guides/migrations.md) for the naming convention, rollback rules, the `db:rollback` helper, and the manual production revert procedure.

After regenerating types (`supabase gen types typescript`), update `src/types.ts` and re-run `pnpm --filter @repo/db test`.
