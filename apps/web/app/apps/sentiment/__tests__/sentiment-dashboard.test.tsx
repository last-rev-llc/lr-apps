// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { SentimentEntry } from "../lib/types";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { SentimentDashboard } from "../components/sentiment-dashboard";

function makeEntry(overrides: Partial<SentimentEntry> = {}): SentimentEntry {
  return {
    id: "entry-1",
    date: "2025-04-07",
    member_name: "Alice",
    sentiment_score: 8,
    mood: "positive",
    work_summary: "Worked on feature X",
    blockers: [],
    highlights: ["Shipped feature X"],
    created_at: "2025-04-07T10:00:00Z",
    ...overrides,
  };
}

const testEntries: SentimentEntry[] = [
  makeEntry({ id: "e1", member_name: "Alice", sentiment_score: 9, mood: "excited", highlights: ["Launch", "Demo"] }),
  makeEntry({ id: "e2", member_name: "Alice", sentiment_score: 7, mood: "positive", date: "2025-04-06", highlights: ["PR merged"] }),
  makeEntry({ id: "e3", member_name: "Bob", sentiment_score: 5, mood: "neutral", highlights: [] }),
  makeEntry({ id: "e4", member_name: "Bob", sentiment_score: 3, mood: "frustrated", date: "2025-04-06", blockers: ["CI broken"], highlights: [] }),
  makeEntry({ id: "e5", member_name: "Bob", sentiment_score: 2, mood: "blocked", date: "2025-04-05", blockers: ["Blocked on review"], highlights: [] }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SentimentDashboard", () => {
  it("renders Dashboard heading and child sections", () => {
    renderWithProviders(<SentimentDashboard entries={testEntries} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
  });

  describe("MoodBadge", () => {
    it("displays correct text for each mood", () => {
      renderWithProviders(<SentimentDashboard entries={testEntries} />);

      // Mood text may appear multiple times (badge + member grid)
      expect(screen.getAllByText("excited").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("positive").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("neutral").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("frustrated").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("blocked").length).toBeGreaterThanOrEqual(1);
    });

    it("applies correct color classes for each mood", () => {
      renderWithProviders(<SentimentDashboard entries={testEntries} />);

      const excited = screen.getAllByText("excited")[0];
      expect(excited.className).toContain("bg-pill-0/20");

      const positive = screen.getAllByText("positive")[0];
      expect(positive.className).toContain("bg-green/20");

      const neutral = screen.getAllByText("neutral")[0];
      expect(neutral.className).toContain("bg-zinc-500/10"); // neutral variant

      const frustrated = screen.getAllByText("frustrated")[0];
      expect(frustrated.className).toContain("bg-orange/20");

      const blocked = screen.getAllByText("blocked")[0];
      expect(blocked.className).toContain("bg-red/20");
    });
  });

  describe("MemberFilter", () => {
    it("renders 'All Members' option plus one per unique member", () => {
      renderWithProviders(<SentimentDashboard entries={testEntries} />);

      const select = screen.getByRole("combobox");
      const options = select.querySelectorAll("option");

      expect(options).toHaveLength(3); // All Members + Alice + Bob
      expect(options[0].textContent).toBe("All Members");
      expect(options[1].textContent).toBe("Alice");
      expect(options[2].textContent).toBe("Bob");
    });

    it("filters entries when a specific member is selected", () => {
      renderWithProviders(<SentimentDashboard entries={testEntries} />);

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "Alice" } });

      // After filtering to Alice, Bob's entries should not appear in stats
      // Alice has 2 entries, scores 9 and 7, avg = 8.0
      expect(screen.getByText("8.0")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // Total entries
    });
  });

  describe("StatsRow", () => {
    it("shows correct computed values", () => {
      renderWithProviders(<SentimentDashboard entries={testEntries} />);

      // avg = (9+7+5+3+2)/5 = 26/5 = 5.2
      expect(screen.getByText("5.2")).toBeInTheDocument();
      // Total entries
      expect(screen.getByText("5")).toBeInTheDocument();
      // Unique members
      const memberCountLabel = screen.getByText("Team Members");
      const memberCountValue = memberCountLabel.previousElementSibling;
      expect(memberCountValue?.textContent).toBe("2");
      // Blocked days
      const blockedLabel = screen.getByText("Blocked Days");
      const blockedValue = blockedLabel.previousElementSibling;
      expect(blockedValue?.textContent).toBe("1");
      // Total highlights = 2 + 1 + 0 + 0 + 0 = 3
      const highlightsLabel = screen.getByText("Highlights");
      const highlightsValue = highlightsLabel.previousElementSibling;
      expect(highlightsValue?.textContent).toBe("3");
    });

    it("shows dash for avg sentiment and zeros when entries are empty", () => {
      renderWithProviders(<SentimentDashboard entries={[]} />);

      expect(screen.getByText("—")).toBeInTheDocument();
      // Total entries, Team Members, Blocked Days, Highlights all 0
      const zeros = screen.getAllByText("0");
      expect(zeros).toHaveLength(4);
    });
  });
});
