# M1: Shared Foundations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish billing infrastructure, test tooling, typed DB helpers, universal auth gate mechanics, and billing-ready app registry schema — everything M2–M7 depends on.

**Architecture:** Five independent packages/changes that can be built in any order except Task 4 (auth middleware) depends on Task 5 (registry schema) for the `publicRoutes` concept. Each task is self-contained with its own tests.

**Tech Stack:** TypeScript, Vitest 3, Supabase, Stripe, Auth0, pnpm workspaces, Turbo

---

## File Map

```
packages/billing/                    # NEW — Task 1
  package.json
  src/index.ts
  src/types.ts
  src/stripe-client.ts
  src/customers.ts
  src/subscriptions.ts
  src/webhook-handler.ts
  src/has-feature-access.ts
  src/__tests__/customers.test.ts
  src/__tests__/subscriptions.test.ts
  src/__tests__/has-feature-access.test.ts
  src/__tests__/webhook-handler.test.ts

packages/test-utils/                 # NEW — Task 2
  package.json
  src/index.ts
  src/mock-supabase.ts
  src/mock-auth0.ts
  src/render-with-providers.tsx

packages/db/src/                     # MODIFY — Task 3
  types.ts                           # add Subscription type + table
  queries.ts                         # NEW — typed query helpers
  index.ts                           # re-export queries

packages/auth/src/                   # MODIFY — Task 4
  require-access.ts                  # use new db helpers

apps/web/lib/                        # MODIFY — Tasks 4 & 5
  require-app-layout-access.ts       # remove publicEntry bypass
  app-registry.ts                    # add tier, features fields
  __tests__/app-registry.test.ts     # update tests
```

---

### Task 1: Create `@repo/billing` Package

**Files:**
- Create: `packages/billing/package.json`
- Create: `packages/billing/src/types.ts`
- Create: `packages/billing/src/stripe-client.ts`
- Create: `packages/billing/src/customers.ts`
- Create: `packages/billing/src/__tests__/customers.test.ts`
- Create: `packages/billing/src/subscriptions.ts`
- Create: `packages/billing/src/__tests__/subscriptions.test.ts`
- Create: `packages/billing/src/has-feature-access.ts`
- Create: `packages/billing/src/__tests__/has-feature-access.test.ts`
- Create: `packages/billing/src/webhook-handler.ts`
- Create: `packages/billing/src/__tests__/webhook-handler.test.ts`
- Create: `packages/billing/src/index.ts`
- Create: `packages/billing/vitest.config.ts`

- [ ] **Step 1: Scaffold package.json**

```json
{
  "name": "@repo/billing",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types.ts",
    "./webhook": "./src/webhook-handler.ts"
  },
  "dependencies": {
    "@repo/db": "workspace:*",
    "stripe": "^17"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 2: Create vitest config**

Create `packages/billing/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 3: Define types**

Create `packages/billing/src/types.ts`:

```typescript
export type Tier = "free" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  tier: Tier;
  status: SubscriptionStatus;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}
```

- [ ] **Step 4: Create Stripe client singleton**

Create `packages/billing/src/stripe-client.ts`:

```typescript
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  _stripe = new Stripe(key);
  return _stripe;
}
```

- [ ] **Step 5: Write failing test for customers**

Create `packages/billing/src/__tests__/customers.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrCreateCustomer } from "../customers";

vi.mock("../stripe-client", () => ({
  getStripe: vi.fn(() => ({
    customers: {
      list: vi.fn(),
      create: vi.fn(),
    },
  })),
}));

import { getStripe } from "../stripe-client";

describe("getOrCreateCustomer", () => {
  const mockStripe = getStripe() as unknown as {
    customers: {
      list: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing customer when found", async () => {
    mockStripe.customers.list.mockResolvedValue({
      data: [{ id: "cus_existing", email: "a@b.com" }],
    });

    const result = await getOrCreateCustomer("user-1", "a@b.com");
    expect(result).toBe("cus_existing");
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
  });

  it("creates customer when not found", async () => {
    mockStripe.customers.list.mockResolvedValue({ data: [] });
    mockStripe.customers.create.mockResolvedValue({ id: "cus_new" });

    const result = await getOrCreateCustomer("user-1", "a@b.com");
    expect(result).toBe("cus_new");
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: "a@b.com",
      metadata: { user_id: "user-1" },
    });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd packages/billing && npx vitest run src/__tests__/customers.test.ts`
