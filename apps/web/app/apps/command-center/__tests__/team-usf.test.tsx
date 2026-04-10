// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { act } from "react";

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

import { TeamUsfApp } from "../team-usf/components/team-usf-app";
import type { TeamUsfMember } from "../team-usf/lib/types";

const FIXTURE_MEMBERS: TeamUsfMember[] = [
  {
    id: "m1",
    name: "Coach Rivera",
    role: "coach",
    position: "Head Coach",
    activity: "active",
    year: "2026",
    hometown: "Tampa, FL",
  },
  {
    id: "m2",
    name: "Jordan Smith",
    role: "player",
    position: "Forward",
    jersey_number: 11,
    activity: "active",
    year: "Senior",
    major: "Business",
    hometown: "Orlando, FL",
  },
  {
    id: "m3",
    name: "Riley Jones",
    role: "player",
    position: "Midfielder",
    jersey_number: 7,
    activity: "bench",
    year: "Sophomore",
    major: "Kinesiology",
    hometown: "Miami, FL",
  },
];

describe("TeamUsfApp", () => {
  it("renders static fallback roster when initialMembers is empty", () => {
    renderWithProviders(<TeamUsfApp initialMembers={[]} />);

    // Static fallback includes Coach Rodriguez
    expect(screen.getByText("Coach Rodriguez")).toBeInTheDocument();
    expect(screen.getByText("Marcus Thompson")).toBeInTheDocument();
  });

  it("renders provided member data correctly", () => {
    renderWithProviders(<TeamUsfApp initialMembers={FIXTURE_MEMBERS} />);

    expect(screen.getByText("Coach Rivera")).toBeInTheDocument();
    expect(screen.getByText("Jordan Smith")).toBeInTheDocument();
    expect(screen.getByText("Riley Jones")).toBeInTheDocument();
  });

  it("renders role badges for members", () => {
    renderWithProviders(<TeamUsfApp initialMembers={FIXTURE_MEMBERS} />);

    expect(screen.getByText("coach")).toBeInTheDocument();
    // Two players
    const playerBadges = screen.getAllByText("player");
    expect(playerBadges.length).toBe(2);
  });

  it("renders member details including position and hometown", () => {
    renderWithProviders(<TeamUsfApp initialMembers={FIXTURE_MEMBERS} />);

    expect(screen.getByText("Head Coach")).toBeInTheDocument();
    expect(screen.getByText("Forward")).toBeInTheDocument();
    expect(screen.getByText("📍 Tampa, FL")).toBeInTheDocument();
    expect(screen.getByText("📍 Orlando, FL")).toBeInTheDocument();
  });

  it("renders jersey numbers for players", () => {
    renderWithProviders(<TeamUsfApp initialMembers={FIXTURE_MEMBERS} />);

    expect(screen.getByText("#11")).toBeInTheDocument();
    expect(screen.getByText("#7")).toBeInTheDocument();
  });

  it("shows empty state when search/filter has no matches", () => {
    vi.useFakeTimers();
    renderWithProviders(<TeamUsfApp initialMembers={FIXTURE_MEMBERS} />);

    const searchInput = screen.getByPlaceholderText("Search name, position, major…");
    fireEvent.change(searchInput, { target: { value: "zzznomatch" } });
    // Advance past the Search component's 300ms debounce
    act(() => { vi.advanceTimersByTime(400); });

    expect(screen.getByText("No members found")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
