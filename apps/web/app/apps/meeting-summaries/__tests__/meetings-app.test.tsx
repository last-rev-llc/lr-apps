// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  within,
} from "@repo/test-utils";
import { MeetingsApp } from "../components/meetings-app";
import type { ZoomTranscript } from "../lib/types";

// ── Mock data factory ────────────────────────────────────────────────────

function makeMeeting(overrides: Partial<ZoomTranscript> = {}): ZoomTranscript {
  return {
    id: "m1",
    topic: "Sprint Planning",
    start_time: new Date().toISOString(),
    duration: 45,
    summary: "Discussed sprint goals and assigned tasks.",
    sentiment: "productive",
    client_id: "acme-corp",
    attendees: ["Alice", "Bob"],
    decisions: ["Use React 19", "Ship by Friday"],
    action_items: [
      {
        action: "Review PRs",
        owner: "Alice",
        priority: "high",
        deadline: "2025-04-10",
      },
      {
        action: "Update docs",
        owner: "Bob",
        priority: "medium",
      },
    ],
    key_topics: ["architecture", "timeline"],
    ...overrides,
  };
}

// ── Test data ────────────────────────────────────────────────────────────

const meetings: ZoomTranscript[] = [
  makeMeeting(),
  makeMeeting({
    id: "m2",
    topic: "Design Review",
    summary: "Reviewed new mockups for the dashboard.",
    sentiment: "neutral",
    client_id: "beta-inc",
    attendees: ["Carol", "Dave"],
    decisions: ["Keep dark mode"],
    action_items: [
      { action: "Finalize palette", owner: "Carol", priority: "low" },
    ],
    key_topics: ["design"],
    start_time: new Date(Date.now() - 2 * 86400000).toISOString(),
  }),
  makeMeeting({
    id: "m3",
    topic: "Stakeholder Sync",
    summary: null as unknown as string,
    sentiment: undefined,
    client_id: undefined,
    attendees: [],
    decisions: [],
    action_items: [],
    key_topics: [],
    start_time: new Date(Date.now() - 5 * 86400000).toISOString(),
  }),
];

// Separate meeting set with one meeting far in the past for date range tests
const meetingsWithOld: ZoomTranscript[] = [
  ...meetings,
  makeMeeting({
    id: "m4",
    topic: "Old Kickoff",
    summary: "Ancient meeting",
    client_id: undefined,
    attendees: [],
    decisions: [],
    action_items: [],
    key_topics: [],
    start_time: new Date(Date.now() - 60 * 86400000).toISOString(),
  }),
];

function renderApp(props: { meetings: ZoomTranscript[] } = { meetings }) {
  return renderWithProviders(<MeetingsApp meetings={props.meetings} />);
}

// Radix Tabs activates on mouseDown, not click
function clickTab(name: RegExp) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }));
}

