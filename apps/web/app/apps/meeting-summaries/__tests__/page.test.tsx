// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/app/apps/meeting-summaries/lib/queries", () => ({
  getMeetings: vi.fn().mockResolvedValue([
    {
      id: "m1",
      topic: "Sprint Planning",
      start_time: "2025-04-07T10:00:00Z",
      duration: 60,
      summary: "Planned the sprint",
      action_items: [{ action: "Review PRs" }, { action: "Update docs" }],
    },
    {
      id: "m2",
      topic: "Design Review",
      start_time: "2025-04-08T14:00:00Z",
      duration: 30,
      summary: null,
      action_items: [{ action: "Finalize palette" }],
    },
  ]),
  computeStats: vi.fn().mockReturnValue({
    total: 2,
    summarized: 1,
    actionItems: 3,
    hoursTotal: 2,
  }),
}));

vi.mock("@/app/apps/meeting-summaries/components/meetings-app", () => ({
  MeetingsApp: ({ meetings }: { meetings: unknown[] }) => (
    <div data-testid="meetings-app">meetings: {meetings.length}</div>
  ),
}));

// Mock IntersectionObserver for StatCard animations
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

import MeetingSummariesPage from "../page";

describe("MeetingSummariesPage", () => {
  it("passes meetings array to MeetingsApp", async () => {
    const jsx = await MeetingSummariesPage();
    renderWithProviders(jsx);

    const el = screen.getByTestId("meetings-app");
    expect(el).toHaveTextContent("meetings: 2");
  });

  it("renders stat cards (Meetings, Summarized, Action Items, Hours)", async () => {
    const jsx = await MeetingSummariesPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Meetings")).toBeInTheDocument();
    expect(screen.getByText("Summarized")).toBeInTheDocument();
    expect(screen.getByText("Action Items")).toBeInTheDocument();
    expect(screen.getByText("Hours")).toBeInTheDocument();
  });
});
