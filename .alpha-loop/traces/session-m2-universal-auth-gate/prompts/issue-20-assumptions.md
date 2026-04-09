You just implemented GitHub issue #20: Auth gate: Roblox Dances

## Original Requirements
## Summary
Add authentication gate to the Roblox Dances app so it requires login.

## Details
- Update `apps/web/app/apps/roblox-dances/layout.tsx` to call `requireAppLayoutAccess("roblox-dances")`
- Update app registry entry: set `auth: true`
- Add smoke tests for auth behavior

## Acceptance Criteria
- [ ] `layout.tsx` calls `requireAppLayoutAccess("roblox-dances")`
- [ ] App registry entry has `auth: true`
- [ ] Test: unauthenticated request redirects to `/login`
- [ ] Test: authenticated user without permission redirects to `/unauthorized`
- [ ] `pnpm test` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/(auth)/(forms)/login/login-form.tsx b/apps/web/app/(auth)/(forms)/login/login-form.tsx
index 396d48c..42df8ec 100644
--- a/apps/web/app/(auth)/(forms)/login/login-form.tsx
+++ b/apps/web/app/(auth)/(forms)/login/login-form.tsx
@@ -5,9 +5,11 @@ import { Button } from "@repo/ui";
 export function LoginForm({
   loginHref,
   error,
+  redirectSlug,
 }: {
   loginHref: string;
   error?: string;
+  redirectSlug?: string;
 }) {
   return (
     <div>
@@ -22,7 +24,9 @@ export function LoginForm({
         <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
           {error === "forbidden"
             ? "You do not have access to that app."
-            : error}
+            : error === "session_expired"
+              ? "Your session expired — please sign in again."
+              : error}
         </div>
       )}
 
@@ -32,7 +36,10 @@ export function LoginForm({
 
       <p className="text-sm text-muted-foreground text-center mt-6">
         New here?{" "}
-        <a href="/signup" className="text-accent hover:underline">
+        <a
+          href={redirectSlug ? `/signup?redirect=${encodeURIComponent(redirectSlug)}` : "/signup"}
+          className="text-accent hover:underline"
+        >
           Create an account
         </a>
       </p>
diff --git a/apps/web/app/(auth)/(forms)/login/page.tsx b/apps/web/app/(auth)/(forms)/login/page.tsx
index 49f8a1d..e250978 100644
--- a/apps/web/app/(auth)/(forms)/login/page.tsx
+++ b/apps/web/app/(auth)/(forms)/login/page.tsx
@@ -16,5 +16,11 @@ export default async function LoginPage({
     redirectSlug: params.redirect,
   });
 
-  return <LoginForm loginHref={loginHref} error={params.error} />;
+  return (
+    <LoginForm
+      loginHref={loginHref}
+      error={params.error}
+      redirectSlug={params.redirect}
+    />
+  );
 }
diff --git a/apps/web/app/(auth)/(forms)/unauthorized/page.tsx b/apps/web/app/(auth)/(forms)/unauthorized/page.tsx
index e3cea29..b432412 100644
--- a/apps/web/app/(auth)/(forms)/unauthorized/page.tsx
+++ b/apps/web/app/(auth)/(forms)/unauthorized/page.tsx
@@ -49,7 +49,11 @@ export default async function UnauthorizedPage({
   return (
     <div className="text-center max-w-md mx-auto">
       <h1 className="font-heading text-2xl text-accent mb-2">
-        {signedIn ? "Access required" : "Sign in or sign up"}
+        {signedIn
+          ? app
+            ? `Access required — ${app.name}`
+            : "Access required"
+          : "Sign in or sign up"}
       </h1>
 
       {error === "closed" && (
@@ -97,7 +101,7 @@ export default async function UnauthorizedPage({
           <form action={requestAppAccess}>
             <input type="hidden" name="app" value={appSlug} />
             <Button type="submit" className="w-full">
-              Get access
+              Request access
             </Button>
           </form>
         )}
@@ -135,9 +139,9 @@ export default async function UnauthorizedPage({
 
       {signedIn && appSlug && !canRequestAccess && !gate && error !== "closed" ? (
         <p className="text-xs text-muted-foreground mt-6">
-          Self-service access is off for this app in this environment. Ask an
-          admin to add your account in{" "}
-          <code className="bg-muted px-1 rounded">app_permissions</code>.
+          Self-service access is not available for{" "}
+          {app ? app.name : "this app"}. Please contact a Last Rev admin to
+          request access.
         </p>
       ) : null}
     </div>
diff --git a/apps/web/app/apps/age-of-apes/__tests__/layout.test.tsx b/apps/web/app/apps/age-of-apes/__tests__/layout.test.tsx
new file mode 100644
index 0000000..ffe0575
--- /dev/null
+++ b/apps/web/app/apps/age-of-apes/__tests__/layout.test.tsx
@@ -0,0 +1,64 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+
+// Provide React globally for JSX in the layout under test
+import React from "react";
+globalThis.React = React;
+
+vi.mock("@/lib/require-app-layout-access", () => ({
+  requireAppLayoutAccess: vi.fn(),
+}));
+
+vi.mock("next/link", () => ({
+  default: ({ children }: { children: React.ReactNode }) =>
+    React.createElement("a", null, children),
+}));
+
+vi.mock("../lib/calculators", () => ({
+  CALCULATORS: [],
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
+async function callLayout() {
+  const mod = await import("../layout");
+  return mod.default({ children: "test" as any });
+}
+
+describe("AgeOfApesLayout", () => {
+  it("calls requireAppLayoutAccess with 'age-of-apes'", async () => {
+    mockRequireAppLayoutAccess.mockResolvedValueOnce(undefined);
+    await callLayout();
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("age-of-apes");
+  });
+
+  it("redirects unauthenticated user to /login", async () => {
+    const redirectError =

## Review Summary
Auth gate for Roblox Dances correctly implemented — layout calls requireAppLayoutAccess, registry has auth: true, all 4 smoke tests pass, pnpm test green.

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