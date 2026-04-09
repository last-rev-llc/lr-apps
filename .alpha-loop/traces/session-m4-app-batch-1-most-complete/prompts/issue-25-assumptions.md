You just implemented GitHub issue #25: Command Center: app-specific tests

## Original Requirements
## Summary
Add test coverage for Command Center hub page and shared module chrome.

## Details
- Test hub page rendering with mock Supabase data
- Test module navigation and routing
- Test auth gate redirect behavior
- Use `@repo/test-utils` for mock setup

## Acceptance Criteria
- [ ] Test: hub page renders module cards with correct data
- [ ] Test: sidebar navigation renders all module links
- [ ] Test: unauthenticated user redirects to login
- [ ] Test: user without permission redirects to unauthorized
- [ ] All tests use `@repo/test-utils` helpers
- [ ] `pnpm test` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/command-center/__tests__/layout.test.tsx b/apps/web/app/apps/command-center/__tests__/layout.test.tsx
new file mode 100644
index 0000000..c1a0bbd
--- /dev/null
+++ b/apps/web/app/apps/command-center/__tests__/layout.test.tsx
@@ -0,0 +1,127 @@
+// @vitest-environment jsdom
+import React from "react";
+import { describe, it, expect, vi, beforeEach } from "vitest";
+import { renderWithProviders, screen } from "@repo/test-utils";
+
+vi.mock("@/lib/require-app-layout-access", () => ({
+  requireAppLayoutAccess: vi.fn(),
+}));
+
+vi.mock("next/link", () => ({
+  default: ({
+    href,
+    children,
+    ...props
+  }: {
+    href: string;
+    children: React.ReactNode;
+    className?: string;
+  }) => (
+    <a href={href} {...props}>
+      {children}
+    </a>
+  ),
+}));
+
+import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
+import CommandCenterLayout from "../layout";
+
+const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);
+
+beforeEach(() => {
+  vi.clearAllMocks();
+  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
+});
+
+describe("CommandCenterLayout", () => {
+  it("calls requireAppLayoutAccess with 'command-center'", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>child content</div>,
+    });
+    renderWithProviders(jsx);
+
+    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("command-center");
+  });
+
+  it("renders children when authenticated", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>child content</div>,
+    });
+    renderWithProviders(jsx);
+
+    expect(screen.getByText("child content")).toBeInTheDocument();
+  });
+
+  it("renders topbar with Command Center title", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>test</div>,
+    });
+    renderWithProviders(jsx);
+
+    expect(screen.getByText("⚡ Command Center")).toBeInTheDocument();
+  });
+
+  it("renders Dashboard link in topbar", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>test</div>,
+    });
+    renderWithProviders(jsx);
+
+    const dashboardLink = screen.getByText("← Dashboard");
+    expect(dashboardLink).toHaveAttribute("href", "/");
+  });
+
+  it("renders sidebar with Hub + 21 module items (22 total)", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>test</div>,
+    });
+    renderWithProviders(jsx);
+
+    // Hub link
+    expect(screen.getByText("Hub")).toBeInTheDocument();
+
+    // All 21 module labels should be in the sidebar
+    const moduleLabels = [
+      "Leads", "Agents", "Ideas", "Recipes", "Users", "Crons",
+      "Gallery", "Architecture", "Client Health", "Concerts",
+      "Contentful", "Iron", "Meeting Summaries", "Meme Generator",
+      "PR Review", "Rizz Guide", "Shopping List", "Team USF",
+      "AI Scripts", "App Access", "AlphaClaw",
+    ];
+
+    for (const label of moduleLabels) {
+      expect(screen.getByText(label)).toBeInTheDocument();
+    }
+  });
+
+  it("sidebar Hub links to /apps/command-center", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>test</div>,
+    });
+    renderWithProviders(jsx);
+
+    const hubLink = screen.getByText("Hub").closest("a");
+    expect(hubLink).toHaveAttribute("href", "/apps/command-center");
+  });
+
+  it("sidebar module links point to correct routes", async () => {
+    const jsx = await CommandCenterLayout({
+      children: <div>test</div>,
+    });
+    renderWithProviders(jsx);
+
+    const leadsLink = screen.getByText("Leads").closest("a");
+    expect(leadsLink).toHaveAttribute("href", "/apps/command-center/leads");
+
+    const alphaclawLink = screen.getByText("AlphaClaw").closest("a");
+    expect(alphaclawLink).toHaveAttribute("href", "/apps/command-center/alphaclaw");
+  });
+
+  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
+    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));
+
+    await expect(
+      CommandCenterLayout({ children: <div>test</div> }),
+    ).rejects.toThrow("Unauthorized");
+  });
+});
diff --git a/apps/web/app/apps/command-center/__tests__/page.test.tsx b/apps/web/app/apps/command-center/__tests__/page.test.tsx
new file mode 100644
index 0000000..e29e642
--- /dev/null
+++ b/apps/web/app/apps/command-center/__tests__/page.test.tsx
@@ -0,0 +1,120 @@
+// @vitest-environment jsdom
+import React from "react";
+import { describe, it, expect, vi, beforeAll } from "vitest";
+import { renderWithProviders, screen } from "@repo/test-utils";
+
+// StatCard uses IntersectionObserver to trigger count-up animation
+beforeAll(() => {
+  global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
+    observe: vi.fn(() => {
+      // Immediately trigger as visible so count-up runs
+      callback([{ isIntersecting: true } as IntersectionObserverEntry]

## Review Summary
All acceptance criteria met; hub page, sidebar, and auth tests are thorough and use @repo/test-utils; UI component tests are solid but use @testing-library/react directly

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