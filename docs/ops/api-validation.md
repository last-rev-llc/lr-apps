# API input validation

All API routes that accept JSON input should validate the body against a
Zod schema via `validateJson` in `apps/web/lib/validate-request.ts`.

## Pattern

```ts
import { z } from "zod";
import { validateJson } from "@/lib/validate-request";

const bodySchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = await validateJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const { priceId } = parsed.data;
  // ... handler logic with typed data ...
}
```

`validateJson` returns a discriminated union:

- `{ ok: true, data: T }` — `data` is typed to the schema's inferred type.
- `{ ok: false, response: Response }` — a pre-built `Response` the handler
  returns directly.

## Error response shape

Two shapes, both HTTP 400:

**Malformed JSON**

```json
{
  "error": "invalid_json",
  "message": "Request body is not valid JSON"
}
```

**Schema failure**

```json
{
  "error": "invalid_input",
  "issues": [
    { "path": ["priceId"], "message": "String must contain at least 1 character(s)", "code": "too_small" }
  ]
}
```

The `issues` array is Zod's `ZodIssue[]` flattened to the three fields
clients need (`path`, `message`, `code`) so we can evolve internals without
breaking consumers.

## Webhook routes

The Stripe webhook (`/api/webhooks/stripe`) receives a raw `Buffer` rather
than JSON — signature verification requires the untouched bytes. For those
routes, validate the **header envelope** with Zod instead:

```ts
const headerSchema = z.object({
  "stripe-signature": z.string().min(1),
});
```

Any new JSON fields added to webhook routes should use `validateJson` on the
JSON sub-object.

## When to skip

`validateJson` is for route handlers receiving untrusted external JSON.
Server components, server actions already typed by framework contracts, and
internal helpers do not need it.
