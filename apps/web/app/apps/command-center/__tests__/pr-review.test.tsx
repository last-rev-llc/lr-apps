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

import { PrApp } from "../pr-review/components/pr-app";

const FIXTURE_PRS = [
  {
    id: "pr-1",
    title: "Add new feature",
    repo: "my-repo",
    author: "alice",
    status: "open" as const,
    url: "https://github.com/my-repo/pull/1",
    labels: ["feature"],
  },
  {
    id: "pr-2",
    title: "Fix bug in auth",
    repo: "my-repo",
    author: "bob",
    status: "merged" as const,
    url: "https://github.com/my-repo/pull/2",
    labels: [],
  },
];

describe("PrApp", () => {
  it("renders empty state when no PRs", () => {
    renderWithProviders(<PrApp initialPRs={[]} />);
    expect(screen.getByText("No PRs match your filters")).toBeInTheDocument();
  });

  it("renders PR cards with titles", () => {
    renderWithProviders(<PrApp initialPRs={FIXTURE_PRS} />);
    expect(screen.getByText("Add new feature")).toBeInTheDocument();
    expect(screen.getByText("Fix bug in auth")).toBeInTheDocument();
  });

  it("renders status badge for each PR", () => {
    renderWithProviders(<PrApp initialPRs={FIXTURE_PRS} />);
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByText("merged")).toBeInTheDocument();
  });

  it("shows PR count", () => {
    renderWithProviders(<PrApp initialPRs={FIXTURE_PRS} />);
    expect(screen.getByText("2 of 2 PRs")).toBeInTheDocument();
  });
});
