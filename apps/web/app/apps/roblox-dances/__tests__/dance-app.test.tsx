// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { Dance, DanceSubmission } from "../lib/types";

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button type="button" data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-tab={value}>{children}</div>
  ),
  Card: ({ children, className, onClick }: any) => (
    <div className={className ?? ""} onClick={onClick}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className ?? ""}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className ?? ""}
    />
  ),
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Badge: ({ children, className, variant }: any) => (
    <span className={[className, variant].filter(Boolean).join(" ")}>
      {children}
    </span>
  ),
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h3>{children}</h3>,
  StarRating: ({ value }: any) => (
    <div data-testid="star-rating" data-value={value} />
  ),
}));

// ── Mock @repo/db/client ───────────────────────────────────────────────────

vi.mock("@repo/db/client", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeDance(overrides: Partial<Dance> = {}): Dance {
  return {
    id: "dance-1",
    name: "The Shuffle",
    emoji: "🕺",
    description: "A fun shuffle dance",
    code: "-- Lua code\nlocal x = 1",
    difficulty: "beginner",
    tags: ["hip-hop", "fun"],
    rating: 4.5,
    ratingCount: 10,
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeSubmission(
  overrides: Partial<DanceSubmission> = {},
): DanceSubmission {
  return {
    id: "sub-1",
    name: "The Wave",
    emoji: "🌊",
    description: "A fluid wave dance",
    difficulty: "intermediate",
    tags: ["smooth"],
    submittedBy: "anonymous",
    createdAt: "2024-01-02T00:00:00Z",
    status: "pending",
    ...overrides,
  };
}

const MOCK_DANCES: Dance[] = [
  makeDance({ id: "dance-1", name: "The Shuffle", difficulty: "beginner" }),
  makeDance({
    id: "dance-2",
    name: "The Moonwalk",
    difficulty: "expert",
    rating: 5,
    ratingCount: 20,
  }),
];

const MOCK_SUBMISSIONS: DanceSubmission[] = [
  makeSubmission({ id: "sub-1", name: "The Wave", status: "pending" }),
  makeSubmission({ id: "sub-2", name: "The Robot", status: "approved" }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("DanceApp", () => {
  it("renders catalog tab by default", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getByTestId("tabs")).toBeInTheDocument();
    expect(screen.getAllByText(/Catalog/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Submit/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Generator/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders dance names from mock data", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getByText("The Shuffle")).toBeInTheDocument();
    expect(screen.getByText("The Moonwalk")).toBeInTheDocument();
  });

  it("renders difficulty badges on dance cards", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getAllByText("beginner").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("expert").length).toBeGreaterThanOrEqual(1);
  });

  it("renders dance emojis", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getAllByText("🕺").length).toBeGreaterThanOrEqual(1);
  });

  it("renders star ratings for dance cards", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    const ratings = screen.getAllByTestId("star-rating");
    expect(ratings.length).toBeGreaterThanOrEqual(MOCK_DANCES.length);
  });

  it("renders rating count on dance cards", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    // rating counts appear in parentheses
    expect(screen.getByText("(10)")).toBeInTheDocument();
    expect(screen.getByText("(20)")).toBeInTheDocument();
  });

  it("filters dances by search query", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Search dances…");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Moonwalk" } });
    });

    expect(screen.getByText("The Moonwalk")).toBeInTheDocument();
    expect(screen.queryByText("The Shuffle")).not.toBeInTheDocument();
  });

  it("shows empty state when no dances match search", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Search dances…");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "xyznotadance" } });
    });

    expect(screen.getByText("No dances match your filters")).toBeInTheDocument();
  });

  it("renders submission form fields in submit tab", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    // Submit tab content is rendered (all TabsContent are rendered in our mock)
    expect(
      screen.getByPlaceholderText("e.g. The Shuffle"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("🎵")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("hip-hop, viral, party")).toBeInTheDocument();
    expect(screen.getByText("Submit Dance Idea")).toBeInTheDocument();
  });

  it("renders recent submissions list", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getByText("The Wave")).toBeInTheDocument();
    expect(screen.getByText("The Robot")).toBeInTheDocument();
  });

  it("renders status badges on submissions", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("renders generator tab with prompt input", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp
        initialDances={MOCK_DANCES}
        initialSubmissions={MOCK_SUBMISSIONS}
      />,
    );

    expect(screen.getByText("⚡ AI Script Generator")).toBeInTheDocument();
    expect(screen.getByText("Generate Script")).toBeInTheDocument();
  });

  it("renders with empty dance list gracefully", async () => {
    const { DanceApp } = await import("../components/dance-app");
    renderWithProviders(
      <DanceApp initialDances={[]} initialSubmissions={[]} />,
    );

    expect(screen.getByText("No dances match your filters")).toBeInTheDocument();
    expect(
      screen.getByText("No submissions yet. Be the first!"),
    ).toBeInTheDocument();
  });
});
