# @repo/analytics

Thin analytics wrapper supporting client `track()` and server `capture()`.

## Usage

```ts
// Client component
import { track } from "@repo/analytics/client";
track("login", { method: "email" });

// Server (action / handler / layout)
import { capture } from "@repo/analytics/server";
await capture(userId, "app_opened", { slug: "leads" });
```

## No-op behaviour

Both functions are no-ops when:

- `process.env.NODE_ENV === "test"`
- `process.env.ANALYTICS_DISABLED === "true"`
- (client only) `navigator.doNotTrack === "1"`

## Backend

The active backend is exported from `src/active-backend.ts`. To swap providers
(e.g. PostHog → Plausible), implement the `AnalyticsBackend` interface in a new
file and update that single export.

## Environment

| Var | Description |
| --- | --- |
| `NEXT_PUBLIC_ANALYTICS_HOST` | PostHog (or compatible) endpoint host |
| `NEXT_PUBLIC_ANALYTICS_KEY` | PostHog project API key (public) |
| `ANALYTICS_DISABLED` | Set to `"true"` to disable tracking entirely |

All env vars must be listed in `turbo.json` `globalEnv`.

## Event catalogue

| Event | Surface | Properties | Notes |
| --- | --- | --- | --- |
| `login` | client (auth callback) | `method` (`"email"`) | Fires on successful Auth0 login. |
| `app_opened` | server (`apps/<slug>/layout.tsx`) | `slug` | Fires once per layout activation, not per render. |
| `subscription_started` | server (`webhook-handler`) | `tier` (`"free" \| "pro" \| "enterprise"`) | Fires on `customer.subscription.created`. |
| `subscription_canceled` | server (`webhook-handler`) | `tier` | Fires on `customer.subscription.deleted`. |
| `webhook_received` | server (`webhook-handler`) | `type` | Fires at the top of the webhook handler before signature verification. `userId` is the literal string `"system"`. |

## PII policy

- **No raw email addresses** in any event property.
- User IDs passed as the `distinct_id` (first arg of `capture`) are pseudonymous
  Auth0 sub identifiers; if you also include a `userId` as a property, hash it
  with `hashUserId()` first.
- Treat slugs and tiers as non-PII.
