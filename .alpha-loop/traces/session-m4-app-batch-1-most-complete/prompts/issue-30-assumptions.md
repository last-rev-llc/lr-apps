You just implemented GitHub issue #30: Summaries: component migration

## Original Requirements
## Summary
Replace inline UI patterns in Summaries app with `@repo/ui` shared components.

## Details
- Replace inline cards, buttons, badges
- Ensure Zoom/Slack/Jira summary rendering uses shared components

## Acceptance Criteria
- [ ] All UI elements use `@repo/ui` components
- [ ] Summary cards use shared Card component
- [ ] Source badges use shared Badge component
- [ ] `pnpm build` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/accounts/__tests__/accounts-app.test.tsx b/apps/web/app/apps/accounts/__tests__/accounts-app.test.tsx
new file mode 100644
index 0000000..aa31806
--- /dev/null
+++ b/apps/web/app/apps/accounts/__tests__/accounts-app.test.tsx
@@ -0,0 +1,208 @@
+// @vitest-environment jsdom
+import React from "react";
+import { describe, it, expect } from "vitest";
+import { renderWithProviders, screen, fireEvent, within } from "@repo/test-utils";
+import { AccountsApp } from "../components/accounts-app";
+import type { Client } from "../lib/types";
+
+
+// ── Mock data ──────────────────────────────────────────────────────────────
+
+const mockClients: Client[] = [
+  {
+    id: "c1",
+    name: "Acme Corp",
+    health: "good",
+    industry: "SaaS",
+    contacts: [
+      {
+        name: "Alice Johnson",
+        role: "VP Engineering",
+        email: "alice@acme.com",
+        linkedin: "https://linkedin.com/in/alice",
+        isPrimary: true,
+      },
+      {
+        name: "Bob Smith",
+        role: "CTO",
+        email: "bob@acme.com",
+        isPrimary: false,
+      },
+    ],
+    github: {
+      openPRs: 12,
+      repos: ["acme-web", "acme-api"],
+      prs: [
+        { repo: "acme-web", number: 42, title: "Add dark mode", author: "alice", authorName: "Alice" },
+        { repo: "acme-api", number: 99, title: "Fix auth flow", author: "bob", authorName: "Bob" },
+      ],
+    },
+    jira: { status: "active", openTickets: 8, staleTickets: 2 },
+  },
+  {
+    id: "c2",
+    name: "Beta Inc",
+    health: "at-risk",
+    industry: "E-commerce",
+    contacts: [
+      {
+        name: "Carol Davis",
+        role: "PM",
+        email: "carol@beta.com",
+        isPrimary: true,
+      },
+    ],
+    github: {
+      openPRs: 3,
+      repos: ["beta-store"],
+      prs: [
+        { repo: "beta-store", number: 7, title: "Update checkout", author: "carol", authorName: "Carol" },
+      ],
+    },
+  },
+  {
+    id: "c3",
+    name: "Gamma Ltd",
+    health: "critical",
+    industry: "FinTech",
+    contacts: [],
+    github: { openPRs: 0 },
+  },
+];
+
+// ── Helpers ─────────────────────────────────────────────────────────────────
+
+function clickTab(name: RegExp) {
+  const tab = screen.getByRole("tab", { name });
+  tab.focus();
+  fireEvent.keyDown(tab, { key: "Enter" });
+}
+
+// ── Tests ──────────────────────────────────────────────────────────────────
+
+describe("AccountsApp", () => {
+  // ── Client selector ───────────────────────────────────────────────────
+
+  it("renders all client names in the selector dropdown", () => {
+    renderWithProviders(<AccountsApp clients={mockClients} />);
+
+    const options = screen.getAllByRole("option");
+    expect(options).toHaveLength(3);
+    expect(options[0]).toHaveTextContent("Acme Corp");
+    expect(options[1]).toHaveTextContent("Beta Inc");
+    expect(options[2]).toHaveTextContent("Gamma Ltd");
+  });
+
+  it("shows health badge for the selected client", () => {
+    renderWithProviders(<AccountsApp clients={mockClients} />);
+
+    expect(screen.getByText("good")).toBeInTheDocument();
+  });
+
+  it("shows industry badge for the selected client", () => {
+    renderWithProviders(<AccountsApp clients={mockClients} />);
+
+    // "SaaS" appears in both the selector badge and the overview tab
+    expect(screen.getAllByText("SaaS").length).toBeGreaterThanOrEqual(1);
+  });
+
+  it("updates dashboard when a different client is selected", () => {
+    renderWithProviders(<AccountsApp clients={mockClients} />);
+
+    const select = screen.getByRole("combobox");
+    fireEvent.change(select, { target: { value: "c2" } });
+
+    expect(screen.getByText("at-risk")).toBeInTheDocument();
+    expect(screen.getAllByText("E-commerce").length).toBeGreaterThanOrEqual(1);
+  });
+
+  it("renders empty state when clients array is empty", () => {
+    renderWithProviders(<AccountsApp clients={[]} />);
+
+    expect(screen.getByText("No clients found")).toBeInTheDocument();
+  });
+
+  // ── Contacts tab ──────────────────────────────────────────────────────
+
+  it("renders contacts tab with contact details", () => {
+    renderWithProviders(<AccountsApp clients={mockClients} />);
+    clickTab(/Contacts/i);
+
+    // Contacts tab panel should be active
+    const contactsPanel = screen.getByRole("tabpanel");
+    expect(within(contactsPanel).getByText("Alice Johnson")).toBeInTheDocument();
+    expect(within(contactsPanel).getByText("VP Engineering")).toBeInTheDocument();
+    expect(within(contactsPanel).getByText("alice@acme.com")).toBeInTheDocument();
+    expect(within(contactsPanel).getByText("Bob Smith")).toBeInTheDocument();
+    expect(within(contactsPanel).getByText("CTO")).toBeInTheDocument();
+  });
+
+  it("shows Primary badge for primary contacts", () => {
+    renderWithProviders(<AccountsApp clients={mockClients} />);
+    clickTab(/Contacts/i);
+
+    const contactsPanel = screen.getByRole("tabpanel");
+    ex

## Review Summary
Summaries component migration complete — inline Pill, cards, badges, inputs, empty states, and page header all replaced with @repo/ui shared components. Build passes.

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