// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { act } from "react";

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
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Area52App } from "../components/area-52-app";
import type { Experiment } from "../lib/types";

const FIXTURE_EXPERIMENTS: Experiment[] = [
  {
    id: "exp-1",
    title: "Neural Search Prototype",
    description: "Exploring vector search for internal knowledge base",
    status: "active",
    category: "ai",
    owner: "Adam",
  },
  {
    id: "exp-2",
    title: "Edge Config Caching",
    description: "Testing Vercel edge config for feature flags",
    status: "exploring",
    category: "infra",
    owner: "Team",
  },
  {
    id: "exp-3",
    title: "Old Concept",
    description: "An idea that didn't pan out",
    status: "shelved",
    category: "ux",
  },
];

describe("Area52App", () => {
  it("renders empty state when no experiments", () => {
    renderWithProviders(<Area52App initialExperiments={[]} />);
    expect(screen.getByText("No experiments found")).toBeInTheDocument();
  });

  it("renders experiment cards", () => {
    renderWithProviders(<Area52App initialExperiments={FIXTURE_EXPERIMENTS} />);
    expect(screen.getByText("Neural Search Prototype")).toBeInTheDocument();
    expect(screen.getByText("Edge Config Caching")).toBeInTheDocument();
    expect(screen.getByText("Old Concept")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    renderWithProviders(<Area52App initialExperiments={FIXTURE_EXPERIMENTS} />);
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("exploring")).toBeInTheDocument();
    expect(screen.getByText("shelved")).toBeInTheDocument();
  });

  it("filters by search query", () => {
    vi.useFakeTimers();
    renderWithProviders(<Area52App initialExperiments={FIXTURE_EXPERIMENTS} />);
    const input = screen.getByPlaceholderText("Search experiments…");
    fireEvent.change(input, { target: { value: "Neural" } });
    act(() => { vi.advanceTimersByTime(400); });
    expect(screen.getByText("Neural Search Prototype")).toBeInTheDocument();
    expect(screen.queryByText("Edge Config Caching")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("filters by status", () => {
    renderWithProviders(<Area52App initialExperiments={FIXTURE_EXPERIMENTS} />);
    const activeBtn = screen.getByRole("button", { name: "Active" });
    fireEvent.click(activeBtn);
    expect(screen.getByText("Neural Search Prototype")).toBeInTheDocument();
    expect(screen.queryByText("Edge Config Caching")).not.toBeInTheDocument();
  });
});
