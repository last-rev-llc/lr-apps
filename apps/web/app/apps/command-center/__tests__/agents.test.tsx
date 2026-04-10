// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: vi.fn(() => {
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

vi.mock("@repo/db/client", () => ({ createClient: vi.fn(() => ({})) }));

import { AgentsApp } from "../agents/components/agents-app";

const FIXTURE_AGENTS = [
  {
    id: "agent-1",
    name: "Data Collector",
    type: "scraper",
    status: "active" as const,
    description: "Collects data from sources",
  },
  {
    id: "agent-2",
    name: "Report Generator",
    type: "reporter",
    status: "error" as const,
    description: "Generates reports",
  },
];

describe("AgentsApp", () => {
  it("renders empty state when no agents", () => {
    renderWithProviders(<AgentsApp initialAgents={[]} />);
    expect(screen.getByText("No agents found")).toBeInTheDocument();
  });

  it("renders agent cards with names", () => {
    renderWithProviders(<AgentsApp initialAgents={FIXTURE_AGENTS} />);
    expect(screen.getByText("Data Collector")).toBeInTheDocument();
    expect(screen.getByText("Report Generator")).toBeInTheDocument();
  });

  it("renders status badge for each agent", () => {
    renderWithProviders(<AgentsApp initialAgents={FIXTURE_AGENTS} />);
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("renders stats summary with counts", () => {
    renderWithProviders(<AgentsApp initialAgents={FIXTURE_AGENTS} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    // "Active" appears in both the stat card label and the status filter button
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("Errors")).toBeInTheDocument();
  });
});
