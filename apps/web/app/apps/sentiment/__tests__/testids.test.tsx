// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, within, fireEvent } from "@repo/test-utils";
import type { SentimentEntry } from "../lib/types";

// Render each <Line> as a div that keeps the props recharts forwards to the
// SVG path (data-* attributes), so the per-line hooks can be asserted in jsdom.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: (props: { "data-testid"?: string; dataKey?: string }) => (
    <div data-testid={props["data-testid"]} data-key={props.dataKey} />
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock("@repo/auth/server", () => ({
  requireAccess: vi.fn(),
}));

vi.mock("@/lib/enforce-feature-tier", () => ({
  enforceFeatureTier: vi.fn(),
}));

import { requireAccess } from "@repo/auth/server";
import { enforceFeatureTier } from "@/lib/enforce-feature-tier";
import { SentimentDashboard } from "../components/sentiment-dashboard";
import { MoodBadge } from "../components/mood-badge";
import SentimentLayout from "../layout";
import UpgradePrompt from "@/components/UpgradePrompt";

function makeEntry(overrides: Partial<SentimentEntry> = {}): SentimentEntry {
  return {
    id: "entry-1",
    date: "2025-04-07",
    member_name: "Alice",
    sentiment_score: 8,
    mood: "positive",
    work_summary: "Worked on feature X",
    blockers: [],
    highlights: [],
    created_at: "2025-04-07T10:00:00Z",
    ...overrides,
  };
}

const entries: SentimentEntry[] = [
  makeEntry({ id: "e1", member_name: "Alice", sentiment_score: 9, mood: "excited", highlights: ["Launch"] }),
  makeEntry({ id: "e2", member_name: "Bob", sentiment_score: 2, mood: "blocked", date: "2025-04-06", blockers: ["CI broken"] }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAccess).mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
    permission: "view",
  });
  vi.mocked(enforceFeatureTier).mockResolvedValue(true);
});

describe("Sentiment data-testid hooks", () => {
  it("tags the dashboard root and chart card", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    expect(screen.getByTestId("sentiment-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("sentiment-chart-card")).toBeInTheDocument();
  });

  it("tags one chart line per member in all-members mode", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    expect(screen.getByTestId("sentiment-chart-line-Alice")).toHaveAttribute("data-key", "Alice");
    expect(screen.getByTestId("sentiment-chart-line-Bob")).toHaveAttribute("data-key", "Bob");
    expect(screen.queryByTestId("sentiment-chart-line-score")).not.toBeInTheDocument();
  });

  it("tags the single score line when one member is selected", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    fireEvent.change(screen.getByTestId("member-filter"), { target: { value: "Alice" } });

    expect(screen.getByTestId("sentiment-chart-line-score")).toHaveAttribute("data-key", "score");
    expect(screen.queryByTestId("sentiment-chart-line-Alice")).not.toBeInTheDocument();
  });

  it("tags the member filter and each option by value", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    expect(screen.getByTestId("member-filter").tagName).toBe("SELECT");
    expect(screen.getByTestId("member-filter-option-all")).toHaveAttribute("value", "all");
    expect(screen.getByTestId("member-filter-option-Alice")).toHaveAttribute("value", "Alice");
    expect(screen.getByTestId("member-filter-option-Bob")).toHaveAttribute("value", "Bob");
  });

  it("tags each stat card with a scoped value and label", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    const expected: Record<string, [string, string]> = {
      avgSentiment: ["5.5", "Avg Sentiment"],
      totalEntries: ["2", "Total Entries"],
      teamMembers: ["2", "Team Members"],
      blockedDays: ["1", "Blocked Days"],
      highlights: ["1", "Highlights"],
    };
    for (const [key, [value, label]] of Object.entries(expected)) {
      const card = screen.getByTestId(`stat-card-${key}`);
      expect(within(card).getByTestId("stat-card-value")).toHaveTextContent(value);
      expect(within(card).getByTestId("stat-card-label")).toHaveTextContent(label);
    }
  });

  it("tags member cards with their latest mood and score", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    const bob = screen.getByTestId("member-card-Bob");
    expect(within(bob).getByTestId("member-card-latest-mood")).toHaveAttribute("data-mood", "blocked");
    expect(within(bob).getByTestId("member-card-latest-score")).toHaveTextContent("2/10");
  });

  it("tags timeline days and entries, with highlights/blockers only when present", () => {
    renderWithProviders(<SentimentDashboard entries={entries} />);

    const day = screen.getByTestId("timeline-day-2025-04-07");
    const alice = within(day).getByTestId("timeline-entry-e1");
    expect(within(alice).getByTestId("timeline-entry-highlights")).toHaveTextContent("Launch");
    expect(within(alice).queryByTestId("timeline-entry-blockers")).not.toBeInTheDocument();

    const bob = within(screen.getByTestId("timeline-day-2025-04-06")).getByTestId("timeline-entry-e2");
    expect(within(bob).getByTestId("timeline-entry-blockers")).toHaveTextContent("CI broken");
    expect(within(bob).queryByTestId("timeline-entry-highlights")).not.toBeInTheDocument();

    // Timeline badges keep the generic hook; member-grid badges use the specific one.
    expect(within(alice).getByTestId("mood-badge")).toHaveAttribute("data-mood", "excited");
  });

  it("exposes data-mood on MoodBadge, including the unknown-mood fallback", () => {
    renderWithProviders(<MoodBadge mood="ecstatic" />);

    const badge = screen.getByTestId("mood-badge");
    expect(badge).toHaveAttribute("data-mood", "ecstatic");
    expect(badge.className).toContain("bg-zinc-500/10");
  });

  it("tags the layout header nav anchors", async () => {
    const jsx = await SentimentLayout({ children: <div>child</div> });
    renderWithProviders(jsx);

    expect(screen.getByTestId("nav-dashboard")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("nav-about")).toHaveAttribute("href", "/about");
    expect(screen.getByTestId("nav-docs")).toHaveAttribute("href", "/docs");
    expect(screen.getByTestId("nav-changelog")).toHaveAttribute("href", "/changelog");
  });

  it("tags the real UpgradePrompt root and its pricing CTA", () => {
    renderWithProviders(<UpgradePrompt requiredTier="pro" />);

    const prompt = screen.getByTestId("upgrade-prompt");
    expect(within(prompt).getByTestId("upgrade-prompt-cta")).toHaveAttribute("href", "/pricing");
  });
});
