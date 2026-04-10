// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";

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

import { LighthouseApp } from "../components/lighthouse-app";
import type { LighthouseSite } from "../lib/types";

const FIXTURE_RUN_1 = {
  id: "run-1",
  siteId: "site-1",
  performance: 95,
  accessibility: 88,
  bestPractices: 92,
  seo: 100,
  lcp: 1800,
  fid: 50,
  cls: 0.05,
  fcp: 1200,
  ttfb: 400,
  runAt: "2026-04-01T12:00:00Z",
};

const FIXTURE_SITES: LighthouseSite[] = [
  {
    id: "site-1",
    name: "Main Site",
    url: "https://example.com",
    latestRun: FIXTURE_RUN_1,
  },
  {
    id: "site-2",
    name: "Blog",
    url: "https://blog.example.com",
    latestRun: {
      id: "run-2",
      siteId: "site-2",
      performance: 45,
      accessibility: 72,
      bestPractices: 58,
      seo: 80,
      lcp: 5000,
      fid: 400,
      cls: 0.3,
      fcp: 3500,
      ttfb: 2000,
      runAt: "2026-04-01T12:00:00Z",
    },
  },
];

describe("LighthouseApp", () => {
  it("renders empty state when no sites tracked", () => {
    renderWithProviders(<LighthouseApp initialSites={[]} />);
    expect(screen.getByText("No sites tracked")).toBeInTheDocument();
  });

  it("renders sites table with site names", () => {
    renderWithProviders(<LighthouseApp initialSites={FIXTURE_SITES} />);
    expect(screen.getByText("Main Site")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("renders score badges for sites with runs", () => {
    renderWithProviders(<LighthouseApp initialSites={FIXTURE_SITES} />);
    // Performance scores rendered as badges
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("shows vitals detail when site with run is selected", () => {
    renderWithProviders(<LighthouseApp initialSites={FIXTURE_SITES} />);
    const mainSiteRow = screen.getByText("Main Site").closest("tr");
    if (mainSiteRow) {
      fireEvent.click(mainSiteRow);
    }
    expect(screen.getByText(/Core Web Vitals/)).toBeInTheDocument();
  });
});
