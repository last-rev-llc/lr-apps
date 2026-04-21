// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import type { Dance, DanceSubmission } from "../lib/types";

// ── Mock lib/queries ───────────────────────────────────────────────────────

vi.mock("../lib/queries", () => ({
  getDances: vi.fn(),
  getDanceSubmissions: vi.fn(),
}));

// ── Mock DanceApp component ────────────────────────────────────────────────

vi.mock("../components/dance-app", () => ({
  DanceApp: ({ initialDances, initialSubmissions }: any) => (
    <div data-testid="dance-app">
      <span data-testid="dance-count">{initialDances.length}</span>
      <span data-testid="submission-count">{initialSubmissions.length}</span>
    </div>
  ),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_DANCES: Dance[] = [
  {
    id: "dance-1",
    name: "The Shuffle",
    emoji: "🕺",
    description: "A fun shuffle dance",
    code: "-- code",
    difficulty: "beginner",
    tags: ["fun"],
    rating: 4,
    ratingCount: 5,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "dance-2",
    name: "The Spin",
    emoji: "🌀",
    description: "A spinning dance",
    code: "-- code",
    difficulty: "advanced",
    tags: ["cool"],
    rating: 5,
    ratingCount: 8,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

const MOCK_SUBMISSIONS: DanceSubmission[] = [
  {
    id: "sub-1",
    name: "The Wave",
    emoji: "🌊",
    description: "A wave dance",
    difficulty: "intermediate",
    tags: [],
    submittedBy: "anonymous",
    createdAt: "2024-01-03T00:00:00Z",
    status: "pending",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("RobloxDancesPage", () => {
  it("renders heading text", async () => {
    const { getDances, getDanceSubmissions } = await import("../lib/queries");
    vi.mocked(getDances).mockResolvedValueOnce(MOCK_DANCES);
    vi.mocked(getDanceSubmissions).mockResolvedValueOnce(MOCK_SUBMISSIONS);

    const { default: RobloxDancesPage } = await import("../page");
    const jsx = await RobloxDancesPage();
    renderWithProviders(jsx);

    expect(screen.getByText("🕺 Roblox Dance Marketplace")).toBeInTheDocument();
  });

  it("renders subtitle text", async () => {
    const { getDances, getDanceSubmissions } = await import("../lib/queries");
    vi.mocked(getDances).mockResolvedValueOnce(MOCK_DANCES);
    vi.mocked(getDanceSubmissions).mockResolvedValueOnce(MOCK_SUBMISSIONS);

    const { default: RobloxDancesPage } = await import("../page");
    const jsx = await RobloxDancesPage();
    renderWithProviders(jsx);

    expect(
      screen.getByText("Animated dance moves for Roblox"),
    ).toBeInTheDocument();
  });

  it("renders DanceApp with data from queries", async () => {
    const { getDances, getDanceSubmissions } = await import("../lib/queries");
    vi.mocked(getDances).mockResolvedValueOnce(MOCK_DANCES);
    vi.mocked(getDanceSubmissions).mockResolvedValueOnce(MOCK_SUBMISSIONS);

    const { default: RobloxDancesPage } = await import("../page");
    const jsx = await RobloxDancesPage();
    renderWithProviders(jsx);

    expect(screen.getByTestId("dance-app")).toBeInTheDocument();
    expect(screen.getByTestId("dance-count").textContent).toBe("2");
    expect(screen.getByTestId("submission-count").textContent).toBe("1");
  });

  it("passes empty arrays to DanceApp when queries return nothing", async () => {
    const { getDances, getDanceSubmissions } = await import("../lib/queries");
    vi.mocked(getDances).mockResolvedValueOnce([]);
    vi.mocked(getDanceSubmissions).mockResolvedValueOnce([]);

    const { default: RobloxDancesPage } = await import("../page");
    const jsx = await RobloxDancesPage();
    renderWithProviders(jsx);

    expect(screen.getByTestId("dance-count").textContent).toBe("0");
    expect(screen.getByTestId("submission-count").textContent).toBe("0");
  });
});
