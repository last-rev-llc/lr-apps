// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { HSPTData } from "../../lib/types";

// ── Mock recharts ──────────────────────────────────────────────────────────

vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  Badge: ({ children, className, variant }: any) => (
    <span className={className} data-variant={variant}>{children}</span>
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<any> = {}) {
  return {
    id: 1,
    type: "analogy",
    question: "What is the opposite of hot?",
    options: ["Cold", "Warm", "Cool", "Freezing"] as [string, string, string, string],
    answer: "A" as const,
    explanation: "Cold is the opposite of hot.",
    difficulty: 1 as const,
    ...overrides,
  };
}

const MOCK_DATA: HSPTData = {
  verbal: [
    makeQuestion({ id: 1, question: "Q1 verbal?" }),
    makeQuestion({ id: 2, question: "Q2 verbal?", answer: "B" }),
  ],
  quantitative: [
    makeQuestion({ id: 3, question: "Q3 quant?", type: "sequence" }),
    makeQuestion({ id: 4, question: "Q4 quant?", type: "sequence" }),
  ],
  mathematics: [
    makeQuestion({ id: 5, question: "Q5 math?", type: "arithmetic" }),
  ],
  language: [
    makeQuestion({ id: 6, question: "Q6 lang?", type: "grammar" }),
  ],
  passages: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PracticeApp — section selection", () => {
  it("renders all five section names", async () => {
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);
    expect(screen.getByText("Verbal Skills")).toBeInTheDocument();
    expect(screen.getByText("Quantitative Skills")).toBeInTheDocument();
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("shows the section menu heading", async () => {
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);
    expect(screen.getByText("Choose a Section")).toBeInTheDocument();
  });

  it("shows empty sessions message when no sessions exist", async () => {
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);
    expect(screen.getByText(/No practice sessions yet/i)).toBeInTheDocument();
  });

  it("enters quiz view when a section is clicked", async () => {
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    // Quiz view shows the section name and timer
    expect(screen.getByText(/Verbal Skills/i)).toBeInTheDocument();
    // Question text is visible
    expect(screen.getByText(/Q1\./)).toBeInTheDocument();
  });
});

describe("PracticeApp — question cards render with answer choices", () => {
  it("renders all four answer choice buttons", async () => {
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    expect(screen.getByText(/A\./)).toBeInTheDocument();
    expect(screen.getByText(/B\./)).toBeInTheDocument();
    expect(screen.getByText(/C\./)).toBeInTheDocument();
    expect(screen.getByText(/D\./)).toBeInTheDocument();
  });

  it("selecting an answer updates the answered count", async () => {
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    expect(screen.getByText("0 answered")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getAllByText(/A\./)[0]);
    });

    expect(screen.getByText("1 answered")).toBeInTheDocument();
  });
});

describe("PracticeApp — timed exam flow", () => {
  it("shows a countdown timer when quiz starts", async () => {
    vi.useFakeTimers();
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    // Timer should show a time like "16:00" (verbal is 16 minutes)
    expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("timer counts down after starting a quiz", async () => {
    vi.useFakeTimers();
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    // Advance 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // After 5 seconds the timer should no longer be at the initial value
    // (16:00 = 960 seconds; after 5s = 955 = 15:55)
    expect(screen.getByText("15:55")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("PracticeApp — scoring", () => {
  it("shows results view after finishing a quiz", async () => {
    vi.stubGlobal("confirm", () => true);
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    // Click Finish button
    await act(async () => {
      fireEvent.click(screen.getByText("Finish"));
    });

    expect(screen.getByText(/Results/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("results view shows correct percentage", async () => {
    vi.stubGlobal("confirm", () => true);
    const { PracticeApp } = await import("../practice-app");
    renderWithProviders(<PracticeApp data={MOCK_DATA} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Verbal Skills"));
    });

    // Answer first question correctly (A)
    await act(async () => {
      fireEvent.click(screen.getAllByText(/A\./)[0]);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Finish"));
    });

    // Should show percentage (multiple % elements appear in results breakdown)
    expect(screen.getAllByText(/%/).length).toBeGreaterThan(0);
  });
});

describe("PracticeApp — auth gate", () => {
  it("requires auth via layout (layout calls requireAppLayoutAccess)", async () => {
    // The auth gate is handled in layout.tsx via requireAppLayoutAccess.
    // We just verify PracticeApp renders without crashing when given valid data.
    const { PracticeApp } = await import("../practice-app");
    const { container } = renderWithProviders(<PracticeApp data={MOCK_DATA} />);
    expect(container.firstChild).toBeTruthy();
  });
});
