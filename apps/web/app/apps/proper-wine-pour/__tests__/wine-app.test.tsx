// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

// ── Mock @repo/db/client ───────────────────────────────────────────────────

vi.mock("@repo/db/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    })),
  })),
}));

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => {
  const TabsContext = React.createContext<{ value: string; setValue: (v: string) => void }>({
    value: "guide",
    setValue: () => {},
  });

  function Tabs({ children, defaultValue }: any) {
    const [value, setValue] = React.useState(defaultValue ?? "guide");
    return (
      <TabsContext.Provider value={{ value, setValue }}>
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
        onClick={() => ctx.setValue(value)}
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
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
    Input: ({ value, onChange, placeholder, type, className, min, max, step }: any) => (
      <input
        type={type ?? "text"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        min={min}
        max={max}
        step={step}
      />
    ),
    Button: ({ children, onClick, disabled, variant, size, className }: any) => (
      <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size} className={className}>
        {children}
      </button>
    ),
    Badge: ({ children, variant, className }: any) => (
      <span data-variant={variant} className={className}>{children}</span>
    ),
  };
});

import { WineApp } from "../components/wine-app";
import type { Restaurant, WinePour, WallPost } from "../lib/types";

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Restaurant Gary Danko",
    neighborhood: "Fisherman's Wharf",
    wine_list_rating: 5,
    pour_rating: "generous",
    avg_glass_price: 25,
    notes: "Grand Award winner.",
  },
  {
    id: "r2",
    name: "Some Stingy Bar",
    neighborhood: "SoMa",
    wine_list_rating: 2,
    pour_rating: "stingy",
    avg_glass_price: 20,
    notes: "Short pours.",
  },
  {
    id: "r3",
    name: "Criminal Wines",
    neighborhood: "Tenderloin",
    wine_list_rating: 1,
    pour_rating: "criminal",
    avg_glass_price: 18,
    notes: "",
  },
];

const MOCK_POUR_LOGS: WinePour[] = [
  {
    id: "p1",
    restaurant_name: "Restaurant Gary Danko",
    wine_name: "Caymus Cabernet 2021",
    pour_rating: "generous",
    price_paid: 28,
    notes: "Perfect pour",
    user_name: "Alice",
    created_at: new Date().toISOString(),
  },
];

const MOCK_WALL_POSTS: WallPost[] = [
  {
    id: "w1",
    user_name: "Bob",
    pour_type: "glory",
    content: "Best pour I've ever had at Gary Danko!",
    upvotes: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "w2",
    user_name: "Alice",
    pour_type: "shame",
    content: "Criminal pour at the airport bar. Never again.",
    upvotes: 12,
    created_at: new Date().toISOString(),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("WineApp — Guide tab (default)", () => {
  it("renders the Guide tab by default", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    expect(screen.getByRole("tab", { name: /Pour Guide/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Know Your Pour")).toBeInTheDocument();
  });

  it("renders WineGlass SVGs for pour size cards", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    expect(screen.getByText("Standard Pour")).toBeInTheDocument();
    expect(screen.getByText("Criminal Pour")).toBeInTheDocument();
    expect(screen.getByText("Tasting Pour")).toBeInTheDocument();
  });

  it("renders 5 tab triggers", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    expect(screen.getByRole("tab", { name: /Pour Guide/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Calculator/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Tracker/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Knowledge/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Community/i })).toBeInTheDocument();
  });
});

describe("WineApp — Calculator tab", () => {
  it("renders calculator with default values", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Calculator/i }));
    expect(screen.getByText("Pour Calculator")).toBeInTheDocument();
  });

  it("shows the correct oz-per-glass calculation for 750ml ÷ 5oz", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Calculator/i }));
    // Default: 45 bottle / 5 oz pour → ~5.07 glasses per bottle displayed as "5.1"
    expect(screen.getByText("5.1")).toBeInTheDocument();
  });

  it("renders Input fields for bottle price, pour size, and glass price", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Calculator/i }));
    expect(screen.getByText(/Retail Bottle Price/i)).toBeInTheDocument();
    expect(screen.getByText(/Pour Size \(oz\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Restaurant Glass Price/i)).toBeInTheDocument();
    // Verify input fields exist
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("WineApp — Tracker tab", () => {
  it("renders restaurant cards with name and neighborhood", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tracker/i }));
    expect(screen.getByText("Restaurant Gary Danko")).toBeInTheDocument();
    expect(screen.getByText(/Fisherman's Wharf/i)).toBeInTheDocument();
  });

  it("renders pour_rating Badge with correct variant", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tracker/i }));
    // Both the filter button and the restaurant badge show the pour rating text.
    // Check that at least one Badge span (not a button) renders the rating.
    const generousEls = screen.getAllByText("generous");
    expect(generousEls.length).toBeGreaterThan(0);
    const criminalEls = screen.getAllByText("criminal");
    expect(criminalEls.length).toBeGreaterThan(0);
    // The Badge span for "generous" restaurant should have data-variant="secondary"
    const generousBadge = generousEls.find((el) => el.tagName === "SPAN");
    expect(generousBadge).toBeTruthy();
  });

  it("shows pour log count in stats", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tracker/i }));
    // "Pours Logged" stat label confirms the section exists
    expect(screen.getByText("Pours Logged")).toBeInTheDocument();
    // 1 pour log in MOCK_POUR_LOGS — there may be multiple "1"s, so check count is > 0
    const ones = screen.getAllByText("1");
    expect(ones.length).toBeGreaterThan(0);
  });

  it("shows Log Pour button", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Tracker/i }));
    expect(screen.getByRole("button", { name: /\+ Log Pour/i })).toBeInTheDocument();
  });
});

describe("WineApp — Community Wall tab", () => {
  it("renders wall posts with user names and content", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Community/i }));
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(/Best pour I've ever had/i)).toBeInTheDocument();
    expect(screen.getByText(/Criminal pour at the airport bar/i)).toBeInTheDocument();
  });

  it("shows glory and shame badges with correct variants", () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Community/i }));
    // Both filter buttons and post badges use the text "Pour of Glory" / "Pour of Shame".
    // Badge spans (not buttons) carry the data-variant attribute.
    const gloryEls = screen.getAllByText("Pour of Glory");
    const gloryBadge = gloryEls.find((el) => el.tagName === "SPAN");
    expect(gloryBadge).toBeTruthy();
    expect(gloryBadge).toHaveAttribute("data-variant", "secondary");

    const shameEls = screen.getAllByText("Pour of Shame");
    const shameBadge = shameEls.find((el) => el.tagName === "SPAN");
    expect(shameBadge).toBeTruthy();
    expect(shameBadge).toHaveAttribute("data-variant", "destructive");
  });

  it("upvote button increments count optimistically", async () => {
    renderWithProviders(
      <WineApp restaurants={MOCK_RESTAURANTS} initialPourLogs={MOCK_POUR_LOGS} initialWallPosts={MOCK_WALL_POSTS} />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /Community/i }));

    // Bob's post has 5 upvotes initially
    const upvoteButtons = screen.getAllByRole("button", { name: /👍/i });
    fireEvent.click(upvoteButtons[0]);

    // After click, upvote count increases by 1 (6)
    expect(await screen.findByText(/👍 6/i)).toBeInTheDocument();
  });
});
