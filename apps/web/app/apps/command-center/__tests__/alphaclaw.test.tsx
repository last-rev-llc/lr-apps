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

import { AlphaclawApp } from "../alphaclaw/components/alphaclaw-app";

describe("AlphaclawApp", () => {
  it("renders page header AlphaClaw", () => {
    renderWithProviders(<AlphaclawApp />);
    expect(screen.getByText("🦅 AlphaClaw")).toBeInTheDocument();
  });

  it("renders service status section with all 6 services", () => {
    renderWithProviders(<AlphaclawApp />);
    expect(screen.getByText("API Gateway")).toBeInTheDocument();
    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.getByText("Content Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Search Index")).toBeInTheDocument();
    expect(screen.getByText("Media CDN")).toBeInTheDocument();
    expect(screen.getByText("Webhooks")).toBeInTheDocument();
  });

  it("renders quick links section with all 6 links", () => {
    renderWithProviders(<AlphaclawApp />);
    expect(screen.getByText("AlphaClaw Admin")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    expect(screen.getByText("Deployments")).toBeInTheDocument();
    expect(screen.getByText("Error Tracking")).toBeInTheDocument();
    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  it("renders overview stat cards", () => {
    renderWithProviders(<AlphaclawApp />);
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
  });
});
