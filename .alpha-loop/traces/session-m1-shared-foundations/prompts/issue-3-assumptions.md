You just implemented GitHub issue #3: Add Vitest workspace config + shared test utilities

## Original Requirements
## Summary
Configure Vitest at monorepo root with workspace support and create `packages/test-utils` with mock helpers for Supabase, Auth0, and React rendering.

## Details
- Configure Vitest at monorepo root with workspace support
- Create `packages/test-utils` with helpers:
  - Mock Supabase client
  - Mock Auth0 session
  - `renderWithProviders()` wrapper
- Add `test` script to every package

## Acceptance Criteria
- [ ] `packages/test-utils/` exists with `package.json` and barrel exports
- [ ] `src/mock-supabase.ts` — chainable mock Supabase client with `createMockSupabase()`
- [ ] `src/mock-auth0.ts` — mock Auth0 session helper with `createMockAuth0()`
- [ ] `src/render-with-providers.tsx` — `renderWithProviders()` wrapper using `@testing-library/react`
- [ ] Every package in the workspace has a `test` script in `package.json`
- [ ] `pnpm test` from root runs all workspace tests via Turbo
- [ ] `@repo/test-utils` added as devDependency to packages that need it

## Code Changes (first 5000 chars)
diff --git a/.env.compose b/.env.compose
new file mode 100644
index 0000000..d61b898
--- /dev/null
+++ b/.env.compose
@@ -0,0 +1 @@
+COMPOSE_PROJECT_NAME=lr-apps
diff --git a/apps/web/package.json b/apps/web/package.json
index 0d7dd2a..bca1a32 100644
--- a/apps/web/package.json
+++ b/apps/web/package.json
@@ -25,6 +25,7 @@
   },
   "devDependencies": {
     "@repo/config": "workspace:*",
+    "@repo/test-utils": "workspace:*",
     "@tailwindcss/postcss": "^4",
     "@types/node": "^22",
     "@types/react": "^19",
diff --git a/packages/auth/package.json b/packages/auth/package.json
index 1a5aad2..fa79ccf 100644
--- a/packages/auth/package.json
+++ b/packages/auth/package.json
@@ -24,6 +24,7 @@
   },
   "devDependencies": {
     "@repo/config": "workspace:*",
+    "@repo/test-utils": "workspace:*",
     "@types/react": "^19",
     "next": "^16",
     "typescript": "^5",
diff --git a/packages/config/package.json b/packages/config/package.json
index 35e7b68..153af1c 100644
--- a/packages/config/package.json
+++ b/packages/config/package.json
@@ -2,6 +2,9 @@
   "name": "@repo/config",
   "version": "0.0.0",
   "private": true,
+  "scripts": {
+    "test": "echo no tests"
+  },
   "exports": {
     "./tsconfig/base": "./tsconfig/base.json",
     "./tsconfig/nextjs": "./tsconfig/nextjs.json",
diff --git a/packages/db/package.json b/packages/db/package.json
index 1070a33..6b043fb 100644
--- a/packages/db/package.json
+++ b/packages/db/package.json
@@ -3,6 +3,9 @@
   "version": "0.0.0",
   "private": true,
   "type": "module",
+  "scripts": {
+    "test": "vitest run --passWithNoTests"
+  },
   "exports": {
     ".": "./src/index.ts",
     "./server": "./src/server.ts",
@@ -20,7 +23,9 @@
   },
   "devDependencies": {
     "@repo/config": "workspace:*",
+    "@repo/test-utils": "workspace:*",
     "next": "^16",
-    "typescript": "^5"
+    "typescript": "^5",
+    "vitest": "^3"
   }
 }
diff --git a/packages/test-utils/package.json b/packages/test-utils/package.json
new file mode 100644
index 0000000..30c8759
--- /dev/null
+++ b/packages/test-utils/package.json
@@ -0,0 +1,27 @@
+{
+  "name": "@repo/test-utils",
+  "version": "0.0.0",
+  "private": true,
+  "type": "module",
+  "exports": {
+    ".": "./src/index.ts"
+  },
+  "scripts": {
+    "test": "vitest run"
+  },
+  "dependencies": {
+    "@supabase/supabase-js": "^2",
+    "@testing-library/react": "^16",
+    "@testing-library/jest-dom": "^6",
+    "react": "^19",
+    "react-dom": "^19"
+  },
+  "devDependencies": {
+    "@repo/config": "workspace:*",
+    "@types/react": "^19",
+    "@types/react-dom": "^19",
+    "jsdom": "^26",
+    "typescript": "^5",
+    "vitest": "^3"
+  }
+}
diff --git a/packages/test-utils/src/__tests__/mock-auth0.test.ts b/packages/test-utils/src/__tests__/mock-auth0.test.ts
new file mode 100644
index 0000000..53a71ab
--- /dev/null
+++ b/packages/test-utils/src/__tests__/mock-auth0.test.ts
@@ -0,0 +1,73 @@
+import { describe, it, expect } from "vitest";
+import { createMockAuth0, createMockAuth0Client } from "../mock-auth0";
+
+describe("createMockAuth0", () => {
+  it("returns a valid session with defaults", () => {
+    const session = createMockAuth0();
+
+    expect(session.user.sub).toBe("auth0|test-user-id");
+    expect(session.user.email).toBe("test@example.com");
+    expect(session.user.name).toBe("Test User");
+    expect(session.user.email_verified).toBe(true);
+    expect(session.accessToken).toBe("mock-access-token");
+    expect(session.idToken).toBe("mock-id-token");
+  });
+
+  it("accepts top-level overrides", () => {
+    const session = createMockAuth0({
+      accessToken: "custom-token",
+    });
+
+    expect(session.accessToken).toBe("custom-token");
+    // Other fields remain defaults
+    expect(session.user.email).toBe("test@example.com");
+  });
+
+  it("deep-merges user overrides", () => {
+    const session = createMockAuth0({
+      user: { email: "custom@example.com", org_id: "org_123" },
+    });
+
+    expect(session.user.email).toBe("custom@example.com");
+    expect(session.user.org_id).toBe("org_123");
+    // Other user fields remain defaults
+    expect(session.user.sub).toBe("auth0|test-user-id");
+    expect(session.user.name).toBe("Test User");
+  });
+});
+
+describe("createMockAuth0Client", () => {
+  it("returns a client with vi.fn() stubs", () => {
+    const client = createMockAuth0Client();
+
+    expect(client.getSession).toBeDefined();
+    expect(client.getAccessToken).toBeDefined();
+    expect(client.handleAuth).toBeDefined();
+  });
+
+  it("getSession resolves to a valid session", async () => {
+    const client = createMockAuth0Client();
+    const session = await client.getSession();
+
+    expect(session.user.sub).toBe("auth0|test-user-id");
+    expect(session.accessToken).toBe("mock-access-token");
+  });
+
+  it("applies session overrides to the client", async () => {
+    const client = createMockAuth0Client({
+      user: { email: "admin@example.com" },
+    });
+
+

## Review Summary
All acceptance criteria met — test-utils package complete with mock helpers, barrel exports, tests passing, and test scripts wired across all packages.

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