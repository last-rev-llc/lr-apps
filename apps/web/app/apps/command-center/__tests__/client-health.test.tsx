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

import { HealthApp } from "../client-health/components/health-app";
import type { HealthSite } from "../client-health/lib/types";

const FIXTURE_SITES: HealthSite[] = [
  {
    id: "site-1",
    name: "Acme Corp",
    url: "https://acme.com",
    status: "up",
    uptime: 99.9,
    responseTime: 220,
    lastCheck: "2024-03-01T10:00:00Z",
    sslExpiry: "2025-06-01T00:00:00Z",
  },
  {
    id: "site-2",
    name: "Globex Industries",
    url: "https://globex.com",
    status: "degraded",
    uptime: 97.5,
    responseTime: 950,
    lastCheck: "2024-03-01T10:00:00Z",
    sslExpiry: "2025-09-01T00:00:00Z",
  },
  {
    id: "site-3",
    name: "Initech",
    url: "https://initech.com",
    status: "down",
    uptime: 85.0,
    responseTime: null,
    lastCheck: "2024-03-01T10:00:00Z",
    sslExpiry: null,
  },
];

describe("HealthApp", () => {
  it("renders EmptyState when no sites match the status filter", () => {
    renderWithProviders(<HealthApp initialSites={[]} />);
    expect(screen.getByText("No sites match")).toBeInTheDocument();
  });

  it("renders site cards with names and URLs when sites are provided", () => {
    renderWithProviders(<HealthApp initialSites={FIXTURE_SITES} />);
    // Names appear in both card headers and possibly in select filter options
    expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Globex Industries").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Initech").length).toBeGreaterThan(0);
  });

  it("renders status badges for each site", () => {
    renderWithProviders(<HealthApp initialSites={FIXTURE_SITES} />);
    expect(screen.getByText("UP")).toBeInTheDocument();
    expect(screen.getByText("DEGRADED")).toBeInTheDocument();
    expect(screen.getByText("DOWN")).toBeInTheDocument();
  });

  it("renders overall health banner with correct counts", () => {
    renderWithProviders(<HealthApp initialSites={FIXTURE_SITES} />);
    // Banner shows counts: "1 up · 1 degraded · 1 down · 3 total"
    expect(screen.getByText(/1 up/)).toBeInTheDocument();
    expect(screen.getByText(/1 degraded/)).toBeInTheDocument();
    expect(screen.getByText(/1 down/)).toBeInTheDocument();
  });
});
