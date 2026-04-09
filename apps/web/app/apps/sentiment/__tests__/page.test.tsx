// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import type { SentimentEntry } from "../lib/types";

const { mockBuilder, mockSupabase } = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const chainMethods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "in", "order", "limit"];
  for (const m of chainMethods) builder[m] = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: [], error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: [], error: null });
  builder.then = vi.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
  );

  const client = {
    from: vi.fn().mockReturnValue(builder),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _builder: builder,
  };
  return { mockBuilder: builder, mockSupabase: client };
});

vi.mock("@repo/db/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import SentimentPage from "../page";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SentimentPage", () => {
  it("renders 'Team Sentiment' heading and subtitle", async () => {
    mockSupabase._builder.then.mockImplementation((resolve: Function) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    );

    const jsx = await SentimentPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Team Sentiment")).toBeInTheDocument();
    expect(
      screen.getByText("Track mood, blockers, and highlights across your team."),
    ).toBeInTheDocument();
  });

  it("passes fetched entries to SentimentDashboard", async () => {
    mockSupabase._builder.then.mockImplementation((resolve: Function) =>
      Promise.resolve({
        data: [
          makeEntry(),
          makeEntry({ id: "e2", member_name: "Bob", mood: "frustrated", sentiment_score: 4 }),
        ],
        error: null,
      }).then(resolve),
    );

    const jsx = await SentimentPage();
    renderWithProviders(jsx);

    // Dashboard renders with entries — verify dashboard heading and stats
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    // Verify Total Entries stat card shows correct count
    const totalEntriesLabel = screen.getByText("Total Entries");
    const totalEntriesValue = totalEntriesLabel.previousElementSibling;
    expect(totalEntriesValue?.textContent).toBe("2");
  });

  it("renders empty dashboard state when no data", async () => {
    mockSupabase._builder.then.mockImplementation((resolve: Function) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    );

    const jsx = await SentimentPage();
    renderWithProviders(jsx);

    expect(screen.getByText("—")).toBeInTheDocument(); // empty avg sentiment
  });
});
