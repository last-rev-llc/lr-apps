# Observability

This doc covers distributed tracing. Error tracking is handled separately
by [Sentry](../../apps/web/sentry.server.config.ts).

## What we trace

OpenTelemetry spans are emitted from the Stripe webhook handler and the
auth middleware / layout gate. The goal is catching **latency
regressions** that error counts alone miss — slow permission lookups,
webhook processing spikes, signature verification bottlenecks.

### Span hierarchy

**Stripe webhook (`POST /api/webhooks/stripe`):**

```
stripe.webhook.POST                  (apps/web/app/api/webhooks/stripe/route.ts)
├── stripe.webhook.verify            signature verification
├── stripe.webhook.parse             event-type check + idempotency SELECT
└── stripe.webhook.db_write          subscriptions upsert / update
```

**Proxy + layout gate:**

```
proxy.auth                           (apps/web/proxy.ts)
├── auth.session_check               auth0.middleware()
└── proxy.redirect_decision          subdomain resolution + rewrite/redirect

auth.permission_lookup               (apps/web/lib/require-app-layout-access.ts)
                                     wraps requireAccess() in node layouts
```

Attributes include `request.pathname`, `request.host`, `event.id`,
`event.type`, `subscription.id`, `app.slug`.

## Runtime split

- **Node routes** (`/api/*`, layouts, pages) — the NodeSDK is initialized
  in `apps/web/lib/otel-sdk.ts` from `instrumentation.ts`. Real spans are
  exported here.
- **Edge middleware** (`proxy.ts`) — Next.js runs middleware on the edge
  runtime by default, where `@opentelemetry/sdk-node` cannot load. The
  code uses `@opentelemetry/api` only, which returns a **no-op tracer**
  when no SDK is registered. Spans from `proxy.auth`, `auth.session_check`,
  and `proxy.redirect_decision` are silently dropped on the edge. Real
  visibility for those paths comes from the layout-level
  `auth.permission_lookup` span, which runs on node.

## Setup

### 1. Choose a backend

Any OTLP-HTTP-compatible backend works. Recommended: **Honeycomb** (free
dev tier, straightforward setup). Grafana Cloud Tempo and Datadog also
support OTLP.

### 2. Configure env

| Variable | Example | Notes |
|----------|---------|-------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `https://api.honeycomb.io:443/v1/traces` | Full OTLP/HTTP endpoint. Leave blank to skip SDK init. |
| `OTEL_SERVICE_NAME` | `lr-apps-web` | Defaults to `lr-apps-web`. |
| `OTEL_SDK_DISABLED` | `true` \| (unset) | Forces the SDK off even when the endpoint is set (tests, local dev). |

For Honeycomb, add their auth header via the standard OTLP header env:

```bash
export OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=<your-api-key>"
```

All three variables are declared in `turbo.json` `globalEnv` so they
propagate to every task.

### 3. Add to `.env.local`

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io:443/v1/traces
OTEL_SERVICE_NAME=lr-apps-web
# OTEL_SDK_DISABLED=true   # uncomment to disable locally
```

### 4. Verify

1. Start the dev server (`pnpm dev`).
2. Hit an authenticated app route; trigger a Stripe webhook replay
   (`stripe trigger customer.subscription.updated`).
3. Check your backend for the `stripe.webhook.POST` parent span with
   three child spans.

## Disabling in tests

The vitest suite sets no OTLP endpoint, so the SDK never starts — spans
become no-ops automatically. Set `OTEL_SDK_DISABLED=true` in CI if a
future test harness does export the endpoint.

## When to add a new span

Add a span when you need to measure a discrete unit of work that:

- crosses a network / DB boundary (fetch, Supabase, Stripe, Auth0), or
- is a hot-path hotspot you suspect of latency regressions.

Do **not** add spans for pure in-memory functions — the tracer overhead
outweighs the signal. Use Sentry breadcrumbs or structured logs for
those.

## Further reading

- [OpenTelemetry JS docs](https://opentelemetry.io/docs/languages/js/)
- [Honeycomb OTLP quickstart](https://docs.honeycomb.io/send-data/opentelemetry/)
- [`apps/web/lib/otel.ts`](../../apps/web/lib/otel.ts) — shared `withSpan` helper
- [`apps/web/lib/otel-sdk.ts`](../../apps/web/lib/otel-sdk.ts) — NodeSDK boot
