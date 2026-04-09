You just implemented GitHub issue #7: Auth gate: Lighthouse

## Original Requirements
## Summary
Add authentication gate to the Lighthouse app. Update layout and registry.

## Acceptance Criteria
- [ ] `layout.tsx` calls `requireAppLayoutAccess("lighthouse")`
- [ ] App registry entry updated: `auth: true`
- [ ] Test: unauthenticated request redirects to `/login`
- [ ] Test: authenticated user without permission redirects to `/unauthorized`
- [ ] Smoke test: authenticated user with permission can access the app

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/area-52/__tests__/layout.test.tsx b/apps/web/app/apps/area-52/__tests__/layout.test.tsx
new file mode 100644
index 0000000..ca8b00f
--- /dev/null
+++ b/apps/web/app/apps/area-52/__tests__/layout.test.tsx
@@ -0,0 +1,52 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+
+vi.mock("@/lib/require-app-layout-access", () => ({
+  requireAppLayoutAccess: vi.fn(),
+}));
+
+import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
+
+const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);
+
+beforeEach(() => {
+  vi.clearAllMocks();
+});
+
+// Import the raw module to call the default export without JSX evaluation
+async function callLayout() {
+  const mod = await import("../layout");
+  return mod.default({ children: "test" as any });
+}
+
+describe("Area52Layout", () => {
+  it("calls requireAppLayoutAccess with 'area-52'", async () => {
+    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
+    await callLayout();
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("area-52");
+  });
+
+  it("redirects unauthenticated user to /login", async () => {
+    const redirectError = new Error("NEXT_REDIRECT");
+    (redirectError as any).digest = "NEXT_REDIRECT;/login";
+    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);
+
+    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("area-52");
+  });
+
+  it("redirects unauthorized user to /unauthorized", async () => {
+    const redirectError = new Error("NEXT_REDIRECT");
+    (redirectError as any).digest = "NEXT_REDIRECT;/unauthorized";
+    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);
+
+    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("area-52");
+  });
+
+  it("renders children for authenticated user with permission", async () => {
+    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
+    const result = await callLayout();
+    expect(result).toBeTruthy();
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("area-52");
+  });
+});
diff --git a/apps/web/app/apps/area-52/layout.tsx b/apps/web/app/apps/area-52/layout.tsx
index d3d3442..608983a 100644
--- a/apps/web/app/apps/area-52/layout.tsx
+++ b/apps/web/app/apps/area-52/layout.tsx
@@ -1,3 +1,4 @@
+import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
 import type { ReactNode } from "react";
 
 export const metadata = {
@@ -9,6 +10,12 @@ export const viewport = {
   themeColor: "#22c55e",
 };
 
-export default function Area52Layout({ children }: { children: ReactNode }) {
-  return <>{children}</>;
+export default async function Area52Layout({
+  children,
+}: {
+  children: ReactNode;
+}) {
+  await requireAppLayoutAccess("area-52");
+
+  return children;
 }
diff --git a/apps/web/app/apps/lighthouse/__tests__/layout.test.tsx b/apps/web/app/apps/lighthouse/__tests__/layout.test.tsx
new file mode 100644
index 0000000..d6ef368
--- /dev/null
+++ b/apps/web/app/apps/lighthouse/__tests__/layout.test.tsx
@@ -0,0 +1,52 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+
+vi.mock("@/lib/require-app-layout-access", () => ({
+  requireAppLayoutAccess: vi.fn(),
+}));
+
+import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
+
+const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);
+
+beforeEach(() => {
+  vi.clearAllMocks();
+});
+
+// Import the raw module to call the default export without JSX evaluation
+async function callLayout() {
+  const mod = await import("../layout");
+  return mod.default({ children: "test" as any });
+}
+
+describe("LighthouseLayout", () => {
+  it("calls requireAppLayoutAccess with 'lighthouse'", async () => {
+    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
+    await callLayout();
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("lighthouse");
+  });
+
+  it("redirects unauthenticated user to /login", async () => {
+    const redirectError = new Error("NEXT_REDIRECT");
+    (redirectError as any).digest = "NEXT_REDIRECT;/login";
+    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);
+
+    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("lighthouse");
+  });
+
+  it("redirects unauthorized user to /unauthorized", async () => {
+    const redirectError = new Error("NEXT_REDIRECT");
+    (redirectError as any).digest = "NEXT_REDIRECT;/unauthorized";
+    mockRequireAppLayoutAccess.mockRejectedValueOnce(redirectError);
+
+    await expect(callLayout()).rejects.toThrow("NEXT_REDIRECT");
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("lighthouse");
+  });
+
+  it("renders children for authenticated user with permission", async () => {
+    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
+ 

## Review Summary
All acceptance criteria met: layout calls requireAppLayoutAccess('lighthouse'), registry has auth:true, and all redirect/access tests pass.

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