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

import { AppAccessApp } from "../app-access/components/app-access-app";

const FIXTURE_PERMISSIONS = [
  {
    id: "perm-1",
    user_id: "user-1",
    app_slug: "command-center",
    permission: "admin" as const,
    created_at: "2024-01-01T00:00:00Z",
    user_email: "alice@lastrev.com",
    user_name: "Alice Johnson",
  },
  {
    id: "perm-2",
    user_id: "user-2",
    app_slug: "command-center",
    permission: "view" as const,
    created_at: "2024-01-02T00:00:00Z",
    user_email: "bob@lastrev.com",
    user_name: "Bob Smith",
  },
];

describe("AppAccessApp", () => {
  it("renders empty state when no permissions", () => {
    renderWithProviders(<AppAccessApp initialPermissions={[]} />);
    expect(screen.getByText("No permissions found")).toBeInTheDocument();
  });

  it("renders app groups with app slug", () => {
    renderWithProviders(<AppAccessApp initialPermissions={FIXTURE_PERMISSIONS} />);
    expect(screen.getByText("command-center")).toBeInTheDocument();
  });

  it("renders permission badges", () => {
    renderWithProviders(<AppAccessApp initialPermissions={FIXTURE_PERMISSIONS} />);
    // "admin" appears as both a badge and a filter button
    expect(screen.getAllByText("admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("view").length).toBeGreaterThan(0);
  });

  it("renders user name when provided", () => {
    renderWithProviders(<AppAccessApp initialPermissions={FIXTURE_PERMISSIONS} />);
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });
});
