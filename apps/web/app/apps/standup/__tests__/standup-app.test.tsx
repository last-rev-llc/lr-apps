// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  within,
} from "@repo/test-utils";
import { StandupApp } from "../components/standup-app";
import type { StandupDay } from "../lib/types";

// ── Mock data ──────────────────────────────────────────────────────────────

const mockDays: StandupDay[] = [
  {
    id: "d1",
    date: "2025-04-07",
    dayOfWeek: "Monday",
    activities: [
      { source: "slack", time: "9:00", description: "Posted standup update in #engineering" },
      { source: "slack", time: "10:30", description: "Discussed deploy plan in #releases" },
      { source: "github", time: "11:00", description: "Opened PR #42 — add dark mode" },
      { source: "workspace", time: "14:00", description: "Updated project roadmap doc" },
      { source: "jira", time: "15:00", description: "Moved PROJ-101 to In Progress" },
    ],
    createdAt: "2025-04-07T08:00:00Z",
    updatedAt: "2025-04-07T16:00:00Z",
  },
  {
    id: "d2",
    date: "2025-04-08",
    dayOfWeek: "Tuesday",
    activities: [
      { source: "github", time: "9:30", description: "Reviewed PR #43 — fix auth" },
      { source: "slack", time: "13:00", description: "Answered questions in #support" },
    ],
    createdAt: "2025-04-08T08:00:00Z",
    updatedAt: "2025-04-08T14:00:00Z",
  },
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe("StandupApp", () => {
  // ── Header ────────────────────────────────────────────────────────────

  it("renders heading and subtitle", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.getByText(/Daily Standup/)).toBeInTheDocument();
    expect(
      screen.getByText(/Aggregated updates from Slack, GitHub, and Workspace/),
    ).toBeInTheDocument();
  });

  // ── Filter buttons ────────────────────────────────────────────────────

  it("renders all 5 filter buttons", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.getByRole("button", { name: "All Sources" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Slack/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /GitHub/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Workspace/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Jira/ })).toBeInTheDocument();
  });

  // ── DayCard rendering ────────────────────────────────────────────────

  it("renders day cards with day-of-week and formatted date", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText(/April 7/)).toBeInTheDocument();
    expect(screen.getByText("Tuesday")).toBeInTheDocument();
    expect(screen.getByText(/April 8/)).toBeInTheDocument();
  });

  it("renders activity count per day card", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.getByText("5 updates")).toBeInTheDocument();
    expect(screen.getByText("2 updates")).toBeInTheDocument();
  });

  it("renders source badges on day cards", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    // Day 1 has slack, github, workspace, jira badges
    const slackBadges = screen.getAllByText(/Slack/);
    expect(slackBadges.length).toBeGreaterThanOrEqual(1);

    const githubBadges = screen.getAllByText(/GitHub/);
    expect(githubBadges.length).toBeGreaterThanOrEqual(1);
  });

  // ── Source groups ─────────────────────────────────────────────────────

  it("renders Slack source group with sorted activities", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    // Slack activities from day 1 should be sorted by time
    expect(screen.getByText("Posted standup update in #engineering")).toBeInTheDocument();
    expect(screen.getByText("Discussed deploy plan in #releases")).toBeInTheDocument();
    expect(screen.getByText("9:00")).toBeInTheDocument();
    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("renders GitHub source group with activities", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.getByText("Opened PR #42 — add dark mode")).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
  });

  it("renders Workspace and Jira activities", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.getByText("Updated project roadmap doc")).toBeInTheDocument();
    expect(screen.getByText("Moved PROJ-101 to In Progress")).toBeInTheDocument();
  });

  // ── Filtering ─────────────────────────────────────────────────────────

  it("filters to only Slack activities when Slack filter is clicked", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    fireEvent.click(screen.getByRole("button", { name: /Slack/ }));

    // Slack activities should still be visible
    expect(screen.getByText("Posted standup update in #engineering")).toBeInTheDocument();
    expect(screen.getByText("Answered questions in #support")).toBeInTheDocument();

    // GitHub/Workspace/Jira activities should be hidden
    expect(screen.queryByText("Opened PR #42 — add dark mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Updated project roadmap doc")).not.toBeInTheDocument();
    expect(screen.queryByText("Moved PROJ-101 to In Progress")).not.toBeInTheDocument();
  });

  it("restores all activities when All Sources is clicked after filtering", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    // Filter to Slack
    fireEvent.click(screen.getByRole("button", { name: /Slack/ }));
    expect(screen.queryByText("Opened PR #42 — add dark mode")).not.toBeInTheDocument();

    // Click All Sources to restore
    fireEvent.click(screen.getByRole("button", { name: "All Sources" }));
    expect(screen.getByText("Opened PR #42 — add dark mode")).toBeInTheDocument();
    expect(screen.getByText("Updated project roadmap doc")).toBeInTheDocument();
  });

  it("filters to GitHub activities only", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    fireEvent.click(screen.getByRole("button", { name: /GitHub/ }));

    expect(screen.getByText("Opened PR #42 — add dark mode")).toBeInTheDocument();
    expect(screen.getByText("Reviewed PR #43 — fix auth")).toBeInTheDocument();
    expect(screen.queryByText("Posted standup update in #engineering")).not.toBeInTheDocument();
  });

  // ── Empty state ───────────────────────────────────────────────────────

  it("shows empty state when days array is empty", () => {
    renderWithProviders(<StandupApp days={[]} lastUpdated={null} />);

    expect(screen.getByText("No standup entries yet.")).toBeInTheDocument();
  });

  // ── Last updated ──────────────────────────────────────────────────────

  it("renders last updated timestamp when provided", () => {
    renderWithProviders(
      <StandupApp days={mockDays} lastUpdated="Apr 7, 2025, 9:00 AM" />,
    );

    expect(screen.getByText("Last updated:")).toBeInTheDocument();
    expect(screen.getByText("Apr 7, 2025, 9:00 AM")).toBeInTheDocument();
  });

  it("does not render last updated when null", () => {
    renderWithProviders(<StandupApp days={mockDays} lastUpdated={null} />);

    expect(screen.queryByText("Last updated:")).not.toBeInTheDocument();
  });
});
