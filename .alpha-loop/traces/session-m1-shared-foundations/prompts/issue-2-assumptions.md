You just implemented GitHub issue #2: Create  package

## Original Requirements
## Summary
Scaffold the `@repo/billing` package with Stripe customer creation, subscription management helpers, webhook handler, and `hasFeatureAccess()` server utility. This is infrastructure-only — no app-level gating or paywalls.

## Details
- Stripe customer creation and subscription management helpers
- Webhook handler at `/api/webhooks/stripe`
- `hasFeatureAccess(userId, feature)` server utility
- New `subscriptions` table via `@repo/db`
- No app-level gating — plumbing only

## Acceptance Criteria
- [ ] `packages/billing/` exists with `package.json`, `tsconfig.json`, `vitest.config.ts`
- [ ] `src/stripe-client.ts` — Stripe singleton with env var validation
- [ ] `src/customers.ts` — `getOrCreateCustomer(userId, email)` with tests
- [ ] `src/subscriptions.ts` — `upsertSubscription()` and `getSubscription(userId)` with tests
- [ ] `src/has-feature-access.ts` — tier hierarchy check (free < pro < enterprise) with tests
- [ ] `src/webhook-handler.ts` — handles `customer.subscription.created/updated/deleted` with tests
- [ ] `src/types.ts` — `Tier`, `Subscription`, `SubscriptionStatus`, `WebhookEvent` types
- [ ] `src/index.ts` barrel exports all public API
- [ ] All tests pass via `pnpm test --filter=@repo/billing`
- [ ] `subscriptions` table migration SQL documented in `supabase/migrations/`
- [ ] Stripe env vars added to `turbo.json` globalEnv

