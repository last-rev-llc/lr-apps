You just implemented GitHub issue #11: Extend app registry with billing metadata

## Original Requirements
## Summary
Add `tier` and `features` fields to `AppConfig` in `apps/web/lib/app-registry.ts` to support future billing integration. Schema-only change — no runtime enforcement.

## Details
- Add `tier: "free" | "pro" | "enterprise"` to `AppConfig` interface
- Add `features: Record<string, "free" | "pro" | "enterprise">` field
- Update all 27+ registry entries with default `tier: "free"` and `features: {}`
- Update existing registry tests to validate new fields

## Acceptance Criteria
- [ ] `AppConfig` interface includes `tier` and `features` fields
- [ ] Every app entry in the registry has `tier: "free"` and `features: {}`
- [ ] Tests verify every app has a valid tier value
- [ ] Tests verify every app has a features object
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes

## Code Changes (first 5000 chars)
diff --git a/.env.compose b/.env.compose
new file mode 100644
index 0000000..d61b898
--- /dev/null
+++ b/.env.compose
@@ -0,0 +1 @@
+COMPOSE_PROJECT_NAME=lr-apps
diff --git a/apps/web/lib/__tests__/app-registry.test.ts b/apps/web/lib/__tests__/app-registry.test.ts
index 58cd597..128fd6a 100644
--- a/apps/web/lib/__tests__/app-registry.test.ts
+++ b/apps/web/lib/__tests__/app-registry.test.ts
@@ -57,4 +57,20 @@ describe("app-registry", () => {
     expect(calc?.publicEntry).toBe(true);
     expect(calc?.postEnrollPath).toBe("calculator");
   });
+
+  it("every app has a valid tier value", () => {
+    const apps = getAllApps();
+    const validTiers = ["free", "pro", "enterprise"];
+    for (const app of apps) {
+      expect(validTiers).toContain(app.tier);
+    }
+  });
+
+  it("every app has a features object", () => {
+    const apps = getAllApps();
+    for (const app of apps) {
+      expect(typeof app.features).toBe("object");
+      expect(app.features).not.toBeNull();
+    }
+  });
 });
diff --git a/apps/web/lib/app-registry.ts b/apps/web/lib/app-registry.ts
index 911bf78..c6b7aca 100644
--- a/apps/web/lib/app-registry.ts
+++ b/apps/web/lib/app-registry.ts
@@ -26,28 +26,32 @@ export interface AppConfig {
    * the app root (hybrid: public landing at root, gated tool on a subpath).
    */
   postEnrollPath?: string;
+  /** Billing tier required to access this app. */
+  tier: "free" | "pro" | "enterprise";
+  /** Per-feature billing tier overrides. */
+  features: Record<string, "free" | "pro" | "enterprise">;
 }
 
 const apps: AppConfig[] = [
   // Auth hub
-  { slug: "auth", name: "Auth", subdomain: "auth", routeGroup: "(auth)", auth: false, permission: "view", template: "full" },
+  { slug: "auth", name: "Auth", subdomain: "auth", routeGroup: "(auth)", auth: false, permission: "view", template: "full", tier: "free", features: {} },
 
   // Consolidated
-  { slug: "command-center", name: "Command Center", subdomain: "command-center", routeGroup: "apps/command-center", auth: true, permission: "view", template: "full" },
-  { slug: "generations", name: "Generations", subdomain: "generations", routeGroup: "apps/generations", auth: true, permission: "view", template: "minimal" },
+  { slug: "command-center", name: "Command Center", subdomain: "command-center", routeGroup: "apps/command-center", auth: true, permission: "view", template: "full", tier: "free", features: {} },
+  { slug: "generations", name: "Generations", subdomain: "generations", routeGroup: "apps/generations", auth: true, permission: "view", template: "minimal", tier: "free", features: {} },
 
   // Standalone — full (auth required)
-  { slug: "accounts", name: "Accounts", subdomain: "accounts", routeGroup: "apps/accounts", auth: true, permission: "view", template: "full" },
-  { slug: "sentiment", name: "Sentiment", subdomain: "sentiment", routeGroup: "apps/sentiment", auth: true, permission: "view", template: "full" },
-  { slug: "meeting-summaries", name: "Meeting Summaries", subdomain: "meetings", routeGroup: "apps/meeting-summaries", auth: true, permission: "view", template: "full" },
-  { slug: "uptime", name: "Uptime", subdomain: "uptime", routeGroup: "apps/uptime", auth: true, permission: "view", template: "full" },
-  { slug: "standup", name: "Standup", subdomain: "standup", routeGroup: "apps/standup", auth: true, permission: "view", template: "full" },
-  { slug: "sprint-planning", name: "Sprint Planning", subdomain: "sprint", routeGroup: "apps/sprint-planning", auth: true, permission: "view", template: "full" },
-  { slug: "sales", name: "Sales", subdomain: "sales", routeGroup: "apps/sales", auth: true, permission: "view", template: "full" },
-  { slug: "daily-updates", name: "Daily Updates", subdomain: "updates", routeGroup: "apps/daily-updates", auth: true, permission: "view", template: "full" },
-  { slug: "summaries", name: "Summaries", subdomain: "summaries", routeGroup: "apps/summaries", auth: true, permission: "view", template: "full" },
-  { slug: "lighthouse", name: "Lighthouse", subdomain: "lighthouse", routeGroup: "apps/lighthouse", auth: true, permission: "view", template: "full" },
-  { slug: "slang-translator", name: "Slang Translator", subdomain: "slang", routeGroup: "apps/slang-translator", auth: true, permission: "view", template: "minimal" },
+  { slug: "accounts", name: "Accounts", subdomain: "accounts", routeGroup: "apps/accounts", auth: true, permission: "view", template: "full", tier: "free", features: {} },
+  { slug: "sentiment", name: "Sentiment", subdomain: "sentiment", routeGroup: "apps/sentiment", auth: true, permission: "view", template: "full", tier: "free", features: {} },
+  { slug: "meeting-summaries", name: "Meeting Summaries", subdomain: "meetings", routeGroup: "apps/meeting-summaries", auth: true, permission: "view", template: "full", tier: "free", features: {} },
+  { slug: "uptime", name: "Uptime", subdomain: "uptime", routeGroup: "apps/uptime", auth: true, permission: "view", template: "

## Review Summary
All acceptance criteria met: AppConfig extended with tier/features, all 29 entries updated, tests pass, typecheck passes

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