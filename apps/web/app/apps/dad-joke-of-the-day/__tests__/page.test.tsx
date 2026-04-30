// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import dadJokeMessages from "../../../../messages/dad-joke-of-the-day/en.json";
import type { DadJoke } from "../lib/types";

const I18N_MESSAGES = { "dad-joke-of-the-day": dadJokeMessages };

// ── Mock next-intl/server (page.tsx is a server component using getTranslations) ──

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (namespace: string) => {
    const parts = namespace.split(".");
    return (key: string, params?: Record<string, unknown>) => {
      let cursor: any = I18N_MESSAGES;
      for (const p of parts) cursor = cursor?.[p];
      let value = cursor?.[key] ?? `${namespace}.${key}`;
      if (params && typeof value === "string") {
        for (const [pk, pv] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${pk}\\}`, "g"), String(pv));
        }
      }
      return value;
    };
  }),
}));

// ── Mock @repo/ui ──────────────────────────────────────────────────────────

vi.mock("@repo/ui", () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Badge: ({ children, className, variant }: any) => (
    <span className={[className, variant].filter(Boolean).join(" ")}>{children}</span>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

// ── Mock @repo/db/client (used by JokeViewer) ──────────────────────────────

vi.mock("@repo/db/client", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ── Mock lib/queries ───────────────────────────────────────────────────────

function makeJoke(overrides: Partial<DadJoke> = {}): DadJoke {
  return {
    id: 1,
    setup: "Why do cows wear bells?",
    punchline: "Because their horns don't work.",
    category: "Animals",
    rating: null,
    times_rated: 0,
    times_shown: 0,
    featured_date: null,
    ...overrides,
  };
}

const mockJokes: DadJoke[] = [
  makeJoke({ id: 1, category: "Animals" }),
  makeJoke({ id: 2, setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese.", category: "Food" }),
];
const mockJOTD = mockJokes[0]!;

vi.mock("../lib/queries", () => ({
  getAllJokes: vi.fn().mockResolvedValue(mockJokes),
  getJokeOfTheDay: vi.fn().mockReturnValue(mockJokes[0]),
  getCategories: vi.fn().mockReturnValue(["Animals", "Food"]),
}));

// ── Mock requireAppLayoutAccess ────────────────────────────────────────────

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("DadJokePage", () => {
  it("renders the heading", async () => {
    const { default: DadJokePage } = await import("../page");
    const jsx = await DadJokePage();
    renderWithProviders(jsx, { messages: I18N_MESSAGES });

    expect(screen.getByText("One Groan Per Day.")).toBeInTheDocument();
  });

  it("renders joke count and category count", async () => {
    const { default: DadJokePage } = await import("../page");
    const jsx = await DadJokePage();
    renderWithProviders(jsx, { messages: I18N_MESSAGES });

    expect(screen.getByText(/2 jokes across 2 categories/)).toBeInTheDocument();
  });

  it("renders the JOTD setup text via JokeViewer", async () => {
    const { default: DadJokePage } = await import("../page");
    const jsx = await DadJokePage();
    renderWithProviders(jsx, { messages: I18N_MESSAGES });

    expect(screen.getByText(mockJOTD.setup)).toBeInTheDocument();
  });

  it("renders EmptyState when no jokes are returned", async () => {
    const { getAllJokes, getJokeOfTheDay } = await import("../lib/queries");
    vi.mocked(getAllJokes).mockResolvedValueOnce([]);
    vi.mocked(getJokeOfTheDay).mockReturnValueOnce(null);

    const { default: DadJokePage } = await import("../page");
    const jsx = await DadJokePage();
    renderWithProviders(jsx, { messages: I18N_MESSAGES });

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No jokes found/)).toBeInTheDocument();
  });

  it("renders category filter badges", async () => {
    const { default: DadJokePage } = await import("../page");
    const jsx = await DadJokePage();
    renderWithProviders(jsx, { messages: I18N_MESSAGES });

    expect(screen.getAllByText("Animals").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Food")).toBeInTheDocument();
  });
});
