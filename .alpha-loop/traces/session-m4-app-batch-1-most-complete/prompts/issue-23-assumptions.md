You just implemented GitHub issue #23: Extend @repo/ui with missing common components

## Original Requirements
## Summary
Audit component gaps needed for M4–M6 app migrations and build missing shared components in `@repo/ui`.

## Details
- Audit all 27 apps for commonly-used UI patterns not yet in `@repo/ui`
- Likely needed: `Table`, `DataGrid`, `StatusBadge`, `LoadingSkeleton`, `ErrorBoundary`, `EmptyState` variants
- Follow existing patterns: forwardRef, CVA (class-variance-authority), cn() utility
- Each component should support theme tokens and dark mode
- Add Storybook-style examples or tests for variant coverage

## Acceptance Criteria
- [ ] Audit complete — documented list of needed components
- [ ] `Table` component with sortable columns and row selection
- [ ] `DataGrid` component for tabular data display
- [ ] `StatusBadge` component with semantic color variants
- [ ] `LoadingSkeleton` component with configurable shapes
- [ ] `ErrorBoundary` wrapper component
- [ ] `EmptyState` component with icon, title, description, action slots
- [ ] All components use forwardRef, CVA, cn() patterns
- [ ] All components render with theme tokens
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/next-env.d.ts b/apps/web/next-env.d.ts
index c4b7818..9edff1c 100644
--- a/apps/web/next-env.d.ts
+++ b/apps/web/next-env.d.ts
@@ -1,6 +1,6 @@
 /// <reference types="next" />
 /// <reference types="next/image-types/global" />
-import "./.next/dev/types/routes.d.ts";
+import "./.next/types/routes.d.ts";
 
 // NOTE: This file should not be edited
 // see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
diff --git a/packages/ui/package.json b/packages/ui/package.json
index 91217a3..832ce1e 100644
--- a/packages/ui/package.json
+++ b/packages/ui/package.json
@@ -28,7 +28,11 @@
   "devDependencies": {
     "@repo/config": "workspace:*",
     "@repo/test-utils": "workspace:*",
+    "@testing-library/jest-dom": "^6",
+    "@testing-library/react": "^16",
+    "@testing-library/user-event": "^14.6.1",
     "@types/react": "^19",
+    "jsdom": "^26",
     "mermaid": "^11.13.0",
     "typescript": "^5",
     "vitest": "^3"
diff --git a/packages/ui/src/__tests__/data-grid.test.tsx b/packages/ui/src/__tests__/data-grid.test.tsx
new file mode 100644
index 0000000..cb6eced
--- /dev/null
+++ b/packages/ui/src/__tests__/data-grid.test.tsx
@@ -0,0 +1,97 @@
+import { describe, it, expect, vi } from "vitest";
+import { render, screen, within } from "@testing-library/react";
+import userEvent from "@testing-library/user-event";
+import { DataGrid, type DataGridColumn } from "../components/data-grid";
+
+interface TestRow {
+  id: string;
+  name: string;
+  age: number;
+  [key: string]: unknown;
+}
+
+const columns: DataGridColumn<TestRow>[] = [
+  { key: "name", header: "Name", sortable: true },
+  { key: "age", header: "Age", sortable: true },
+];
+
+const data: TestRow[] = [
+  { id: "1", name: "Alice", age: 30 },
+  { id: "2", name: "Bob", age: 25 },
+  { id: "3", name: "Charlie", age: 35 },
+];
+
+describe("DataGrid", () => {
+  it("renders tabular data", () => {
+    render(<DataGrid columns={columns} data={data} />);
+    expect(screen.getByText("Name")).toBeInTheDocument();
+    expect(screen.getByText("Alice")).toBeInTheDocument();
+    expect(screen.getByText("Bob")).toBeInTheDocument();
+  });
+
+  it("shows empty state when data is empty", () => {
+    render(
+      <DataGrid
+        columns={columns}
+        data={[]}
+        emptyTitle="Nothing here"
+        emptyDescription="Add some data"
+      />,
+    );
+    expect(screen.getByText("Nothing here")).toBeInTheDocument();
+    expect(screen.getByText("Add some data")).toBeInTheDocument();
+  });
+
+  it("sorts data when clicking a sortable column header", async () => {
+    const user = userEvent.setup();
+    render(<DataGrid columns={columns} data={data} />);
+
+    // Click Name header to sort ascending
+    await user.click(screen.getByText("Name"));
+    const rows = screen.getAllByRole("row");
+    // Row 0 is header, rows 1-3 are data
+    expect(within(rows[1]).getByText("Alice")).toBeInTheDocument();
+
+    // Click again to sort descending
+    await user.click(screen.getByText("Name"));
+    const rowsDesc = screen.getAllByRole("row");
+    expect(within(rowsDesc[1]).getByText("Charlie")).toBeInTheDocument();
+  });
+
+  it("supports row selection", async () => {
+    const user = userEvent.setup();
+    const onSelectRows = vi.fn();
+    render(
+      <DataGrid columns={columns} data={data} selectable onSelectRows={onSelectRows} />,
+    );
+
+    const checkboxes = screen.getAllByRole("checkbox");
+    // First checkbox is "select all", rest are row checkboxes
+    expect(checkboxes).toHaveLength(4);
+
+    // Select first row
+    await user.click(checkboxes[1]);
+    expect(onSelectRows).toHaveBeenCalledWith(["1"]);
+  });
+
+  it("select all toggles all rows", async () => {
+    const user = userEvent.setup();
+    const onSelectRows = vi.fn();
+    render(
+      <DataGrid columns={columns} data={data} selectable onSelectRows={onSelectRows} />,
+    );
+
+    const checkboxes = screen.getAllByRole("checkbox");
+    await user.click(checkboxes[0]); // select all
+    expect(onSelectRows).toHaveBeenCalledWith(expect.arrayContaining(["1", "2", "3"]));
+  });
+
+  it("supports custom cell render", () => {
+    const columnsWithRender: DataGridColumn<TestRow>[] = [
+      { key: "name", header: "Name", render: (val) => <strong>{String(val)}</strong> },
+    ];
+    render(<DataGrid columns={columnsWithRender} data={data} />);
+    const strong = screen.getByText("Alice");
+    expect(strong.tagName).toBe("STRONG");
+  });
+});
diff --git a/packages/ui/src/__tests__/error-boundary.test.tsx b/packages/ui/src/__tests__/error-boundary.test.tsx
new file mode 100644
index 0000000..ea9431c
--- /dev/null
+++ b/packages/ui/src/__tests__/error-boundary.test.tsx
@@ -0,0 +1,98 @@
+import { describe, it, expect, vi, beforeEach } from "vitest";
+import { render, screen } from "@testing-library/react";
+import userEvent from "@testing-library/user-event";
+import { ErrorBoundary } from "../components/e

## Review Summary
All acceptance criteria met. Fixed broken ErrorBoundary reset test, added missing 'use client' directive to table.tsx, and added aria-sort for accessibility. Build and all 31 tests pass.

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