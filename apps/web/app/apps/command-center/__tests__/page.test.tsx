// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

// StatCard uses IntersectionObserver to trigger count-up animation
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: vi.fn(() => {
      // Immediately trigger as visible so count-up runs
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import CommandCenterPage from "../page";

const EXPECTED_MODULES = [
  { slug: "leads", label: "Leads", icon: "🎯", category: "Sales" },
  { slug: "agents", label: "Agents", icon: "🤖", category: "AI" },
  { slug: "ideas", label: "Ideas", icon: "💡", category: "Product" },
  { slug: "recipes", label: "Recipes", icon: "📋", category: "Ops" },
  { slug: "users", label: "Users", icon: "👥", category: "Admin" },
  { slug: "crons", label: "Crons", icon: "⏰", category: "Ops" },
  { slug: "gallery", label: "Gallery", icon: "🖼️", category: "Content" },
  { slug: "architecture", label: "Architecture", icon: "🏗️", category: "Dev" },
  { slug: "client-health", label: "Client Health", icon: "💚", category: "Ops" },
  { slug: "concerts", label: "Concerts", icon: "🎵", category: "Personal" },
  { slug: "contentful", label: "Contentful", icon: "📦", category: "Dev" },
  { slug: "iron", label: "Iron", icon: "🔩", category: "Dev" },
  { slug: "meeting-summaries", label: "Meeting Summaries", icon: "📝", category: "Ops" },
  { slug: "meme-generator", label: "Meme Generator", icon: "😂", category: "Fun" },
  { slug: "pr-review", label: "PR Review", icon: "🔍", category: "Dev" },
  { slug: "rizz-guide", label: "Rizz Guide", icon: "✨", category: "Fun" },
  { slug: "shopping-list", label: "Shopping List", icon: "🛒", category: "Personal" },
  { slug: "team-usf", label: "Team USF", icon: "🏫", category: "Admin" },
  { slug: "ai-scripts", label: "AI Scripts", icon: "🤖", category: "AI" },
  { slug: "app-access", label: "App Access", icon: "🔐", category: "Admin" },
  { slug: "alphaclaw", label: "AlphaClaw", icon: "🦅", category: "Admin" },
];

describe("CommandCenterPage", () => {
  it("renders all 21 module cards", () => {
    renderWithProviders(<CommandCenterPage />);

    for (const mod of EXPECTED_MODULES) {
      expect(screen.getByText(mod.label)).toBeInTheDocument();
    }
  });

  it("renders correct description for each module", () => {
    renderWithProviders(<CommandCenterPage />);

    expect(screen.getByText("Lead research and company fit scores")).toBeInTheDocument();
    expect(screen.getByText("AI agent management and monitoring")).toBeInTheDocument();
    expect(screen.getByText("AlphaClaw platform management")).toBeInTheDocument();
  });

  it("renders category badges for each module", () => {
    renderWithProviders(<CommandCenterPage />);

    // Each category should appear at least once
    for (const cat of ["Sales", "AI", "Product", "Ops", "Admin", "Dev", "Content", "Personal", "Fun"]) {
      expect(screen.getAllByText(cat).length).toBeGreaterThan(0);
    }
  });

  it("links each card to /apps/command-center/{slug}", () => {
    renderWithProviders(<CommandCenterPage />);

    for (const mod of EXPECTED_MODULES) {
      const link = screen.getByText(mod.label).closest("a");
      expect(link).toHaveAttribute("href", `/apps/command-center/${mod.slug}`);
    }
  });

  it("renders all four stat cards with correct labels", () => {
    renderWithProviders(<CommandCenterPage />);

    // StatCard labels are always visible; numeric values animate via
    // requestAnimationFrame so we verify labels + the non-numeric "Active"
    expect(screen.getByText("Modules")).toBeInTheDocument();
    expect(screen.getByText("Routes")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    // "Active" is a string value — rendered immediately (no count-up)
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the page header", () => {
    renderWithProviders(<CommandCenterPage />);

    expect(screen.getByText("⚡ Command Center")).toBeInTheDocument();
  });

  it("shows total module count in section header", () => {
    renderWithProviders(<CommandCenterPage />);

    expect(screen.getByText("All Modules")).toBeInTheDocument();
    expect(screen.getByText("21 total")).toBeInTheDocument();
  });
});
