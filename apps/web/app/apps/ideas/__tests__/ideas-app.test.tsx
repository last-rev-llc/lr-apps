// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting: true }], {});
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("../actions", () => ({
  rateIdea: vi.fn(async () => ({ ok: true, idea: {} })),
  toggleHideIdea: vi.fn(async () => ({ ok: true, idea: {} })),
  snoozeIdea: vi.fn(async () => ({ ok: true, idea: {} })),
  archiveIdea: vi.fn(async () => ({ ok: true, idea: {} })),
  deleteIdea: vi.fn(async () => ({ ok: true })),
  setIdeaStatus: vi.fn(async () => ({ ok: true, idea: {} })),
  createIdea: vi.fn(async () => ({ ok: true, idea: {} })),
  updateIdea: vi.fn(async () => ({ ok: true, idea: {} })),
}));

import { IdeasApp } from "../components/ideas-app";
import type { Idea } from "../lib/types";

const makeIdea = (overrides: Partial<Idea> = {}): Idea => ({
  id: "idea-1",
  title: "Test Idea",
  description: "A test description",
  category: "Product",
  status: "new",
  source: "manual",
  feasibility: 7,
  impact: 8,
  effort: "Low",
  compositeScore: null,
  tags: ["test"],
  author: null,
  sourceUrl: null,
  rating: null,
  hidden: null,
  snoozedUntil: null,
  createdAt: null,
  updatedAt: null,
  completedAt: null,
  ...overrides,
});

const FIXTURE_IDEAS: Idea[] = [
  makeIdea({ id: "idea-1", title: "Build AI dashboard", category: "Product", status: "new", tags: ["ai", "dashboard"] }),
  makeIdea({ id: "idea-2", title: "Create content templates", category: "Content", status: "backlog", effort: "Medium", rating: 4 }),
  makeIdea({ id: "idea-3", title: "Technical refactor", category: "Technical", status: "in-progress", effort: "High" }),
];

describe("IdeasApp", () => {
  it("renders EmptyState when no ideas match the active filter", () => {
    // Pass ideas that are all hidden so active filter shows none
    const hiddenIdeas = FIXTURE_IDEAS.map((i) => ({ ...i, hidden: true }));
    renderWithProviders(<IdeasApp initialIdeas={hiddenIdeas} />);
    expect(screen.getByText("No ideas match that filter")).toBeInTheDocument();
  });

  it("renders idea cards with key fields when ideas are provided", () => {
    // Use showFilter "all" by default isn't set — but ideas are status new so active filter should show them
    renderWithProviders(<IdeasApp initialIdeas={FIXTURE_IDEAS} />);
    expect(screen.getByText("Build AI dashboard")).toBeInTheDocument();
    expect(screen.getByText("Create content templates")).toBeInTheDocument();
    expect(screen.getByText("Technical refactor")).toBeInTheDocument();
  });

  it("renders category badges for each idea", () => {
    renderWithProviders(<IdeasApp initialIdeas={FIXTURE_IDEAS} />);
    // Category text appears in both filter pills and idea badges
    expect(screen.getAllByText("Product").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Content").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
  });

  it("renders effort badges when effort is set", () => {
    renderWithProviders(<IdeasApp initialIdeas={FIXTURE_IDEAS} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
