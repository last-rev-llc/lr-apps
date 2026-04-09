// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  within,
} from "@repo/test-utils";
import { SummariesApp } from "../components/summaries-app";
import type {
  ZoomSummary,
  SlackSummary,
  JiraSummary,
  SummaryItem,
} from "../lib/types";

// ── Mock data factories ───────────────────────────────────────────────────

function makeZoom(overrides: Partial<ZoomSummary> = {}): ZoomSummary {
  return {
    id: "z1",
    meeting_id: "m1",
    meeting_topic: "Sprint Planning",
    short_summary: "Planned the upcoming sprint",
    long_summary: "Detailed planning discussion covering all workstreams",
    action_items: ["Review PRs by Friday", "Update documentation"],
    key_decisions: ["Use React 19", "Switch to Vitest"],
    created_at: "2025-04-07T10:00:00Z",
    updated_at: "2025-04-07T11:00:00Z",
    ...overrides,
  };
}

function makeSlack(overrides: Partial<SlackSummary> = {}): SlackSummary {
  return {
    id: "s1",
    thread_ts: "1712500000.000",
    channel_id: "engineering",
    participants: ["alice", "bob", "carol"],
    short_summary: "Deploy discussion thread",
    long_summary: "Team discussed the deploy strategy for v2.0",
    tone: "positive",
    created_at: "2025-04-07T09:00:00Z",
    updated_at: "2025-04-07T09:30:00Z",
    ...overrides,
  };
}

function makeJira(overrides: Partial<JiraSummary> = {}): JiraSummary {
  return {
    id: "j1",
    ticket_key: "PROJ-101",
    short_summary: "Fix authentication bug",
    long_summary: "Auth tokens expire prematurely on mobile devices",
    priority: "high",
    status: "in_progress",
    created_at: "2025-04-07T08:00:00Z",
    updated_at: "2025-04-07T12:00:00Z",
    ...overrides,
  };
}

// ── Test data ─────────────────────────────────────────────────────────────

const zoomItems: ZoomSummary[] = [
  makeZoom(),
  makeZoom({
    id: "z2",
    meeting_id: "m2",
    meeting_topic: "Design Review",
    short_summary: "Reviewed new UI mockups",
    action_items: ["Finalize color palette"],
    key_decisions: ["Keep dark mode default"],
    created_at: "2025-04-08T14:00:00Z",
  }),
];

const slackItems: SlackSummary[] = [
  makeSlack(),
  makeSlack({
    id: "s2",
    channel_id: "releases",
    short_summary: "Release checklist review",
    tone: "neutral",
    participants: ["dave", "eve"],
    created_at: "2025-04-08T11:00:00Z",
  }),
];

const jiraItems: JiraSummary[] = [
  makeJira(),
  makeJira({
    id: "j2",
    ticket_key: "PROJ-202",
    short_summary: "Add dark mode toggle",
    priority: "medium",
    status: "to_do",
    created_at: "2025-04-08T09:00:00Z",
  }),
];

const allItems: SummaryItem[] = [
  ...zoomItems.map((z) => ({ ...z, source: "zoom" as const })),
  ...slackItems.map((s) => ({ ...s, source: "slack" as const })),
  ...jiraItems.map((j) => ({ ...j, source: "jira" as const })),
];

const slackChannels = ["engineering", "releases"];