Expected: FAIL — `../customers` module not found

- [ ] **Step 7: Implement customers module**

Create `packages/billing/src/customers.ts`:

```typescript
import { getStripe } from "./stripe-client";

export async function getOrCreateCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const stripe = getStripe();

  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  return customer.id;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd packages/billing && npx vitest run src/__tests__/customers.test.ts`
Expected: PASS

- [ ] **Step 9: Write failing test for subscriptions**

Create `packages/billing/src/__tests__/subscriptions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  upsertSubscription,
  getSubscription,
  type SubscriptionRow,
} from "../subscriptions";

const mockUpsert = vi.fn();
const mockSelect = vi.fn();

vi.mock("@repo/db/service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table !== "subscriptions")
        throw new Error(`unexpected table: ${table}`);
      return {
        upsert: mockUpsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "sub-1",
                user_id: "user-1",
                stripe_customer_id: "cus_1",
                stripe_subscription_id: "sub_stripe_1",
                tier: "pro",
                status: "active",
                current_period_end: "2026-05-01T00:00:00Z",
                created_at: "2026-04-01T00:00:00Z",
                updated_at: "2026-04-01T00:00:00Z",
              },
              error: null,
            }),
          }),
        }),
        select: mockSelect.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "sub-1",
                user_id: "user-1",
                tier: "pro",
                status: "active",
              },
              error: null,
            }),
          }),
        }),
      };
    }),
  })),
}));

describe("subscriptions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts a subscription row", async () => {
    const result = await upsertSubscription({
      user_id: "user-1",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_stripe_1",
      tier: "pro",
      status: "active",
      current_period_end: "2026-05-01T00:00:00Z",
    });

    expect(result.tier).toBe("pro");
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("gets a subscription by user_id", async () => {
    const result = await getSubscription("user-1");
    expect(result?.tier).toBe("pro");
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `cd packages/billing && npx vitest run src/__tests__/subscriptions.test.ts`
Expected: FAIL — `../subscriptions` module not found

- [ ] **Step 11: Implement subscriptions module**

Create `packages/billing/src/subscriptions.ts`:

```typescript
import { createServiceRoleClient } from "@repo/db/service-role";
import type { Subscription, SubscriptionStatus, Tier } from "./types";

export type SubscriptionRow = Subscription;

interface UpsertInput {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  tier: Tier;
  status: SubscriptionStatus;
  current_period_end: string;
}

export async function upsertSubscription(
  input: UpsertInput,
): Promise<Subscription> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: "stripe_subscription_id" },
    )
    .select()
    .single();

  if (error) throw new Error(`upsertSubscription failed: ${error.message}`);
  return data as Subscription;
}

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select()
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Subscription;
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `cd packages/billing && npx vitest run src/__tests__/subscriptions.test.ts`
Expected: PASS

- [ ] **Step 13: Write failing test for hasFeatureAccess**

