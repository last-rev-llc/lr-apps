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

import { ConcertsApp } from "../concerts/components/concerts-app";
import type { Concert } from "../concerts/lib/types";

const FIXTURE_CONCERTS: Concert[] = [
  {
    id: "test-1",
    artist: "Test Artist One",
    venue: "Test Venue",
    city: "Test City, CA",
    date: "2026-07-01",
    status: "upcoming",
    ticket_url: "https://example.com/tickets",
  },
  {
    id: "test-2",
    artist: "Test Artist Two",
    venue: "Another Venue",
    city: "Other City, NY",
    date: "2025-12-01",
    status: "past",
  },
  {
    id: "test-3",
    artist: "Mystery Band",
    venue: null,
    city: null,
    date: null,
    status: "tbd",
  },
];

describe("ConcertsApp", () => {
  it("renders static fallback data when initialConcerts is empty", () => {
    renderWithProviders(<ConcertsApp initialConcerts={[]} />);

    // Static fallback includes "Radiohead"
    expect(screen.getByText("Radiohead")).toBeInTheDocument();
    expect(screen.getByText("Kendrick Lamar")).toBeInTheDocument();
  });

  it("renders provided concert data correctly", () => {
    renderWithProviders(<ConcertsApp initialConcerts={FIXTURE_CONCERTS} />);

    expect(screen.getByText("Test Artist One")).toBeInTheDocument();
    expect(screen.getByText("Test Artist Two")).toBeInTheDocument();
    expect(screen.getByText("Mystery Band")).toBeInTheDocument();
    // Venue and city
    expect(screen.getByText("🏟️ Test Venue")).toBeInTheDocument();
    expect(screen.getByText("📍 Test City, CA")).toBeInTheDocument();
  });

  it("renders ticket link for upcoming concerts with ticket_url", () => {
    renderWithProviders(<ConcertsApp initialConcerts={FIXTURE_CONCERTS} />);

    const ticketLink = screen.getByText("Tickets ↗");
    expect(ticketLink).toBeInTheDocument();
    expect(ticketLink.closest("a")).toHaveAttribute("href", "https://example.com/tickets");
  });

  it("renders search input for filtering concerts", () => {
    renderWithProviders(<ConcertsApp initialConcerts={FIXTURE_CONCERTS} />);

    const searchInput = screen.getByPlaceholderText("Search artist, venue, city…");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders status badges for concerts", () => {
    renderWithProviders(<ConcertsApp initialConcerts={FIXTURE_CONCERTS} />);

    expect(screen.getByText("upcoming")).toBeInTheDocument();
    expect(screen.getByText("past")).toBeInTheDocument();
    expect(screen.getByText("tbd")).toBeInTheDocument();
  });
});
