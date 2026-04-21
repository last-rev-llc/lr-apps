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

import { IronApp } from "../iron/components/iron-app";

describe("IronApp", () => {
  it("renders the page header", () => {
    renderWithProviders(<IronApp />);

    expect(screen.getByText("🔩 Iron")).toBeInTheDocument();
    expect(screen.getByText("Infrastructure overview, deploy status, and quick actions")).toBeInTheDocument();
  });

  it("renders the all-systems-operational banner since all static services are up", () => {
    renderWithProviders(<IronApp />);

    expect(screen.getByText("All systems operational")).toBeInTheDocument();
    // 5/5 services up
    expect(screen.getByText("5/5 services up")).toBeInTheDocument();
  });

  it("renders deploy projects in Latest Deployments section", () => {
    renderWithProviders(<IronApp />);

    expect(screen.getByText("Latest Deployments")).toBeInTheDocument();
    expect(screen.getByText("lr-apps (web)")).toBeInTheDocument();
    expect(screen.getByText("lr-apps (api)")).toBeInTheDocument();
    expect(screen.getByText("achieveAI web")).toBeInTheDocument();
  });

  it("renders infrastructure services with their status", () => {
    renderWithProviders(<IronApp />);

    expect(screen.getByText("Infrastructure Services")).toBeInTheDocument();
    expect(screen.getByText("Supabase (Production)")).toBeInTheDocument();
    expect(screen.getByText("Vercel Edge Network")).toBeInTheDocument();
    expect(screen.getByText("GitHub Actions")).toBeInTheDocument();
    // All up
    const upLabels = screen.getAllByText("Up");
    expect(upLabels.length).toBeGreaterThanOrEqual(5);
  });

  it("renders quick action links", () => {
    renderWithProviders(<IronApp />);

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Vercel Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Supabase Console")).toBeInTheDocument();
    expect(screen.getByText("GitHub Repos")).toBeInTheDocument();
    expect(screen.getByText("Sentry Errors")).toBeInTheDocument();
  });
});