Create `packages/billing/src/__tests__/has-feature-access.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasFeatureAccess } from "../has-feature-access";

vi.mock("../subscriptions", () => ({
  getSubscription: vi.fn(),
}));

import { getSubscription } from "../subscriptions";

const mockGetSubscription = getSubscription as ReturnType<typeof vi.fn>;

describe("hasFeatureAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true for free features with no subscription", async () => {
    mockGetSubscription.mockResolvedValue(null);
    const result = await hasFeatureAccess("user-1", "free");
    expect(result).toBe(true);
  });

  it("returns false for pro features with no subscription", async () => {
    mockGetSubscription.mockResolvedValue(null);
    const result = await hasFeatureAccess("user-1", "pro");
    expect(result).toBe(false);
  });

  it("returns true for pro features with active pro subscription", async () => {
    mockGetSubscription.mockResolvedValue({
      tier: "pro",
      status: "active",
    });
    const result = await hasFeatureAccess("user-1", "pro");
    expect(result).toBe(true);
  });

  it("returns true for pro features with enterprise subscription", async () => {
    mockGetSubscription.mockResolvedValue({
      tier: "enterprise",
      status: "active",
    });
    const result = await hasFeatureAccess("user-1", "pro");
    expect(result).toBe(true);
  });

  it("returns false for past_due subscriptions", async () => {
    mockGetSubscription.mockResolvedValue({
      tier: "pro",
      status: "past_due",
    });
    const result = await hasFeatureAccess("user-1", "pro");
    expect(result).toBe(false);
  });

  it("returns true for trialing subscriptions", async () => {
    mockGetSubscription.mockResolvedValue({
      tier: "pro",
      status: "trialing",
    });
    const result = await hasFeatureAccess("user-1", "pro");
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 14: Run test to verify it fails**

Run: `cd packages/billing && npx vitest run src/__tests__/has-feature-access.test.ts`
Expected: FAIL — `../has-feature-access` module not found

- [ ] **Step 15: Implement hasFeatureAccess**

Create `packages/billing/src/has-feature-access.ts`:

```typescript
import { getSubscription } from "./subscriptions";
import type { Tier } from "./types";

const TIER_HIERARCHY: Tier[] = ["free", "pro", "enterprise"];
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export async function hasFeatureAccess(
  userId: string,
  requiredTier: Tier,
): Promise<boolean> {
  if (requiredTier === "free") return true;

  const subscription = await getSubscription(userId);
  if (!subscription) return false;

  if (!ACTIVE_STATUSES.has(subscription.status)) return false;

  const userLevel = TIER_HIERARCHY.indexOf(subscription.tier);
  const requiredLevel = TIER_HIERARCHY.indexOf(requiredTier);
  return userLevel >= requiredLevel;
}
```

- [ ] **Step 16: Run test to verify it passes**

Run: `cd packages/billing && npx vitest run src/__tests__/has-feature-access.test.ts`
Expected: PASS

- [ ] **Step 17: Write failing test for webhook handler**

Create `packages/billing/src/__tests__/webhook-handler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleWebhookEvent } from "../webhook-handler";

vi.mock("../subscriptions", () => ({
  upsertSubscription: vi.fn(),
}));

vi.mock("../customers", () => ({
  getOrCreateCustomer: vi.fn(),
}));

import { upsertSubscription } from "../subscriptions";

const mockUpsert = upsertSubscription as ReturnType<typeof vi.fn>;

