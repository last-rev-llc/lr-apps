// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { TutorQuestion } from "../../lib/types";

// ── Mock recharts ──────────────────────────────────────────────────────────

vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext<{
    value: string;
    setValue: (v: string) => void;
  }>({ value: "dashboard", setValue: () => {} });

  function Tabs({ children, value, onValueChange }: any) {
    const [internal, setInternal] = React.useState(value ?? "dashboard");
    const current = value ?? internal;
    const handleChange = (v: string) => {
      setInternal(v);
      onValueChange?.(v);
    };
    return (
      <TabsContext.Provider value={{ value: current, setValue: handleChange }}>
        <div data-testid="tabs">{children}</div>
      </TabsContext.Provider>
    );
  }

  function TabsList({ children, className }: any) {
    return <div role="tablist" className={className}>{children}</div>;
  }

  function TabsTrigger({ value, children, className }: any) {
    const ctx = React.useContext(TabsContext);
    return (
      <button
        role="tab"
        aria-selected={ctx.value === value}
        onClick={() => ctx.setValue(value)}
        className={className}
      >
        {children}
      </button>
    );
  }

  function TabsContent({ value, children }: any) {
    const ctx = React.useContext(TabsContext);
    if (ctx.value !== value) return null;
    return <div role="tabpanel">{children}</div>;
  }

  return {
    cn: (...args: any[]) => args.filter(Boolean).join(" "),
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Button: ({ children, onClick, disabled, className, variant }: any) => (
      <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
        {children}
      </button>
    ),
    Badge: ({ children, className }: any) => (
      <span className={className}>{children}</span>
    ),
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
  };
});

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeQuestion(overrides: Partial<TutorQuestion> = {}): TutorQuestion {
  return {
    id: `q-${Math.random()}`,
    section: "verbal",
    topic: "analogy",
    question: "What is an analogy for hot?",
    choices: ["A. Cold", "B. Warm", "C. Blazing", "D. Tepid"],
    correct: "A",
    explanation: "Cold is the opposite of hot.",
    ...overrides,
  };
}

const MOCK_QUESTIONS: TutorQuestion[] = [
  makeQuestion({ id: "q1", question: "First tutor question?" }),
  makeQuestion({ id: "q2", question: "Second tutor question?", correct: "B" }),
  makeQuestion({ id: "q3", question: "Third tutor question?", correct: "C" }),
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("TutorApp — structure", () => {
  it("renders three tab triggers", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);
    expect(screen.getByRole("tab", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Practice/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Progress/i })).toBeInTheDocument();
  });

  it("shows Dashboard tab by default", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);
    expect(screen.getByRole("tab", { name: /Dashboard/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("TutorApp — question display renders correctly", () => {
  it("shows the question text in the quiz tab", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);

    // Navigate to Practice tab
    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: /Practice/i }));
    });

    // Start quiz
    await act(async () => {
      fireEvent.click(screen.getByText(/Practice Weak Areas/i));
    });

    // One of our questions should be visible
    const questionVisible =
      screen.queryByText(/First tutor question\?/) !== null ||
      screen.queryByText(/Second tutor question\?/) !== null ||
      screen.queryByText(/Third tutor question\?/) !== null;
    expect(questionVisible).toBe(true);
  });

  it("shows answer choices after starting the quiz", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: /Practice/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/Practice Weak Areas/i));
    });

    // Should show answer choices
    expect(screen.getByText("A. Cold")).toBeInTheDocument();
  });
});

describe("TutorApp — auth gate", () => {
  it("renders without crashing (auth handled by layout)", async () => {
    const { TutorApp } = await import("../tutor-app");
    const { container } = renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe("TutorApp — dashboard state", () => {
  it("shows no-data placeholder when no quiz history", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);
    expect(screen.getByText(/No data yet/i)).toBeInTheDocument();
  });

  it("shows Start First Practice button when no data", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);
    expect(screen.getByText(/Start First Practice/i)).toBeInTheDocument();
  });

  it("navigates to Practice tab when Start First Practice is clicked", async () => {
    const { TutorApp } = await import("../tutor-app");
    renderWithProviders(<TutorApp questions={MOCK_QUESTIONS} />);

    await act(async () => {
      fireEvent.click(screen.getByText(/Start First Practice/i));
    });

    expect(screen.getByRole("tab", { name: /Practice/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
