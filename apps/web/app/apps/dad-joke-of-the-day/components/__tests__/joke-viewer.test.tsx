// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  renderWithProviders,
  screen,
  fireEvent,
  createMockSupabase,
} from "@repo/test-utils";
import type { DadJoke } from "../../lib/types";

// Mock @repo/db/client
const mockSupabase = createMockSupabase();
vi.mock("@repo/db/client", () => ({
  createClient: () => mockSupabase,
}));

// Mock @repo/ui — provide minimal real elements
vi.mock("@repo/ui", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    title,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button onClick={onClick} disabled={disabled} title={title} {...rest}>
      {children}
    </button>
  ),
  Badge: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) => (
    <span {...rest}>{children}</span>
  ),
  Card: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
  CardContent: ({
    children,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
}));

import { JokeViewer } from "../joke-viewer";

function makeJoke(overrides: Partial<DadJoke> = {}): DadJoke {
  return {
    id: 1,
    setup: "Why did the chicken cross the road?",
    punchline: "To get to the other side!",
    category: "Classic",
    rating: null,
    times_rated: 0,
    times_shown: 0,
    featured_date: null,
    ...overrides,
  };
}

const defaultJoke = makeJoke();
const defaultProps = {
  jokes: [defaultJoke],
  initialJoke: defaultJoke,
  categories: ["Classic"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase._builder.single.mockResolvedValue({
    data: { times_shown: 0, rating: null, times_rated: 0 },
    error: null,
  });
});

describe("JokeViewer", () => {
  it("renders setup text", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    expect(screen.getByText("Why did the chicken cross the road?")).toBeTruthy();
  });

  it("hides punchline initially", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    expect(screen.queryByText("To get to the other side!")).toBeNull();
  });

  it("shows reveal button", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    expect(screen.getByText(/Reveal Punchline/)).toBeTruthy();
  });

  it("shows JOTD mode badge on initial render", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    const badges = screen.getAllByText(/Joke of the Day/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("reveals punchline on button click", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    fireEvent.click(screen.getByText(/Reveal Punchline/));
    expect(screen.getByText("To get to the other side!")).toBeTruthy();
  });

  it("shows rating buttons after punchline reveal", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    fireEvent.click(screen.getByText(/Reveal Punchline/));
    expect(screen.getByText("Rate this joke:")).toBeTruthy();
    expect(screen.getByTitle("Groan-worthy")).toBeTruthy();
    expect(screen.getByTitle("Actually funny")).toBeTruthy();
  });

  it("renders category filter badges", () => {
    const props = {
      ...defaultProps,
      jokes: [
        makeJoke({ id: 1, category: "Classic" }),
        makeJoke({ id: 2, category: "Puns" }),
      ],
      categories: ["Classic", "Puns"],
    };
    renderWithProviders(<JokeViewer {...props} />);
    expect(screen.getByText("All")).toBeTruthy();
    // "Classic" appears in filter and card footer
    expect(screen.getAllByText("Classic").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Puns")).toBeTruthy();
  });

  it("shows filtered pool count after selecting a category", () => {
    const jokes = [
      makeJoke({ id: 1, category: "Classic" }),
      makeJoke({ id: 2, category: "Classic" }),
      makeJoke({ id: 3, category: "Puns" }),
    ];
    const props = {
      jokes,
      initialJoke: jokes[0]!,
      categories: ["Classic", "Puns"],
    };
    renderWithProviders(<JokeViewer {...props} />);

    // Click Puns category filter
    const punsButtons = screen.getAllByText("Puns");
    fireEvent.click(punsButtons[0]!);

    expect(screen.getByText(/1 joke in Puns/)).toBeTruthy();
  });

  it("switches to random mode after clicking random button", () => {
    const jokes = [
      makeJoke({ id: 1, setup: "Setup 1" }),
      makeJoke({ id: 2, setup: "Setup 2" }),
    ];
    const props = {
      jokes,
      initialJoke: jokes[0]!,
      categories: ["Classic"],
    };
    renderWithProviders(<JokeViewer {...props} />);

    // Click the Random Joke navigation button
    const buttons = screen.getAllByText(/Random Joke/);
    fireEvent.click(buttons[0]!);

    // Mode badge should now show Random Joke (rendered as <span>)
    const badgeSpan = screen.getAllByText(/Random Joke/).find(
      (el) => el.tagName === "SPAN",
    );
    expect(badgeSpan).toBeTruthy();
  });

  it("displays joke category badge on the card", () => {
    renderWithProviders(<JokeViewer {...defaultProps} />);
    const badges = screen.getAllByText("Classic");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });
});
