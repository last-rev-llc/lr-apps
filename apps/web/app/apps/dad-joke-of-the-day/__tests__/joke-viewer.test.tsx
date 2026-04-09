// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import type { DadJoke } from "../lib/types";

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className ?? ""}>
      {children}
    </button>
  ),
  Badge: ({ children, onClick, onKeyDown, role, tabIndex, className, variant }: any) => (
    <span
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={[className, variant].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  ),
  Card: ({ children, className }: any) => <div className={className ?? ""}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className ?? ""}>{children}</div>,
}));

// ── Mock @repo/db/client ───────────────────────────────────────────────────

const { mockDbBuilder, mockDbClient } = vi.hoisted(() => {
  const builder: Record<string, any> = {};
  const chainMethods = ["select", "update", "eq", "order"];
  for (const m of chainMethods) builder[m] = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.then = vi.fn().mockImplementation((resolve: any) =>
    Promise.resolve({ data: null, error: null }).then(resolve),
  );

  const client = { from: vi.fn().mockReturnValue(builder) };
  return { mockDbBuilder: builder, mockDbClient: client };
});

vi.mock("@repo/db/client", () => ({
  createClient: vi.fn().mockReturnValue(mockDbClient),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeJoke(overrides: Partial<DadJoke> = {}): DadJoke {
  return {
    id: 1,
    setup: "Why did the bicycle fall over?",
    punchline: "Because it was two-tired.",
    category: "Puns",
    rating: null,
    times_rated: 0,
    times_shown: 0,
    featured_date: null,
    ...overrides,
  };
}

const punsJoke = makeJoke({ id: 1, setup: "Pun setup", punchline: "Pun punchline", category: "Puns" });
const animalsJoke = makeJoke({ id: 2, setup: "Animal setup", punchline: "Animal punchline", category: "Animals" });
const JOKES = [punsJoke, animalsJoke];
const CATEGORIES = ["Animals", "Puns"];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("JokeViewer", () => {
  it("renders the initial joke setup text", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    expect(screen.getByText("Pun setup")).toBeInTheDocument();
  });

  it("hides the punchline by default", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    expect(screen.queryByText("Pun punchline")).not.toBeInTheDocument();
  });

  it("shows the reveal punchline button by default", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    expect(screen.getByText(/Reveal Punchline/i)).toBeInTheDocument();
  });

  it("reveals the punchline after clicking the reveal button", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Reveal Punchline/i));
    });

    expect(screen.getByText("Pun punchline")).toBeInTheDocument();
  });

  it("renders category filter badges for all categories", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    expect(screen.getAllByText("Animals").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Puns").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("shows JOTD mode badge by default", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    expect(screen.getAllByText(/Joke of the Day/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders navigation buttons: Random Joke and Joke of the Day", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    expect(screen.getByRole("button", { name: /Random Joke/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Joke of the Day/i })).toBeInTheDocument();
  });

  it("switches to a different joke when category is selected", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );

    // Click the Animals category badge
    const animalsBadge = screen.getByText("Animals");
    await act(async () => {
      fireEvent.click(animalsBadge);
    });

    // The animals joke should now be shown (only 1 joke in Animals pool)
    expect(screen.getByText("Animal setup")).toBeInTheDocument();
  });

  it("shows pool count when a specific category is selected", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );

    const animalsBadge = screen.getByText("Animals");
    await act(async () => {
      fireEvent.click(animalsBadge);
    });

    expect(screen.getByText(/1 joke in Animals/i)).toBeInTheDocument();
  });

  it("shows rating buttons after punchline is revealed", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Reveal Punchline/i));
    });

    expect(screen.getByText(/Rate this joke/i)).toBeInTheDocument();
  });

  it("renders the current joke's category badge", async () => {
    const { JokeViewer } = await import("../components/joke-viewer");
    renderWithProviders(
      <JokeViewer jokes={JOKES} initialJoke={punsJoke} categories={CATEGORIES} />,
    );
    // "Puns" appears as both a filter badge and the joke's category label
    const punsElements = screen.getAllByText("Puns");
    expect(punsElements.length).toBeGreaterThanOrEqual(1);
  });
});