function getActivePanel() {
  const panel = document.querySelector(
    "[role='tabpanel'][data-state='active']",
  );
  return within(panel as HTMLElement);
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("MeetingsApp", () => {
  describe("meeting list rendering", () => {
    it("renders meeting list with topic names visible", () => {
      renderApp();

      expect(screen.getByText("Sprint Planning")).toBeInTheDocument();
      expect(screen.getByText("Design Review")).toBeInTheDocument();
      expect(screen.getByText("Stakeholder Sync")).toBeInTheDocument();
    });

    it("clicking a meeting card expands to show summary, decisions, action items, topics, attendees", () => {
      renderApp();

      const card = screen.getByText("Sprint Planning").closest("button")!;
      fireEvent.click(card);

      // Summary
      expect(
        screen.getByText("Discussed sprint goals and assigned tasks."),
      ).toBeInTheDocument();

      // Decisions
      expect(screen.getByText(/Use React 19/)).toBeInTheDocument();
      expect(screen.getByText(/Ship by Friday/)).toBeInTheDocument();

      // Action items
      expect(screen.getByText(/Review PRs/)).toBeInTheDocument();
      expect(screen.getByText(/Update docs/)).toBeInTheDocument();

      // Attendees
      expect(screen.getByText(/Alice, Bob/)).toBeInTheDocument();

      // Topics
      expect(screen.getByText("architecture")).toBeInTheDocument();
      expect(screen.getByText("timeline")).toBeInTheDocument();
    });

    it("pending badge shown when summary is null", () => {
      renderApp();

      // Stakeholder Sync has no summary — shows pending badge
      expect(screen.getByText(/pending/)).toBeInTheDocument();
    });

    it("SentimentBadge renders correct sentiment text", () => {
      renderApp();

      expect(screen.getByText("productive")).toBeInTheDocument();
      expect(screen.getByText("neutral")).toBeInTheDocument();
    });
  });

  describe("search and filtering", () => {
    it("search filters meetings by topic", () => {
      renderApp();

      const search = screen.getByPlaceholderText("Search meetings…");
      fireEvent.change(search, { target: { value: "Design" } });

      expect(screen.getByText("Design Review")).toBeInTheDocument();
      expect(screen.queryByText("Sprint Planning")).not.toBeInTheDocument();
    });

    it("search filters meetings by client_id", () => {
      renderApp();

      const search = screen.getByPlaceholderText("Search meetings…");
      fireEvent.change(search, { target: { value: "beta-inc" } });

      expect(screen.getByText("Design Review")).toBeInTheDocument();
      expect(screen.queryByText("Sprint Planning")).not.toBeInTheDocument();
    });

    it("date range pill filters meetings by start_time", () => {
      renderApp({ meetings: meetingsWithOld });

      // Default is "Last 30 days" — Old Kickoff is 60 days old, should be hidden
      expect(screen.queryByText("Old Kickoff")).not.toBeInTheDocument();

      // Switch to "All" to see all meetings
      fireEvent.click(screen.getByText("All"));
      expect(screen.getByText("Old Kickoff")).toBeInTheDocument();
    });

    it("empty state shown when no meetings match", () => {
      renderApp();

      const search = screen.getByPlaceholderText("Search meetings…");
      fireEvent.change(search, { target: { value: "zzz-no-match" } });

      expect(screen.getByText("No meetings found")).toBeInTheDocument();
    });
  });

  describe("Action Items tab", () => {
    it("switching to Action Items tab shows action items from all meetings", () => {
      renderApp();

      clickTab(/Action Items/);

      const panel = getActivePanel();
      expect(panel.getByText("Review PRs")).toBeInTheDocument();
      expect(panel.getByText("Update docs")).toBeInTheDocument();
      expect(panel.getByText("Finalize palette")).toBeInTheDocument();
    });

    it("action item status filter (open/done) works", () => {
      renderApp();

      clickTab(/Action Items/);

      const panel = getActivePanel();

      // Default filter is "Open" — all items visible
      expect(panel.getByText("Review PRs")).toBeInTheDocument();

      // Switch to "Done" — no items should be done yet
      fireEvent.click(panel.getByText("Done"));
      expect(screen.getByText("No action items found")).toBeInTheDocument();
    });

    it("action item priority filter works", () => {
      renderApp();

      clickTab(/Action Items/);

      const panel = getActivePanel();

      // Filter to "High" priority
      fireEvent.click(panel.getByText("High"));

      expect(panel.getByText("Review PRs")).toBeInTheDocument();
      expect(panel.queryByText("Update docs")).not.toBeInTheDocument();
      expect(panel.queryByText("Finalize palette")).not.toBeInTheDocument();
    });

    it("marking action item done removes it from open filter and shows in done filter", () => {
      renderApp();

      clickTab(/Action Items/);

      const panel = getActivePanel();

      // All 3 action items visible under "Open"
      expect(panel.getByText("Review PRs")).toBeInTheDocument();
      const doneButtons = panel.getAllByText("✅ Done");
      expect(doneButtons.length).toBe(3);

      // Mark first item done
      fireEvent.click(doneButtons[0]);

      // Item removed from "Open" view
      expect(panel.queryByText("Review PRs")).not.toBeInTheDocument();

      // Switch to "Done" — the marked item appears
      fireEvent.click(panel.getByText("Done"));
      expect(panel.getByText("Review PRs")).toBeInTheDocument();
    });
  });
});
