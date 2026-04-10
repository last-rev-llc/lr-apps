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

import { ArchitectureApp } from "../architecture/components/architecture-app";

describe("ArchitectureApp", () => {
  it("renders the page header", () => {
    renderWithProviders(<ArchitectureApp />);
    expect(screen.getByText("🏗️ Architecture")).toBeInTheDocument();
  });

  it("renders all architecture section titles", () => {
    renderWithProviders(<ArchitectureApp />);
    expect(screen.getByText("Monorepo Structure")).toBeInTheDocument();
    expect(screen.getByText("Frontend Stack")).toBeInTheDocument();
    expect(screen.getByText("Database & Backend")).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Deployment & CI")).toBeInTheDocument();
  });

  it("renders section descriptions", () => {
    renderWithProviders(<ArchitectureApp />);
    expect(screen.getByText("Turborepo-powered monorepo with shared packages and multiple apps.")).toBeInTheDocument();
    expect(screen.getByText("Supabase (Postgres) for all persistent data with row-level security.")).toBeInTheDocument();
  });

  it("renders section tags", () => {
    renderWithProviders(<ArchitectureApp />);
    expect(screen.getByText("turborepo")).toBeInTheDocument();
    expect(screen.getByText("supabase")).toBeInTheDocument();
    expect(screen.getByText("vercel")).toBeInTheDocument();
  });
});
