You just implemented GitHub issue #44: Slang Translator: component migration

## Original Requirements
## Summary
Replace inline UI in Slang Translator with `@repo/ui` shared components.

## Acceptance Criteria
- [ ] Translator input/output uses `@repo/ui` Input, Card
- [ ] Bi-directional display uses shared components
- [ ] All buttons use `@repo/ui` Button
- [ ] `pnpm build` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/dad-joke-of-the-day/components/__tests__/joke-viewer.test.tsx b/apps/web/app/apps/dad-joke-of-the-day/components/__tests__/joke-viewer.test.tsx
new file mode 100644
index 0000000..cea50ce
--- /dev/null
+++ b/apps/web/app/apps/dad-joke-of-the-day/components/__tests__/joke-viewer.test.tsx
@@ -0,0 +1,178 @@
+// @vitest-environment jsdom
+import { describe, it, expect, vi, beforeEach } from "vitest";
+import React from "react";
+import {
+  renderWithProviders,
+  screen,
+  fireEvent,
+  createMockSupabase,
+} from "@repo/test-utils";
+import type { DadJoke } from "../../lib/types";
+
+// Mock @repo/db/client
+const mockSupabase = createMockSupabase();
+vi.mock("@repo/db/client", () => ({
+  createClient: () => mockSupabase,
+}));
+
+// Mock @repo/ui — provide minimal real elements
+vi.mock("@repo/ui", () => ({
+  Button: ({
+    children,
+    onClick,
+    disabled,
+    title,
+    ...rest
+  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
+    <button onClick={onClick} disabled={disabled} title={title} {...rest}>
+      {children}
+    </button>
+  ),
+  Badge: ({
+    children,
+    ...rest
+  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
+    <span {...rest}>{children}</span>
+  ),
+  Card: ({
+    children,
+    ...rest
+  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
+  CardContent: ({
+    children,
+    ...rest
+  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
+}));
+
+import { JokeViewer } from "../joke-viewer";
+
+function makeJoke(overrides: Partial<DadJoke> = {}): DadJoke {
+  return {
+    id: 1,
+    setup: "Why did the chicken cross the road?",
+    punchline: "To get to the other side!",
+    category: "Classic",
+    rating: null,
+    times_rated: 0,
+    times_shown: 0,
+    featured_date: null,
+    ...overrides,
+  };
+}
+
+const defaultJoke = makeJoke();
+const defaultProps = {
+  jokes: [defaultJoke],
+  initialJoke: defaultJoke,
+  categories: ["Classic"],
+};
+
+beforeEach(() => {
+  vi.clearAllMocks();
+  mockSupabase._builder.single.mockResolvedValue({
+    data: { times_shown: 0, rating: null, times_rated: 0 },
+    error: null,
+  });
+});
+
+describe("JokeViewer", () => {
+  it("renders setup text", () => {
+    renderWithProviders(<JokeViewer {...defaultProps} />);
+    expect(screen.getByText("Why did the chicken cross the road?")).toBeTruthy();
+  });
+
+  it("hides punchline initially", () => {
+    renderWithProviders(<JokeViewer {...defaultProps} />);
+    expect(screen.queryByText("To get to the other side!")).toBeNull();
+  });
+
+  it("shows reveal button", () => {
+    renderWithProviders(<JokeViewer {...defaultProps} />);
+    expect(screen.getByText(/Reveal Punchline/)).toBeTruthy();
+  });
+
+  it("shows JOTD mode badge on initial render", () => {
+    renderWithProviders(<JokeViewer {...defaultProps} />);
+    const badges = screen.getAllByText(/Joke of the Day/);
+    expect(badges.length).toBeGreaterThanOrEqual(1);
+  });
+
+  it("reveals punchline on button click", () => {
+    renderWithProviders(<JokeViewer {...defaultProps} />);
+    fireEvent.click(screen.getByText(/Reveal Punchline/));
+    expect(screen.getByText("To get to the other side!")).toBeTruthy();
+  });
+
+  it("shows rating buttons after punchline reveal", () => {
+    renderWithProviders(<JokeViewer {...defaultProps} />);
+    fireEvent.click(screen.getByText(/Reveal Punchline/));
+    expect(screen.getByText("Rate this joke:")).toBeTruthy();
+    expect(screen.getByTitle("Groan-worthy")).toBeTruthy();
+    expect(screen.getByTitle("Actually funny")).toBeTruthy();
+  });
+
+  it("renders category filter badges", () => {
+    const props = {
+      ...defaultProps,
+      jokes: [
+        makeJoke({ id: 1, category: "Classic" }),
+        makeJoke({ id: 2, category: "Puns" }),
+      ],
+      categories: ["Classic", "Puns"],
+    };
+    renderWithProviders(<JokeViewer {...props} />);
+    expect(screen.getByText("All")).toBeTruthy();
+    // "Classic" appears in filter and card footer
+    expect(screen.getAllByText("Classic").length).toBeGreaterThanOrEqual(1);
+    expect(screen.getByText("Puns")).toBeTruthy();
+  });
+
+  it("shows filtered pool count after selecting a category", () => {
+    const jokes = [
+      makeJoke({ id: 1, category: "Classic" }),
+      makeJoke({ id: 2, category: "Classic" }),
+      makeJoke({ id: 3, category: "Puns" }),
+    ];
+    const props = {
+      jokes,
+      initialJoke: jokes[0]!,
+      categories: ["Classic", "Puns"],
+    };
+    renderWithProviders(<JokeViewer {...props} />);
+
+    // Click Puns category filter
+    const punsButtons = screen.getAllByText("Puns");
+    fireEvent.click(punsButtons[0]!);
+
+    expect(screen.getByText(/1 joke in Puns/)).toBeTruthy();
+  });
+
+  it("switches to random mode after clicking random button", () => {
+    const jokes = [
+      makeJoke({ id: 1

## Review Summary
Slang Translator component migration to @repo/ui is complete — all acceptance criteria met, build passes, 116 tests pass.

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