function renderApp() {
  return renderWithProviders(
    <SummariesApp
      zoom={zoomItems}
      slack={slackItems}
      jira={jiraItems}
      all={allItems}
      slackChannels={slackChannels}
    />,
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("SummariesApp", () => {
  // ── Tab triggers ────────────────────────────────────────────────────────

  describe("summary list rendering", () => {
    it("renders tab triggers with counts", () => {
      renderApp();

      expect(screen.getByRole("tab", { name: /All \(6\)/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Zoom \(2\)/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Slack \(2\)/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Jira \(2\)/ })).toBeInTheDocument();
    });

    it("renders summary cards with titles in All tab", () => {
      renderApp();

      // Zoom titles (meeting_topic)
      expect(screen.getByText("Sprint Planning")).toBeInTheDocument();
      expect(screen.getByText("Design Review")).toBeInTheDocument();

      // Slack titles (short_summary — appears as both title and summary text)
      expect(screen.getAllByText("Deploy discussion thread").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Release checklist review").length).toBeGreaterThanOrEqual(1);

      // Jira titles (ticket_key)
      expect(screen.getByText("PROJ-101")).toBeInTheDocument();
      expect(screen.getByText("PROJ-202")).toBeInTheDocument();
    });
  });

  // ── Zoom rendering ──────────────────────────────────────────────────────

  describe("Zoom summary rendering", () => {
    it("shows Zoom badge on zoom cards", () => {
      renderApp();

      const zoomBadges = screen.getAllByText("📹 Zoom");
      expect(zoomBadges.length).toBe(2);
    });

    it("expanding a zoom card shows action_items and key_decisions", () => {
      renderApp();

      // Find the Sprint Planning card and click to expand
      const sprintCard = screen.getByText("Sprint Planning").closest("button")!;
      fireEvent.click(sprintCard);

      // Action items
      expect(screen.getByText("Action Items")).toBeInTheDocument();
      expect(screen.getByText(/Review PRs by Friday/)).toBeInTheDocument();
      expect(screen.getByText(/Update documentation/)).toBeInTheDocument();

      // Key decisions
      expect(screen.getByText("Key Decisions")).toBeInTheDocument();
      expect(screen.getByText(/Use React 19/)).toBeInTheDocument();
      expect(screen.getByText(/Switch to Vitest/)).toBeInTheDocument();
    });
  });

  // ── Slack rendering ─────────────────────────────────────────────────────

  describe("Slack summary rendering", () => {
    it("shows Slack badge and tone badge", () => {
      renderApp();

      const slackBadges = screen.getAllByText("💬 Slack");
      expect(slackBadges.length).toBe(2);

      // Tone badges
      expect(screen.getByText("positive")).toBeInTheDocument();
      expect(screen.getByText("neutral")).toBeInTheDocument();
    });

    it("shows channel_id", () => {
      renderApp();

      expect(screen.getByText("#engineering")).toBeInTheDocument();
      expect(screen.getByText("#releases")).toBeInTheDocument();
    });

    it("expanding a slack card shows participants", () => {
      renderApp();

      // Slack short_summary is used as both title and summary text; use getAllByText
      const slackCard = screen
        .getAllByText("Deploy discussion thread")[0]!
        .closest("button")!;
      fireEvent.click(slackCard);

      expect(screen.getByText("Participants")).toBeInTheDocument();
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("carol")).toBeInTheDocument();
    });
  });

  // ── Jira rendering ──────────────────────────────────────────────────────

  describe("Jira summary rendering", () => {
    it("shows Jira badge, priority badge, and status badge", () => {
      renderApp();

      const jiraBadges = screen.getAllByText("🎯 Jira");
      expect(jiraBadges.length).toBe(2);

      // Priority badges
      expect(screen.getByText("high")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
    });

    it("status badge formats underscores as spaces", () => {
      renderApp();

      expect(screen.getByText("in progress")).toBeInTheDocument();
      expect(screen.getByText("to do")).toBeInTheDocument();
    });
  });

  // ── Empty state ─────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("shows 'No summaries found' when all arrays are empty", () => {
      renderWithProviders(
        <SummariesApp
          zoom={[]}
          slack={[]}
          jira={[]}
          all={[]}
          slackChannels={[]}
        />,
      );

      expect(screen.getByText("No summaries found")).toBeInTheDocument();
    });
  });

  // ── Tab switching ───────────────────────────────────────────────────────

  describe("tab switching", () => {
    function getActivePanel() {
      // Radix marks the active tab panel with data-state="active"
      const panel = document.querySelector(
        "[role='tabpanel'][data-state='active']",
      );
      return within(panel as HTMLElement);
    }

    it("clicking Zoom tab shows zoom items in active panel", () => {
      renderApp();

      fireEvent.click(screen.getByRole("tab", { name: /Zoom/ }));

      const panel = getActivePanel();
      expect(panel.getByText("Sprint Planning")).toBeInTheDocument();
      expect(panel.getByText("Design Review")).toBeInTheDocument();
      // Verify source badges confirm these are zoom items
      expect(panel.getAllByText("📹 Zoom").length).toBe(2);
    });

    it("clicking Slack tab shows slack items in active panel", () => {
      renderApp();

      fireEvent.click(screen.getByRole("tab", { name: /Slack/ }));

      const panel = getActivePanel();
      expect(panel.getAllByText("💬 Slack").length).toBe(2);
      expect(panel.getByText("#engineering")).toBeInTheDocument();
      expect(panel.getByText("#releases")).toBeInTheDocument();
    });

    it("clicking Jira tab shows jira items in active panel", () => {
      renderApp();

      fireEvent.click(screen.getByRole("tab", { name: /Jira/ }));

      const panel = getActivePanel();
      expect(panel.getByText("PROJ-101")).toBeInTheDocument();
      expect(panel.getByText("PROJ-202")).toBeInTheDocument();
      expect(panel.getAllByText("🎯 Jira").length).toBe(2);
    });
  });
});
