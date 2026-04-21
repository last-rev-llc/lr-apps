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

import { ContentfulApp } from "../contentful/components/contentful-app";
import type { ContentfulHealth } from "../contentful/lib/types";

const FIXTURE_SPACES: ContentfulHealth[] = [
  {
    id: "space-1",
    space: "Marketing Site",
    totalEntries: 120,
    publishedEntries: 100,
    draftEntries: 15,
    changedEntries: 2,
    staleEntries: 5,
    lastChecked: "2026-04-01T10:00:00Z",
    staleDrafts: [
      { id: "e1", title: "Old Blog Post", contentType: "blogPost", status: "draft", daysSinceUpdate: 30 },
    ],
    recentPublishes: [
      { id: "e2", title: "New Landing Page", contentType: "page", status: "published" },
    ],
  },
  {
    id: "space-2",
    space: "Product Docs",
    totalEntries: 50,
    publishedEntries: 48,
    draftEntries: 2,
    changedEntries: 0,
    staleEntries: 0,
    lastChecked: "2026-04-01T10:00:00Z",
  },
];

describe("ContentfulApp", () => {
  it("renders empty state when no spaces provided", () => {
    renderWithProviders(<ContentfulApp initialHealth={[]} />);

    expect(screen.getByText("No Contentful data")).toBeInTheDocument();
    expect(screen.getByText("Run the Contentful health cron to populate data")).toBeInTheDocument();
  });

  it("renders space names when data is provided", () => {
    renderWithProviders(<ContentfulApp initialHealth={FIXTURE_SPACES} />);

    // Space names appear in both the select dropdown options and the content
    expect(screen.getAllByText("Marketing Site").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Product Docs").length).toBeGreaterThan(0);
  });

  it("renders summary stat cards with correct values", () => {
    renderWithProviders(<ContentfulApp initialHealth={FIXTURE_SPACES} />);

    // 2 spaces total
    expect(screen.getByText("Spaces")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getByText("Stale")).toBeInTheDocument();
    // Value: 2 spaces
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders the page header with space count", () => {
    renderWithProviders(<ContentfulApp initialHealth={FIXTURE_SPACES} />);

    expect(screen.getByText("📦 Contentful")).toBeInTheDocument();
    // Subtitle includes space count
    const subtitle = screen.getByText(/2 spaces/);
    expect(subtitle).toBeInTheDocument();
  });

  it("renders stale count in subtitle when stale entries exist", () => {
    renderWithProviders(<ContentfulApp initialHealth={FIXTURE_SPACES} />);

    // totalStale = 5 — appears in subtitle and possibly in highlighted count areas
    expect(screen.getAllByText(/5 stale/).length).toBeGreaterThan(0);
  });
});
