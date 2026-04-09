You just implemented GitHub issue #8: Update login/signup flows for universal auth

## Original Requirements
## Summary
Update the auth hub login/signup flows to support universal auth gate. Ensure redirect-after-login works for all 27 apps, update unauthorized page, and add self-enroll support.

## Acceptance Criteria
- [ ] Redirect-after-login preserves original app subdomain for all 27 apps
- [ ] Unauthorized page shows the app name and a "request access" CTA
- [ ] Self-enroll support: apps in `APP_SELF_ENROLL_SLUGS` auto-grant `view` on first login
- [ ] `APP_SELF_ENROLL_SLUGS` env var documented and configurable
- [ ] Login flow handles edge cases: expired sessions, invalid redirects, unknown apps
- [ ] Signup flow redirects to my-apps after email confirmation
- [ ] All 14 already-gated apps have registry entry updated to `auth: true`

## Code Changes (first 5000 chars)
diff --git a/.env.compose b/.env.compose
index d61b898..3d9b0bb 100644
--- a/.env.compose
+++ b/.env.compose
@@ -1 +1,6 @@
 COMPOSE_PROJECT_NAME=lr-apps
+
+# Self-enroll: comma-separated app slugs that auto-grant "view" permission on
+# first login. Example: command-center,generations,sentiment
+# When unset in NODE_ENV=development, ALL slugs are allowed (local dev fallback).
+# APP_SELF_ENROLL_SLUGS=
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
+    expect(mockRequireAppLayoutAccess).toHave

## Review Summary
Two critical security/correctness issues found and fixed; implementation now covers all acceptance criteria

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