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

vi.mock("@repo/db/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

import { CronsApp } from "../crons/components/crons-app";

const FIXTURE_CRONS = [
  {
    id: "cron-1",
    name: "Daily Report",
    enabled: true,
    schedule: "0 9 * * *",
    scheduleHuman: "Every day at 9am",
    lastStatus: "success" as const,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    category: "Reports",
  },
  {
    id: "cron-2",
    name: "Weekly Cleanup",
    enabled: false,
    schedule: "0 0 * * 0",
    scheduleHuman: "Every Sunday at midnight",
    lastStatus: undefined,
    lastRun: undefined,
    category: undefined,
  },
];

describe("CronsApp", () => {
  it("renders empty state when no crons", () => {
    renderWithProviders(<CronsApp initialCrons={[]} />);
    expect(screen.getByText("No crons match your search")).toBeInTheDocument();
  });

  it("renders cron cards with names", () => {
    renderWithProviders(<CronsApp initialCrons={FIXTURE_CRONS} />);
    expect(screen.getByText("Daily Report")).toBeInTheDocument();
    expect(screen.getByText("Weekly Cleanup")).toBeInTheDocument();
  });

  it("renders enabled/disabled status text", () => {
    renderWithProviders(<CronsApp initialCrons={FIXTURE_CRONS} />);
    expect(screen.getByText("● Enabled")).toBeInTheDocument();
    expect(screen.getByText("○ Disabled")).toBeInTheDocument();
  });

  it("renders category badge when category is set", () => {
    renderWithProviders(<CronsApp initialCrons={FIXTURE_CRONS} />);
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });
});