describe("handleWebhookEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handles customer.subscription.created", async () => {
    mockUpsert.mockResolvedValue({ id: "sub-1" });

    await handleWebhookEvent({
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_stripe_1",
          customer: "cus_1",
          status: "active",
          items: {
            data: [{ price: { lookup_key: "pro_monthly" } }],
          },
          current_period_end: 1746057600,
          metadata: { user_id: "user-1" },
        },
      },
    });

    expect(mockUpsert).toHaveBeenCalledWith({
      user_id: "user-1",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_stripe_1",
      tier: "pro",
      status: "active",
      current_period_end: expect.any(String),
    });
  });

  it("handles customer.subscription.updated", async () => {
    mockUpsert.mockResolvedValue({ id: "sub-1" });

    await handleWebhookEvent({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_stripe_1",
          customer: "cus_1",
          status: "past_due",
          items: {
            data: [{ price: { lookup_key: "pro_monthly" } }],
          },
          current_period_end: 1746057600,
          metadata: { user_id: "user-1" },
        },
      },
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "past_due" }),
    );
  });

  it("handles customer.subscription.deleted", async () => {
    mockUpsert.mockResolvedValue({ id: "sub-1" });

    await handleWebhookEvent({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_stripe_1",
          customer: "cus_1",
          status: "canceled",
          items: {
            data: [{ price: { lookup_key: "pro_monthly" } }],
          },
          current_period_end: 1746057600,
          metadata: { user_id: "user-1" },
        },
      },
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled" }),
    );
  });

  it("ignores unhandled event types", async () => {
    await handleWebhookEvent({
      type: "invoice.payment_succeeded",
      data: { object: {} },
    });

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 18: Run test to verify it fails**

Run: `cd packages/billing && npx vitest run src/__tests__/webhook-handler.test.ts`
Expected: FAIL — `../webhook-handler` module not found

- [ ] **Step 19: Implement webhook handler**

Create `packages/billing/src/webhook-handler.ts`:

```typescript
import { upsertSubscription } from "./subscriptions";
import type { Tier, WebhookEvent } from "./types";

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function tierFromLookupKey(lookupKey: string | undefined): Tier {
  if (!lookupKey) return "free";
  if (lookupKey.startsWith("enterprise")) return "enterprise";
  if (lookupKey.startsWith("pro")) return "pro";
  return "free";
}

export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  if (!SUBSCRIPTION_EVENTS.has(event.type)) return;

  const sub = event.data.object as Record<string, unknown>;
  const items = sub.items as { data: Array<{ price: { lookup_key?: string } }> };
  const lookupKey = items?.data?.[0]?.price?.lookup_key;

  await upsertSubscription({
    user_id: (sub.metadata as Record<string, string>)?.user_id ?? "",
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id as string,
    tier: tierFromLookupKey(lookupKey),
    status: sub.status as "active" | "past_due" | "canceled" | "trialing" | "incomplete",
    current_period_end: new Date(
      (sub.current_period_end as number) * 1000,
    ).toISOString(),
  });
}
```

- [ ] **Step 20: Run test to verify it passes**

Run: `cd packages/billing && npx vitest run src/__tests__/webhook-handler.test.ts`
Expected: PASS

- [ ] **Step 21: Create index barrel export**

Create `packages/billing/src/index.ts`:

```typescript
export { getOrCreateCustomer } from "./customers";
export { getSubscription, upsertSubscription } from "./subscriptions";
export { hasFeatureAccess } from "./has-feature-access";
export { handleWebhookEvent } from "./webhook-handler";
export type { Tier, Subscription, SubscriptionStatus, WebhookEvent } from "./types";
```

- [ ] **Step 22: Install dependencies and run all billing tests**

Run: `cd /Users/adamharris/Documents/repos/lr-apps && pnpm install && cd packages/billing && npx vitest run`
Expected: All 4 test files pass

- [ ] **Step 23: Commit**

```bash
git add packages/billing/
git commit -m "feat(billing): scaffold @repo/billing package with Stripe helpers

Adds customer management, subscription CRUD, hasFeatureAccess utility,
and webhook handler. All infrastructure — no app-level gating yet."
```

---

### Task 2: Create `packages/test-utils` + Vitest Workspace

**Files:**
- Create: `packages/test-utils/package.json`
- Create: `packages/test-utils/src/index.ts`
- Create: `packages/test-utils/src/mock-supabase.ts`
- Create: `packages/test-utils/src/mock-auth0.ts`
- Create: `packages/test-utils/src/render-with-providers.tsx`

- [ ] **Step 1: Create package.json**

Create `packages/test-utils/package.json`:

```json
{
  "name": "@repo/test-utils",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./mock-supabase": "./src/mock-supabase.ts",
    "./mock-auth0": "./src/mock-auth0.ts",
    "./render": "./src/render-with-providers.tsx"
  },
  "dependencies": {
    "@testing-library/react": "^16",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/react": "^19",
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 2: Create mock Supabase client**

Create `packages/test-utils/src/mock-supabase.ts`:

```typescript
import { vi } from "vitest";

export interface MockSupabaseQuery {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

function createChainableMock(): MockSupabaseQuery {
  const mock: MockSupabaseQuery = {
    select: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  // Each method returns the mock itself for chaining
  for (const key of Object.keys(mock) as (keyof MockSupabaseQuery)[]) {
    mock[key].mockReturnValue(mock);
  }

  return mock;
}

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  _queries: Map<string, MockSupabaseQuery>;
}

/**
 * Creates a mock Supabase client for testing.
 *
 * Usage:
 * ```ts
 * const { client, getQuery } = createMockSupabase();
 * const q = getQuery("app_permissions");
 * q.single.mockResolvedValue({ data: { permission: "view" }, error: null });
 * ```
 */
export function createMockSupabase(): {
  client: MockSupabaseClient;
  getQuery: (table: string) => MockSupabaseQuery;
} {
  const queries = new Map<string, MockSupabaseQuery>();

  const client: MockSupabaseClient = {
    from: vi.fn((table: string) => {
      if (!queries.has(table)) {
        queries.set(table, createChainableMock());
      }
      return queries.get(table)!;
    }),
    _queries: queries,
  };

  return {
    client,
    getQuery: (table: string) => {
      if (!queries.has(table)) {
        queries.set(table, createChainableMock());
      }
      return queries.get(table)!;
    },
  };
}
```

- [ ] **Step 3: Create mock Auth0 session helper**

Create `packages/test-utils/src/mock-auth0.ts`:

```typescript
import { vi } from "vitest";

export interface MockAuth0Session {
  user: {
    sub: string;
    email: string;
    name?: string;
  };
}

export interface MockAuth0Client {
  getSession: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Auth0 client for testing.
 *
 * Usage:
 * ```ts
 * const { client, setSession } = createMockAuth0();
 * setSession({ sub: "user-1", email: "a@b.com" });
 * ```
 */
export function createMockAuth0(): {
  client: MockAuth0Client;
  setSession: (user: { sub: string; email: string; name?: string } | null) => void;
} {
  const client: MockAuth0Client = {
    getSession: vi.fn().mockResolvedValue(null),
  };

  function setSession(
    user: { sub: string; email: string; name?: string } | null,
  ) {
    if (user) {
      client.getSession.mockResolvedValue({ user });
    } else {
      client.getSession.mockResolvedValue(null);
    }
  }

  return { client, setSession };
}
```

- [ ] **Step 4: Create renderWithProviders wrapper**

Create `packages/test-utils/src/render-with-providers.tsx`:

```typescript
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: ProvidersProps) {
  // Wrap with any providers tests commonly need.
  // Add theme, auth context, etc. as the app grows.
  return <>{children}</>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

- [ ] **Step 5: Create barrel export**

Create `packages/test-utils/src/index.ts`:

```typescript
export { createMockSupabase, type MockSupabaseClient, type MockSupabaseQuery } from "./mock-supabase";
export { createMockAuth0, type MockAuth0Session, type MockAuth0Client } from "./mock-auth0";
export { renderWithProviders } from "./render-with-providers";
```

- [ ] **Step 6: Install dependencies**

Run: `cd /Users/adamharris/Documents/repos/lr-apps && pnpm install`
Expected: Clean install, `@repo/test-utils` available in workspace

- [ ] **Step 7: Add `@repo/test-utils` as devDependency to packages that need it**

Add to `packages/auth/package.json`, `packages/db/package.json`, and `apps/web/package.json` devDependencies:

```json
"@repo/test-utils": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 8: Commit**

```bash
git add packages/test-utils/ packages/auth/package.json packages/db/package.json apps/web/package.json pnpm-lock.yaml
git commit -m "feat(test-utils): add @repo/test-utils with mock Supabase, Auth0, and render helpers"
```

---

### Task 3: Expand `@repo/db` with Typed Query Helpers

**Files:**
- Modify: `packages/db/src/types.ts` — add Subscription table to Database type
- Create: `packages/db/src/queries.ts` — typed query helpers
- Create: `packages/db/src/__tests__/queries.test.ts`
- Modify: `packages/db/src/index.ts` — re-export queries
- Modify: `packages/db/package.json` — add test script, vitest, exports
- Create: `packages/db/vitest.config.ts`

- [ ] **Step 1: Add vitest config and test script to db package**

Create `packages/db/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Add to `packages/db/package.json`:

In `"scripts"`, add: `"test": "vitest run"`

In `"devDependencies"`, add: `"vitest": "^3"`, `"@repo/test-utils": "workspace:*"`

In `"exports"`, add: `"./queries": "./src/queries.ts"`

- [ ] **Step 2: Update Database type with subscriptions table**

Modify `packages/db/src/types.ts` — append after the `app_permissions` table definition:

```typescript
export type Permission = "view" | "edit" | "admin";

export interface AppPermission {
  id: string;
  user_id: string;
  app_slug: string;
  permission: Permission;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  tier: string;
  status: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      app_permissions: {
        Row: AppPermission;
        Insert: Omit<AppPermission, "id" | "created_at">;
        Update: Partial<Omit<AppPermission, "id">>;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Omit<SubscriptionRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SubscriptionRow, "id">>;
      };
    };
  };
}
```

- [ ] **Step 3: Write failing test for query helpers**

Create `packages/db/src/__tests__/queries.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAppPermission,
  upsertPermission,
  getUserSubscription,
} from "../queries";

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

vi.mock("../service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle,
            maybeSingle: mockMaybeSingle,
          }),
          single: mockSingle,
          maybeSingle: mockMaybeSingle,
        }),
      }),
      insert: mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
  })),
}));

describe("getAppPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns permission for valid user+slug", async () => {
    mockSingle.mockResolvedValue({
      data: { permission: "edit" },
      error: null,
    });

    const result = await getAppPermission("user-1", "command-center");
    expect(result).toBe("edit");
  });

  it("returns null when no permission exists", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const result = await getAppPermission("user-1", "nonexistent");
    expect(result).toBeNull();
  });
});

describe("upsertPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts a new permission row", async () => {
    mockSingle.mockResolvedValue({
      data: { user_id: "user-1", app_slug: "standup", permission: "view" },
      error: null,
    });

    const result = await upsertPermission("user-1", "standup", "view");
    expect(result).toEqual(
      expect.objectContaining({ permission: "view" }),
    );
  });
});

describe("getUserSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns subscription for user", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { tier: "pro", status: "active" },
      error: null,
    });

    const result = await getUserSubscription("user-1");
    expect(result?.tier).toBe("pro");
  });

  it("returns null when no subscription", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getUserSubscription("user-1");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/db && npx vitest run src/__tests__/queries.test.ts`
Expected: FAIL — `../queries` module not found

- [ ] **Step 5: Implement query helpers**

Create `packages/db/src/queries.ts`:

```typescript
import { createServiceRoleClient } from "./service-role";
import type { Permission, AppPermission, SubscriptionRow } from "./types";

export async function getAppPermission(
  userId: string,
  appSlug: string,
): Promise<Permission | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("app_permissions")
    .select("permission")
    .eq("user_id", userId)
    .eq("app_slug", appSlug)
    .single();

  if (error || !data) return null;
  return (data as { permission: Permission }).permission;
}

export async function upsertPermission(
  userId: string,
  appSlug: string,
  permission: Permission,
): Promise<AppPermission> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("app_permissions")
    .upsert(
      { user_id: userId, app_slug: appSlug, permission },
      { onConflict: "user_id,app_slug" },
    )
    .select()
    .single();

  if (error) throw new Error(`upsertPermission failed: ${error.message}`);
  return data as AppPermission;
}

export async function getUserSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select()
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SubscriptionRow;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/db && npx vitest run src/__tests__/queries.test.ts`
Expected: PASS

- [ ] **Step 7: Update index.ts to re-export queries**

Modify `packages/db/src/index.ts`:

```typescript
export { createClient as createServerClient } from "./server";
export { createMiddlewareClient } from "./middleware";
export { getAppPermission, upsertPermission, getUserSubscription } from "./queries";
export type { Database, AppPermission, Permission, SubscriptionRow } from "./types";
```

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add typed query helpers and subscriptions table type

Adds getAppPermission, upsertPermission, getUserSubscription to
replace raw .from().select().eq() chains across the codebase."
```

---

### Task 4: Update Auth Middleware for Universal Gate

**Files:**
- Modify: `apps/web/lib/require-app-layout-access.ts:9-13` — remove publicEntry bypass
- Create: `apps/web/lib/__tests__/require-app-layout-access.test.ts`

- [ ] **Step 1: Write failing test for new universal gate behavior**

Create `apps/web/lib/__tests__/require-app-layout-access.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn(),
}));

vi.mock("../app-registry", () => ({
  getAppBySlug: vi.fn((slug: string) => {
    const apps: Record<string, { slug: string; publicEntry?: boolean }> = {
      "command-center": { slug: "command-center" },
      "ai-calculator": { slug: "ai-calculator", publicEntry: true },
      "dad-jokes": { slug: "dad-jokes" },
    };
    return apps[slug] ?? undefined;
  }),
}));

import { requireAppLayoutAccess } from "../require-app-layout-access";
import { requireAccess } from "@repo/auth/server";

const mockRequireAccess = requireAccess as ReturnType<typeof vi.fn>;

describe("requireAppLayoutAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls requireAccess for standard auth-gated apps", async () => {
    await requireAppLayoutAccess("command-center");
    expect(mockRequireAccess).toHaveBeenCalledWith("command-center");
  });

  it("calls requireAccess even for publicEntry apps (universal gate)", async () => {
    await requireAppLayoutAccess("ai-calculator");
    expect(mockRequireAccess).toHaveBeenCalledWith("ai-calculator");
  });

  it("calls requireAccess for previously-public apps", async () => {
    await requireAppLayoutAccess("dad-jokes");
    expect(mockRequireAccess).toHaveBeenCalledWith("dad-jokes");
  });

  it("calls requireAccess for unknown slugs (defensive)", async () => {
    await requireAppLayoutAccess("unknown-app");
    expect(mockRequireAccess).toHaveBeenCalledWith("unknown-app");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run lib/__tests__/require-app-layout-access.test.ts`
Expected: FAIL — the `publicEntry` test should fail because current code skips requireAccess for publicEntry apps

- [ ] **Step 3: Update requireAppLayoutAccess to gate all apps**

Modify `apps/web/lib/require-app-layout-access.ts` to:

```typescript
import { requireAccess } from "@repo/auth/server";

/**
 * Layout-level gate: requires authentication for ALL apps.
 * Every app in the registry must have an authenticated user with permission.
 */
export async function requireAppLayoutAccess(appSlug: string) {
  await requireAccess(appSlug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run lib/__tests__/require-app-layout-access.test.ts`
Expected: PASS

- [ ] **Step 5: Run existing tests to verify no regressions**

Run: `cd apps/web && npx vitest run`
Expected: All existing tests pass (app-registry.test.ts, proxy-utils.test.ts, platform-urls.test.ts)

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/require-app-layout-access.ts apps/web/lib/__tests__/require-app-layout-access.test.ts
git commit -m "feat(auth): make requireAppLayoutAccess gate all apps universally

Removes publicEntry bypass so every app requires authentication at
the layout level. This is the foundation for M2's per-app rollout."
```

---

### Task 5: Extend App Registry with Billing Metadata

**Files:**
- Modify: `apps/web/lib/app-registry.ts:8-29` — add `tier` and `features` to AppConfig
- Modify: `apps/web/lib/app-registry.ts:31-77` — update all 29 entries with `tier: "free"`
- Modify: `apps/web/lib/__tests__/app-registry.test.ts` — add tests for new fields

- [ ] **Step 1: Write failing test for tier field**

Add to `apps/web/lib/__tests__/app-registry.test.ts`:

```typescript
it("every app has a valid tier", () => {
  const apps = getAllApps();
  const validTiers = ["free", "pro", "enterprise"];
  for (const app of apps) {
    expect(validTiers).toContain(app.tier);
  }
});

it("every app has a features object", () => {
  const apps = getAllApps();
  for (const app of apps) {
    expect(typeof app.features).toBe("object");
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run lib/__tests__/app-registry.test.ts`
Expected: FAIL — `tier` property does not exist on AppConfig

- [ ] **Step 3: Update AppConfig interface**

Modify `apps/web/lib/app-registry.ts` — update the AppConfig interface, adding after the `postEnrollPath` field:

```typescript
/** Billing tier for this app. Determines feature access. */
tier: "free" | "pro" | "enterprise";
/** Map of feature keys to the minimum tier required. */
features: Record<string, "free" | "pro" | "enterprise">;
```

- [ ] **Step 4: Update all app entries with default tier**

Add `tier: "free", features: {}` to every entry in the `apps` array. Example for the first few:

```typescript
const apps: AppConfig[] = [
  // Auth hub
  { slug: "auth", name: "Auth", subdomain: "auth", routeGroup: "(auth)", auth: false, permission: "view", template: "full", tier: "free", features: {} },

  // Consolidated
  { slug: "command-center", name: "Command Center", subdomain: "command-center", routeGroup: "apps/command-center", auth: true, permission: "view", template: "full", tier: "free", features: {} },
  { slug: "generations", name: "Generations", subdomain: "generations", routeGroup: "apps/generations", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },

  // ... repeat for ALL remaining entries — every entry gets tier: "free", features: {}
```

Every single entry in the array must have `tier: "free", features: {}` appended.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/web && npx vitest run lib/__tests__/app-registry.test.ts`
Expected: PASS — all tests including new tier/features tests

- [ ] **Step 6: Run full test suite**

Run: `cd /Users/adamharris/Documents/repos/lr-apps && pnpm test`
Expected: All tests across all packages pass

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/app-registry.ts apps/web/lib/__tests__/app-registry.test.ts
git commit -m "feat(registry): add tier and features fields to AppConfig

All apps default to tier: 'free' with empty features map.
Schema-only change — no runtime enforcement yet."
```

---

### Task 6: Add Stripe Env Vars to Turbo Config

**Files:**
- Modify: `turbo.json:3-18` — add Stripe env vars to globalEnv

- [ ] **Step 1: Update turbo.json globalEnv**

Add to the `globalEnv` array in `turbo.json`:

```json
"STRIPE_SECRET_KEY",
"STRIPE_WEBHOOK_SECRET",
"STRIPE_PUBLISHABLE_KEY"
```

- [ ] **Step 2: Commit**

```bash
git add turbo.json
git commit -m "chore: add Stripe env vars to turbo.json globalEnv"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full build**

Run: `cd /Users/adamharris/Documents/repos/lr-apps && pnpm build`
Expected: Build succeeds with no type errors

- [ ] **Step 2: Run full test suite**

Run: `cd /Users/adamharris/Documents/repos/lr-apps && pnpm test`
Expected: All tests pass across all packages

- [ ] **Step 3: Run typecheck**

Run: `cd /Users/adamharris/Documents/repos/lr-apps && pnpm typecheck`
Expected: No type errors

- [ ] **Step 4: Final commit if any fixes were needed**

Only if previous steps required fixes. Otherwise, M1 is complete.
