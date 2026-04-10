// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { act } from "react";

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

import { LeadsApp } from "../leads/components/leads-app";

const FIXTURE_LEADS = [
  {
    id: "1",
    name: "Acme Corp",
    domain: "acme.com",
    fitScore: 9,
    people: [],
    techStack: {},
    description: "A great company",
    fitReasons: ["Good fit"],
    talkingPoints: ["Point 1"],
  },
  {
    id: "2",
    name: "Beta Inc",
    domain: "beta.com",
    fitScore: 4,
    people: [],
    techStack: {},
    description: "Another company",
    fitReasons: [],
    talkingPoints: [],
  },
];

describe("LeadsApp", () => {
  it("renders empty state when no leads", () => {
    renderWithProviders(<LeadsApp initialLeads={[]} />);
    expect(screen.getByText("No leads match your search")).toBeInTheDocument();
  });

  it("renders lead cards with names", () => {
    renderWithProviders(<LeadsApp initialLeads={FIXTURE_LEADS} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
  });

  it("renders fit score badge for high score", () => {
    renderWithProviders(<LeadsApp initialLeads={FIXTURE_LEADS} />);
    // Score 9 should appear in the fit score badge
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("filters by search query", () => {
    vi.useFakeTimers();
    renderWithProviders(<LeadsApp initialLeads={FIXTURE_LEADS} />);
    const searchInput = screen.getByPlaceholderText("Search companies, people, domains…");
    fireEvent.change(searchInput, { target: { value: "Acme" } });
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Inc")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
