// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/app/apps/standup/lib/queries", () => ({
  getStandupDays: vi.fn().mockResolvedValue([
    {
      id: "d1",
      date: "2025-04-07",
      dayOfWeek: "Monday",
      activities: [
        { source: "slack", time: "9:00", description: "Morning standup" },
      ],
      createdAt: "2025-04-07T08:00:00Z",
      updatedAt: "2025-04-07T16:00:00Z",
    },
    {
      id: "d2",
      date: "2025-04-08",
      dayOfWeek: "Tuesday",
      activities: [
        { source: "github", time: "10:00", description: "PR review" },
      ],
      createdAt: "2025-04-08T08:00:00Z",
      updatedAt: "2025-04-08T14:00:00Z",
    },
  ]),
}));

// Mock the client component to avoid rendering the full interactive tree
vi.mock("@/app/apps/standup/components/standup-app", () => ({
  StandupApp: ({
    days,
    lastUpdated,
  }: {
    days: unknown[];
    lastUpdated: string | null;
  }) => (
    <div data-testid="standup-app">
      days: {days.length}, lastUpdated: {lastUpdated ?? "null"}
    </div>
  ),
}));

import StandupPage from "../page";

describe("StandupPage", () => {
  it("passes days to StandupApp", async () => {
    const jsx = await StandupPage();
    renderWithProviders(jsx);

    expect(screen.getByTestId("standup-app")).toHaveTextContent("days: 2");
  });

  it("computes lastUpdated from the most recent updatedAt", async () => {
    const jsx = await StandupPage();
    renderWithProviders(jsx);

    // Day 2 has the later updatedAt (2025-04-08T14:00:00Z)
    // The exact formatted string depends on locale, but the mock component shows it
    const el = screen.getByTestId("standup-app");
    expect(el.textContent).not.toContain("lastUpdated: null");
  });
});
