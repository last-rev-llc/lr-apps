// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext<{ value: string; onChange: (v: string) => void }>({
    value: "all",
    onChange: () => {},
  });

  function Tabs({ children, value, onValueChange }: any) {
    return (
      <TabsContext.Provider value={{ value, onChange: onValueChange ?? (() => {}) }}>
        <div data-testid="tabs">{children}</div>
      </TabsContext.Provider>
    );
  }

  function TabsList({ children }: any) {
    return <div role="tablist">{children}</div>;
  }

  function TabsTrigger({ value, children }: any) {
    const ctx = React.useContext(TabsContext);
    return (
      <button
        role="tab"
        aria-selected={ctx.value === value}
        onClick={() => ctx.onChange(value)}
      >
        {children}
      </button>
    );
  }

  return {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent: ({ children }: any) => <div>{children}</div>,
    Card: ({ children, className, style }: any) => (
      <div className={className} style={style}>{children}</div>
    ),
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
    Avatar: ({ children, className, style }: any) => (
      <div className={className} style={style}>{children}</div>
    ),
    AvatarFallback: ({ children, className }: any) => (
      <span className={className}>{children}</span>
    ),
    Badge: ({ children, variant, className }: any) => (
      <span className={className} data-variant={variant}>{children}</span>
    ),
    Button: ({ children, onClick, disabled, variant, size, asChild, className }: any) => {
      if (asChild && React.isValidElement(children)) {
        return children;
      }
      return (
        <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
          {children}
        </button>
      );
    },
    EmptyState: ({ title, icon, className }: any) => (
      <div className={className} data-testid="empty-state">
        {icon && <span>{icon}</span>}
        <p>{title}</p>
      </div>
    ),
  };
});

import { FeedApp } from "../components/feed-app";
import type { DailyUpdate, AppProfile } from "../lib/types";

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeUpdate(overrides: Partial<DailyUpdate> = {}): DailyUpdate {
  return {
    id: "update-1",
    title: "New deploy on command-center",
    body: "Deployed v2.3.1 with performance improvements.",
    source_app: "command-center",
    source_name: "Command Center",
    source_icon: "🎮",
    category: "deploy",
    priority: "normal",
    reactions: {},
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const MOCK_UPDATES: DailyUpdate[] = [
  makeUpdate({ id: "u1", title: "Command Center deploy", source_app: "command-center", category: "deploy" }),
  makeUpdate({ id: "u2", title: "CRM bug fix", source_app: "crm", source_name: "CRM", source_icon: "📇", category: "bugfix", body: "Fixed null pointer in contacts view." }),
  makeUpdate({ id: "u3", title: "High priority alert", source_app: "command-center", category: "alert", priority: "high", body: "Database latency spiked." }),
];

const MOCK_PROFILES: AppProfile[] = [];
const MOCK_CATEGORIES = ["deploy", "bugfix", "alert"];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("FeedApp — rendering", () => {
  it("renders all feed updates", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    expect(screen.getByText("Command Center deploy")).toBeInTheDocument();
    expect(screen.getByText("CRM bug fix")).toBeInTheDocument();
    expect(screen.getByText("High priority alert")).toBeInTheDocument();
  });

  it("shows source names as profile badges", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    expect(screen.getAllByText("Command Center").length).toBeGreaterThan(0);
    expect(screen.getByText("CRM")).toBeInTheDocument();
  });

  it("shows source icons via Avatar", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    expect(screen.getAllByText("🎮").length).toBeGreaterThan(0);
    expect(screen.getByText("📇")).toBeInTheDocument();
  });

  it("shows high-priority badge for high priority updates", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    expect(screen.getAllByText(/🔥 High/i).length).toBeGreaterThan(0);
  });

  it("shows category badges", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    // categories are formatted: "deploy" -> "Deploy"
    expect(screen.getAllByText("Deploy").length).toBeGreaterThan(0);
  });
});

describe("FeedApp — search filtering", () => {
  it("filters updates by title text", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    const searchInput = screen.getByPlaceholderText(/Search updates/i);
    fireEvent.change(searchInput, { target: { value: "CRM" } });

    expect(screen.getByText("CRM bug fix")).toBeInTheDocument();
    expect(screen.queryByText("Command Center deploy")).not.toBeInTheDocument();
  });

  it("filters updates by body text", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    const searchInput = screen.getByPlaceholderText(/Search updates/i);
    fireEvent.change(searchInput, { target: { value: "latency" } });

    expect(screen.getByText("High priority alert")).toBeInTheDocument();
    expect(screen.queryByText("CRM bug fix")).not.toBeInTheDocument();
  });

  it("shows empty state when no updates match search", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    const searchInput = screen.getByPlaceholderText(/Search updates/i);
    fireEvent.change(searchInput, { target: { value: "zzznomatch" } });

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });
});

describe("FeedApp — category filtering", () => {
  it("filters updates by category select", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    const categorySelect = screen.getByDisplayValue("All Categories");
    fireEvent.change(categorySelect, { target: { value: "bugfix" } });

    expect(screen.getByText("CRM bug fix")).toBeInTheDocument();
    expect(screen.queryByText("Command Center deploy")).not.toBeInTheDocument();
  });
});

describe("FeedApp — time range tabs", () => {
  it("renders time-range tab triggers", () => {
    renderWithProviders(
      <FeedApp initialUpdates={MOCK_UPDATES} profiles={MOCK_PROFILES} categories={MOCK_CATEGORIES} />,
    );
    expect(screen.getByRole("tab", { name: /All Time/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /This Week/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /This Month/i })).toBeInTheDocument();
  });

  it("filters to only today's updates when Today tab is selected", () => {
    const pastUpdate = makeUpdate({
      id: "old",
      title: "Old update from last week",
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const todayUpdate = makeUpdate({
      id: "today",
      title: "Today fresh update",
      created_at: new Date().toISOString(),
    });

    renderWithProviders(
      <FeedApp
        initialUpdates={[pastUpdate, todayUpdate]}
        profiles={MOCK_PROFILES}
        categories={[]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Today/i }));

    expect(screen.getByText("Today fresh update")).toBeInTheDocument();
    expect(screen.queryByText("Old update from last week")).not.toBeInTheDocument();
  });
});

describe("FeedApp — reactions", () => {
  it("increments reaction count when reaction button is clicked", () => {
    renderWithProviders(
      <FeedApp initialUpdates={[MOCK_UPDATES[0]]} profiles={MOCK_PROFILES} categories={[]} />,
    );
    // Find all reaction buttons (🔥, ❤️, etc.) — click the first one
    const reactionButtons = screen.getAllByRole("button", { name: /🔥/ });
    expect(reactionButtons.length).toBeGreaterThan(0);
    fireEvent.click(reactionButtons[0]);
    // After clicking, a count "1" should appear next to the emoji
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("FeedApp — empty state", () => {
  it("shows empty state when no updates provided", () => {
    renderWithProviders(
      <FeedApp initialUpdates={[]} profiles={MOCK_PROFILES} categories={[]} />,
    );
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });
});
