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

import { RecipesApp } from "../recipes/components/recipes-app";
import type { Recipe } from "../recipes/lib/types";

const FIXTURE_RECIPES: Recipe[] = [
  {
    id: "r1",
    name: "Blog Post Generator",
    description: "Generate SEO-optimized blog posts with AI",
    type: "App",
    icon: "📝",
    tags: ["ai", "content"],
    integrations: ["Claude"],
  },
  {
    id: "r2",
    name: "Slack Notifier",
    description: "Send Slack notifications on cron completion",
    type: "Automation",
    icon: "🔔",
    tags: ["slack", "crons"],
    integrations: ["Slack"],
  },
  {
    id: "r3",
    name: "Code Review Skill",
    description: "AI code review assistant for PRs",
    type: "Skill",
    icon: "🔍",
    tags: ["code", "review"],
    integrations: [],
  },
];

describe("RecipesApp", () => {
  it("renders EmptyState when no recipes match filter", () => {
    renderWithProviders(<RecipesApp initialRecipes={[]} />);
    expect(screen.getByText("No recipes match that filter")).toBeInTheDocument();
  });

  it("renders recipe cards with names when recipes are provided", () => {
    renderWithProviders(<RecipesApp initialRecipes={FIXTURE_RECIPES} />);
    expect(screen.getByText("Blog Post Generator")).toBeInTheDocument();
    expect(screen.getByText("Slack Notifier")).toBeInTheDocument();
    expect(screen.getByText("Code Review Skill")).toBeInTheDocument();
  });

  it("renders type badges for each recipe", () => {
    renderWithProviders(<RecipesApp initialRecipes={FIXTURE_RECIPES} />);
    expect(screen.getByText("App")).toBeInTheDocument();
    expect(screen.getByText("Automation")).toBeInTheDocument();
    expect(screen.getByText("Skill")).toBeInTheDocument();
  });

  it("renders descriptions for each recipe", () => {
    renderWithProviders(<RecipesApp initialRecipes={FIXTURE_RECIPES} />);
    expect(screen.getByText("Generate SEO-optimized blog posts with AI")).toBeInTheDocument();
    expect(screen.getByText("Send Slack notifications on cron completion")).toBeInTheDocument();
  });
});