## Code Changes (first 5000 chars)
diff --git a/.env.compose b/.env.compose
new file mode 100644
index 0000000..d61b898
--- /dev/null
+++ b/.env.compose
@@ -0,0 +1 @@
+COMPOSE_PROJECT_NAME=lr-apps
diff --git a/.env.local.example b/.env.local.example
deleted file mode 100644
index 2641302..0000000
--- a/.env.local.example
+++ /dev/null
@@ -1,5 +0,0 @@
-# Supabase (required for Phase 2+)
-NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
-NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
-SUPABASE_PROJECT_ID=your-project-id
diff --git a/packages/billing/package.json b/packages/billing/package.json
new file mode 100644
index 0000000..fc182b5
--- /dev/null
+++ b/packages/billing/package.json
@@ -0,0 +1,27 @@
+{
+  "name": "@repo/billing",
+  "version": "0.0.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "test": "vitest run"
+  },
+  "exports": {
+    ".": "./src/index.ts",
+    "./stripe-client": "./src/stripe-client.ts",
+    "./customers": "./src/customers.ts",
+    "./subscriptions": "./src/subscriptions.ts",
+    "./has-feature-access": "./src/has-feature-access.ts",
+    "./webhook-handler": "./src/webhook-handler.ts",
+    "./types": "./src/types.ts"
+  },
+  "dependencies": {
+    "@repo/db": "workspace:*",
+    "stripe": "^17"
+  },
+  "devDependencies": {
+    "@repo/config": "workspace:*",
+    "typescript": "^5",
+    "vitest": "^3"
+  }
+}
diff --git a/packages/billing/src/customers.test.ts b/packages/billing/src/customers.test.ts
new file mode 100644
index 0000000..24dd2a6
--- /dev/null
+++ b/packages/billing/src/customers.test.ts
@@ -0,0 +1,62 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+
+const mockSingle = vi.fn();
+const mockEq = vi.fn(() => ({ single: mockSingle }));
+const mockSelect = vi.fn(() => ({ eq: mockEq }));
+const mockUpsert = vi.fn(() => ({ error: null }));
+const mockFrom = vi.fn((table: string) => ({
+  select: mockSelect,
+  upsert: mockUpsert,
+}));
+
+vi.mock("@repo/db/service-role", () => ({
+  createServiceRoleClient: () => ({ from: mockFrom }),
+}));
+
+const mockCustomersCreate = vi.fn();
+vi.mock("./stripe-client", () => ({
+  getStripe: () => ({
+    customers: { create: mockCustomersCreate },
+  }),
+}));
+
+import { getOrCreateCustomer } from "./customers";
+
+describe("getOrCreateCustomer", () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it("returns existing stripe_customer_id when subscription exists", async () => {
+    mockSingle.mockResolvedValue({
+      data: { stripe_customer_id: "cus_existing123" },
+    });
+
+    const result = await getOrCreateCustomer("user-1", "user@test.com");
+
+    expect(result).toBe("cus_existing123");
+    expect(mockCustomersCreate).not.toHaveBeenCalled();
+  });
+
+  it("creates a new Stripe customer and inserts subscription when none exists", async () => {
+    mockSingle.mockResolvedValue({ data: null });
+    mockCustomersCreate.mockResolvedValue({ id: "cus_new456" });
+
+    const result = await getOrCreateCustomer("user-2", "new@test.com");
+
+    expect(result).toBe("cus_new456");
+    expect(mockCustomersCreate).toHaveBeenCalledWith({
+      email: "new@test.com",
+      metadata: { userId: "user-2" },
+    });
+    expect(mockUpsert).toHaveBeenCalledWith(
+      {
+        user_id: "user-2",
+        stripe_customer_id: "cus_new456",
+        tier: "free",
+        status: "active",
+      },
+      { onConflict: "user_id" },
+    );
+  });
+});
diff --git a/packages/billing/src/customers.ts b/packages/billing/src/customers.ts
new file mode 100644
index 0000000..f2e461d
--- /dev/null
+++ b/packages/billing/src/customers.ts
@@ -0,0 +1,37 @@
+import { createServiceRoleClient } from "@repo/db/service-role";
+import { getStripe } from "./stripe-client";
+
+export async function getOrCreateCustomer(
+  userId: string,
+  email: string,
+): Promise<string> {
+  const db = createServiceRoleClient();
+
+  const { data: existing } = await db
+    .from("subscriptions")
+    .select("stripe_customer_id")
+    .eq("user_id", userId)
+    .single();
+
+  if (existing?.stripe_customer_id) {
+    return existing.stripe_customer_id;
+  }
+
+  const stripe = getStripe();
+  const customer = await stripe.customers.create({
+    email,
+    metadata: { userId },
+  });
+
+  await db.from("subscriptions").upsert(
+    {
+      user_id: userId,
+      stripe_customer_id: customer.id,
+      tier: "free",
+      status: "active",
+    },
+    { onConflict: "user_id" },
+  );
+
+  return customer.id;
+}
diff --git a/packages/billing/src/has-feature-access.test.ts b/packages/billing/src/has-feature-access.test.ts
new file mode 100644
index 0000000..66e04ee
--- /dev/null
+++ b/packages/billing/src/has-feature-access.test.ts
@@ -0,0 +1,47 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+
+const mockGetSubscription = vi.fn();
+vi.mock("./subscriptions", () => ({
+  getSubscription: (...args: unknown[]) => mockGetSubscription(...args),
+}));
+
+import { ha

## Review Summary
All acceptance criteria met. Fixed critical upsertSubscription bug where missing user_id would cause NOT NULL violations on webhook processing.

Analyze the implementation and list any assumptions or decisions you had to make where the requirements were ambiguous or incomplete. Output ONLY a markdown document with this structure:

## Assumptions
- (list each assumption made, e.g. "Assumed the date format should be ISO 8601 since it wasn't specified")
- If no assumptions were needed, write "None — requirements were fully specified"

## Decisions
- (list each design/implementation decision where multiple valid approaches existed, e.g. "Chose to validate on the server side rather than client side for security")
- If no notable decisions, write "None — implementation was straightforward"

## Items to Validate
- (list specific things the user should check, e.g. "Verify the error message wording matches your team's style guide")
- If nothing needs validation, write "None"

Keep it concise. Only include genuinely ambiguous items, not obvious implementation choices.