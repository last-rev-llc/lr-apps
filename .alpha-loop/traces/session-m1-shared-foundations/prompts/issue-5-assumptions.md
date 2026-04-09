You just implemented GitHub issue #5: Update auth middleware for universal gate

## Original Requirements
## Summary
Update `requireAppLayoutAccess()` to gate ALL apps by default, removing the `publicEntry` bypass. Add `publicRoutes` escape hatch for specific paths.

## Details
- Update `requireAppLayoutAccess()` to gate ALL apps by default (remove `publicEntry` bypass)
- Add `publicRoutes` escape hatch for specific paths (webhooks, marketing pages)
- Ensure redirect-after-login works for all 27 apps

## Acceptance Criteria
- [ ] `requireAppLayoutAccess()` calls `requireAccess()` for ALL apps regardless of `publicEntry` flag
- [ ] `publicEntry` bypass logic removed entirely
- [ ] `publicRoutes` escape hatch exists for webhook endpoints and marketing pages
- [ ] Redirect-after-login preserves the original app subdomain for all 27 apps
- [ ] Tests verify: standard apps gated, formerly-public apps gated, unknown slugs gated
- [ ] All existing tests continue to pass
- [ ] No regressions in proxy.ts routing

## Code Changes (first 5000 chars)
diff --git a/.env.compose b/.env.compose
new file mode 100644
index 0000000..d61b898
--- /dev/null
+++ b/.env.compose
@@ -0,0 +1 @@
+COMPOSE_PROJECT_NAME=lr-apps
diff --git a/apps/web/app/(auth)/(dashboard)/my-apps/page.tsx b/apps/web/app/(auth)/(dashboard)/my-apps/page.tsx
index 17eb79b..c0649d5 100644
--- a/apps/web/app/(auth)/(dashboard)/my-apps/page.tsx
+++ b/apps/web/app/(auth)/(dashboard)/my-apps/page.tsx
@@ -51,11 +51,11 @@ export default async function MyAppsPage() {
   const allApps = getAllApps().filter((app) => app.slug !== "auth");
   const myApps = allApps.filter(
     (app) =>
-      !app.auth || app.publicEntry || permMap.has(app.slug),
+      !app.auth || app.publicRoutes?.length || permMap.has(app.slug),
   );
   const otherApps = allApps.filter(
     (app) =>
-      app.auth && !app.publicEntry && !permMap.has(app.slug),
+      app.auth && !app.publicRoutes?.length && !permMap.has(app.slug),
   );
 
   return (
@@ -139,9 +139,9 @@ function AppTile({
                 {permMap.get(app.slug)}
               </Badge>
             ) : null}
-            {!locked && (!app.auth || app.publicEntry) ? (
+            {!locked && (!app.auth || app.publicRoutes?.length) ? (
               <Badge variant="outline" className="text-xs text-accent shrink-0">
-                {app.publicEntry && app.auth ? "open entry" : "public"}
+                {app.publicRoutes?.length && app.auth ? "open entry" : "public"}
               </Badge>
             ) : null}
           </div>
diff --git a/apps/web/app/apps/ai-calculator/layout.tsx b/apps/web/app/apps/ai-calculator/layout.tsx
index f637b88..e684755 100644
--- a/apps/web/app/apps/ai-calculator/layout.tsx
+++ b/apps/web/app/apps/ai-calculator/layout.tsx
@@ -1,4 +1,5 @@
 import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
+import { headers } from "next/headers";
 import type { ReactNode } from "react";
 
 export default async function AiCalculatorLayout({
@@ -6,7 +7,9 @@ export default async function AiCalculatorLayout({
 }: {
   children: ReactNode;
 }) {
-  await requireAppLayoutAccess("ai-calculator");
+  const h = await headers();
+  const pathname = h.get("x-app-pathname") ?? "/";
+  await requireAppLayoutAccess("ai-calculator", pathname);
 
   return (
     <div className="min-h-screen bg-gray-50">
diff --git a/apps/web/app/apps/command-center/architecture/components/architecture-app.tsx b/apps/web/app/apps/command-center/architecture/components/architecture-app.tsx
index 9c5e4e2..423613b 100644
--- a/apps/web/app/apps/command-center/architecture/components/architecture-app.tsx
+++ b/apps/web/app/apps/command-center/architecture/components/architecture-app.tsx
@@ -23,7 +23,7 @@ const ARCH_SECTIONS: ArchSection[] = [
       "apps/web — Next.js 15 App Router, primary application",
       "packages/ui — Shared component library (React + Tailwind)",
       "packages/db — Supabase client + server wrappers, type definitions",
-      "packages/auth — requireAccess; web uses requireAppLayoutAccess + AppConfig.publicEntry",
+      "packages/auth — requireAccess; web uses requireAppLayoutAccess + AppConfig.publicRoutes",
       "Turborepo remote caching via Vercel for fast CI builds",
     ],
     tags: ["turborepo", "next.js", "typescript"],
@@ -62,7 +62,7 @@ const ARCH_SECTIONS: ArchSection[] = [
     icon: "🔐",
     description: "Supabase Auth with per-app access control via app_permissions table.",
     details: [
-      "requireAppLayoutAccess + publicEntry for hybrid apps (e.g. ai-calculator landing → /calculator gated)",
+      "requireAppLayoutAccess + publicRoutes for hybrid apps (e.g. ai-calculator landing → /calculator gated)",
       "app_permissions table: user_id, app_slug, permission (view/edit/admin)",
       "Server-side auth checks via @repo/auth/server",
       "Session management handled by Supabase Auth helpers",
diff --git a/apps/web/lib/__tests__/app-registry.test.ts b/apps/web/lib/__tests__/app-registry.test.ts
index 58cd597..8440ace 100644
--- a/apps/web/lib/__tests__/app-registry.test.ts
+++ b/apps/web/lib/__tests__/app-registry.test.ts
@@ -3,6 +3,7 @@ import {
   getAppBySubdomain,
   getAppBySlug,
   getAllApps,
+  isPublicRoute,
   type AppConfig,
 } from "../app-registry";
 
@@ -52,9 +53,33 @@ describe("app-registry", () => {
     expect(app?.slug).toBe("meeting-summaries");
   });
 
-  it("marks public-entry apps for open URL access", () => {
+  it("ai-calculator declares publicRoutes containing '/'", () => {
     const calc = getAppBySlug("ai-calculator");
-    expect(calc?.publicEntry).toBe(true);
+    expect(calc?.publicRoutes).toContain("/");
     expect(calc?.postEnrollPath).toBe("calculator");
   });
+
+  describe("isPublicRoute", () => {
+    it("returns true for exact match on ai-calculator root", () => {
+      expect(isPublicRoute("ai-calculator", "/")).toBe(true);
+    });
+
+    it("returns false for non-public path on ai-calculator", () => {
+      expect(isPublicRoute("ai-calculator", "/calculator"

## Review Summary
All critical and warning issues fixed: stale publicEntry references in my-apps page and architecture display, missing x-app-pathname header in dev proxy path

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