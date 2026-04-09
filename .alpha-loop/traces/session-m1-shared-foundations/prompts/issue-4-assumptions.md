You just implemented GitHub issue #4: Expand  with typed query helpers

## Original Requirements
## Summary
Add typed query helpers to `@repo/db` to replace raw `.from().select().eq()` chains across the codebase.

## Details
- `getAppPermission(userId, slug)` — replaces raw `.from("app_permissions").select()` chains
- `getUserSubscription(userId)` — for billing package consumption
- `upsertPermission()` — for self-enroll and admin flows
- Typed return types for all helpers

## Acceptance Criteria
- [ ] `packages/db/src/queries.ts` exists with typed query helpers
- [ ] `getAppPermission(userId, slug)` returns `Permission | null`
- [ ] `getUserSubscription(userId)` returns `SubscriptionRow | null`
- [ ] `upsertPermission(userId, appSlug, permission)` returns `AppPermission`
- [ ] `SubscriptionRow` type added to `packages/db/src/types.ts`
- [ ] `Database` interface updated with `subscriptions` table
- [ ] Tests in `packages/db/src/__tests__/queries.test.ts` cover all helpers
- [ ] Queries re-exported from `packages/db/src/index.ts`
- [ ] `vitest.config.ts` and `test` script added to `packages/db/package.json`

## Code Changes (first 5000 chars)
diff --git a/.env.compose b/.env.compose
new file mode 100644
index 0000000..d61b898
--- /dev/null
+++ b/.env.compose
@@ -0,0 +1 @@
+COMPOSE_PROJECT_NAME=lr-apps
diff --git a/packages/db/package.json b/packages/db/package.json
index 1070a33..dfe267d 100644
--- a/packages/db/package.json
+++ b/packages/db/package.json
@@ -3,6 +3,9 @@
   "version": "0.0.0",
   "private": true,
   "type": "module",
+  "scripts": {
+    "test": "vitest run"
+  },
   "exports": {
     ".": "./src/index.ts",
     "./server": "./src/server.ts",
@@ -21,6 +24,7 @@
   "devDependencies": {
     "@repo/config": "workspace:*",
     "next": "^16",
-    "typescript": "^5"
+    "typescript": "^5",
+    "vitest": "^3"
   }
 }
diff --git a/packages/db/src/__tests__/queries.test.ts b/packages/db/src/__tests__/queries.test.ts
new file mode 100644
index 0000000..0cdb0ae
--- /dev/null
+++ b/packages/db/src/__tests__/queries.test.ts
@@ -0,0 +1,119 @@
+import { describe, it, expect, vi } from "vitest";
+import { getAppPermission, getUserSubscription, upsertPermission } from "../queries";
+import type { SupabaseClient } from "@supabase/supabase-js";
+import type { Database, AppPermission, SubscriptionRow } from "../types";
+
+function mockClient(result: { data: unknown; error: unknown }) {
+  const chain = {
+    from: vi.fn().mockReturnThis(),
+    select: vi.fn().mockReturnThis(),
+    eq: vi.fn().mockReturnThis(),
+    maybeSingle: vi.fn().mockResolvedValue(result),
+    upsert: vi.fn().mockReturnThis(),
+    single: vi.fn().mockResolvedValue(result),
+  };
+  return chain as unknown as SupabaseClient<Database>;
+}
+
+describe("getAppPermission", () => {
+  it("returns permission when found", async () => {
+    const client = mockClient({ data: { permission: "edit" }, error: null });
+    const result = await getAppPermission(client, "user-1", "command-center");
+    expect(result).toBe("edit");
+  });
+
+  it("returns null when no row found", async () => {
+    const client = mockClient({ data: null, error: null });
+    const result = await getAppPermission(client, "user-1", "unknown-app");
+    expect(result).toBeNull();
+  });
+
+  it("throws on error", async () => {
+    const client = mockClient({ data: null, error: new Error("db error") });
+    await expect(getAppPermission(client, "user-1", "app")).rejects.toThrow("db error");
+  });
+
+  it("calls correct table and filters", async () => {
+    const client = mockClient({ data: { permission: "view" }, error: null });
+    await getAppPermission(client, "user-1", "my-app");
+
+    expect(client.from).toHaveBeenCalledWith("app_permissions");
+    expect(client.select).toHaveBeenCalledWith("permission");
+    expect(client.eq).toHaveBeenCalledWith("user_id", "user-1");
+    expect(client.eq).toHaveBeenCalledWith("app_slug", "my-app");
+  });
+});
+
+describe("getUserSubscription", () => {
+  const mockSub: SubscriptionRow = {
+    id: "sub-1",
+    user_id: "user-1",
+    stripe_customer_id: "cus_123",
+    stripe_subscription_id: "sub_123",
+    status: "active",
+    plan: "pro",
+    current_period_start: "2026-01-01T00:00:00Z",
+    current_period_end: "2026-02-01T00:00:00Z",
+    created_at: "2026-01-01T00:00:00Z",
+    updated_at: "2026-01-01T00:00:00Z",
+  };
+
+  it("returns subscription when found", async () => {
+    const client = mockClient({ data: mockSub, error: null });
+    const result = await getUserSubscription(client, "user-1");
+    expect(result).toEqual(mockSub);
+  });
+
+  it("returns null when no subscription", async () => {
+    const client = mockClient({ data: null, error: null });
+    const result = await getUserSubscription(client, "user-1");
+    expect(result).toBeNull();
+  });
+
+  it("throws on error", async () => {
+    const client = mockClient({ data: null, error: new Error("timeout") });
+    await expect(getUserSubscription(client, "user-1")).rejects.toThrow("timeout");
+  });
+
+  it("calls correct table and filter", async () => {
+    const client = mockClient({ data: mockSub, error: null });
+    await getUserSubscription(client, "user-1");
+
+    expect(client.from).toHaveBeenCalledWith("subscriptions");
+    expect(client.select).toHaveBeenCalledWith("*");
+    expect(client.eq).toHaveBeenCalledWith("user_id", "user-1");
+  });
+});
+
+describe("upsertPermission", () => {
+  const mockRow: AppPermission = {
+    id: "perm-1",
+    user_id: "user-1",
+    app_slug: "my-app",
+    permission: "admin",
+    created_at: "2026-01-01T00:00:00Z",
+  };
+
+  it("returns upserted permission", async () => {
+    const client = mockClient({ data: mockRow, error: null });
+    const result = await upsertPermission(client, "user-1", "my-app", "admin");
+    expect(result).toEqual(mockRow);
+  });
+
+  it("throws on error", async () => {
+    const client = mockClient({ data: null, error: new Error("conflict") });
+    await expect(upsertPermission(client, "user-1", "app", "view")).rejects.toThrow("conflict");
+  });
+
+  it("calls upsert with correct paylo

## Review Summary
All acceptance criteria met; typed query helpers are correct, well-tested (11/11 pass), and properly exported.

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