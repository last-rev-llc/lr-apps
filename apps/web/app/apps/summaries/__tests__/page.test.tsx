// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/app/apps/summaries/lib/queries", () => ({
  getAllSummaries: vi.fn().mockResolvedValue({
    zoom: [
      {
        id: "z1",
        meeting_id: "m1",
        meeting_topic: "Sprint Planning",
        short_summary: "Planned sprint 12",
        long_summary: null,
        action_items: ["Review PRs"],
        key_decisions: ["Use React 19"],
        created_at: "2025-04-07T10:00:00Z",
        updated_at: "2025-04-07T11:00:00Z",
      },
    ],
    slack: [
      {
        id: "s1",
        thread_ts: "1712500000.000",
        channel_id: "engineering",
        participants: ["alice", "bob"],
        short_summary: "Deploy discussion",
        long_summary: null,
        tone: "positive",
        created_at: "2025-04-07T09:00:00Z",
        updated_at: "2025-04-07T09:30:00Z",
      },
    ],
    jira: [
      {
        id: "j1",
        ticket_key: "PROJ-101",
        short_summary: "Fix auth bug",
        long_summary: null,
        priority: "high",
        status: "in_progress",
        created_at: "2025-04-07T08:00:00Z",
        updated_at: "2025-04-07T12:00:00Z",
      },
    ],
    all: [
      { id: "z1", source: "zoom", meeting_topic: "Sprint Planning", created_at: "2025-04-07T10:00:00Z" },
      { id: "s1", source: "slack", short_summary: "Deploy discussion", created_at: "2025-04-07T09:00:00Z" },
      { id: "j1", source: "jira", ticket_key: "PROJ-101", created_at: "2025-04-07T08:00:00Z" },
    ],
  }),
  getSlackChannels: vi.fn().mockReturnValue(["engineering"]),
}));

vi.mock("@/app/apps/summaries/components/summaries-app", () => ({
  SummariesApp: ({
    zoom,
    slack,
    jira,
    all,
    slackChannels,
  }: {
    zoom: unknown[];
    slack: unknown[];
    jira: unknown[];
    all: unknown[];
    slackChannels: string[];
  }) => (
    <div data-testid="summaries-app">
      zoom: {zoom.length}, slack: {slack.length}, jira: {jira.length}, all:{" "}
      {all.length}, channels: {slackChannels.join(",")}
    </div>
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

import SummariesPage from "../page";

describe("SummariesPage", () => {
  it("passes zoom/slack/jira/all/slackChannels to SummariesApp", async () => {
    const jsx = await SummariesPage();
    renderWithProviders(jsx);

    const el = screen.getByTestId("summaries-app");
    expect(el).toHaveTextContent("zoom: 1");
    expect(el).toHaveTextContent("slack: 1");
    expect(el).toHaveTextContent("jira: 1");
    expect(el).toHaveTextContent("all: 3");
    expect(el).toHaveTextContent("channels: engineering");
  });

  it("renders stat cards with correct counts", async () => {
    const jsx = await SummariesPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Zoom")).toBeInTheDocument();
    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText("Jira")).toBeInTheDocument();
  });
});
