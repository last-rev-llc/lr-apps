// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, fireEvent, waitFor } from "@repo/test-utils";
import type { SprintData, ArchiveRecord } from "../lib/types";
import { SprintApp } from "../components/sprint-app";

// ── Mock data ──────────────────────────────────────────────────────────────

const mockSprintData: SprintData = {
  lastUpdated: "2025-04-07T10:00:00Z",
  clients: [
    {
      name: "Acme Corp",
      items: [
        {
          title: "Fix login bug",
          status: "blocked",
          priority: "high",
          assignees: ["Alice"],
          summary: "Login fails on Safari",
        },
        {
          title: "Design dashboard",
          status: "in-progress",
          priority: "medium",
          assignees: ["Bob", "Carol"],
        },
        {
          title: "Write tests",
          status: "not-started",
          priority: "low",
        },
        {
          title: "Write docs",
          status: "done",
          priority: "low",
        },
      ],
    },
    {
      name: "Beta Inc",
      items: [
        {
          title: "API integration",
          status: "not-started",
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        },
        {
          title: "Deploy staging",
          status: "in-review",
          dueDate: new Date(Date.now() - 86400000).toISOString(), // overdue
        },
      ],
    },
  ],
};

// Dates relative to 2026-04-09 (today) to pass the default 30-day filter
const TODAY = new Date("2026-04-09");
function daysAgo(n: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const mockArchives: ArchiveRecord[] = [
  {
    id: "a1",
    date: daysAgo(2), // 2 days ago — within 7 days
    _type: "digest",
    service: "slack",
    item_count: 5,
    summary: "Slack digest summary for the day",
  },
  {
    id: "a2",
    date: daysAgo(3), // 3 days ago — within 7 days
    _type: "overview",
    summary: "Daily overview summary",
  },
  {
    id: "a3",
    date: daysAgo(8), // 8 days ago — within 30 days, but NOT within 7 days
    _type: "weekly",
    summary: "Weekly summary recap",
  },
];

function mockFetchSuccess(data: SprintData = mockSprintData) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
    }),
  );
}

function mockFetchFailure() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
}

async function openArchivesTab() {
  const archivesTab = screen.getByRole("tab", { name: /Archives/ });
  await act(async () => {
    fireEvent.mouseDown(archivesTab, { button: 0, ctrlKey: false });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── SprintApp ──────────────────────────────────────────────────────────────

describe("SprintApp", () => {
  describe("Tabs", () => {
    it("renders Agenda and Archives tabs", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      expect(screen.getByText(/Agenda/)).toBeInTheDocument();
      expect(screen.getByText(/Archives/)).toBeInTheDocument();
    });
  });

  describe("Agenda tab — loading and empty state", () => {
    it("shows empty state when no clients are returned", async () => {
      mockFetchSuccess({ clients: [] });
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("No backlog data yet")).toBeInTheDocument();
      });
    });

    it("shows empty state when fetch fails", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("No backlog data yet")).toBeInTheDocument();
      });
    });
  });

  describe("Agenda tab — ClientCard rendering", () => {
    it("renders a card for each client", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Beta Inc")).toBeInTheDocument();
      });
    });

    it("renders item titles", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("Fix login bug")).toBeInTheDocument();
        expect(screen.getByText("Design dashboard")).toBeInTheDocument();
        expect(screen.getByText("API integration")).toBeInTheDocument();
      });
    });

    it("renders item summary text", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("Login fails on Safari")).toBeInTheDocument();
      });
    });
  });

  describe("PriorityBadge — uses @repo/ui Badge", () => {
    it("renders high priority badge with destructive variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const badge = screen.getByText("high");
        expect(badge.className).toMatch(/destructive/);
      });
    });

    it("renders medium priority badge with secondary variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const badge = screen.getByText("medium");
        expect(badge.className).toMatch(/secondary/);
      });
    });

    it("renders low priority badge with outline variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      // "Write tests" has status "not-started" and priority "low" — rendered in outstanding section
      await waitFor(() => {
        const badges = screen.getAllByText("low");
        const outlineBadge = badges.find((b) => b.className.includes("outline"));
        expect(outlineBadge).toBeDefined();
      });
    });
  });

  describe("DueDateBadge — uses @repo/ui Badge", () => {
    it("renders overdue badge with destructive variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const badge = screen.getByText(/Overdue/);
        expect(badge.className).toMatch(/destructive/);
      });
    });

    it("renders upcoming due date with secondary variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const badge = screen.getByText(/Due /);
        expect(badge.className).toMatch(/secondary/);
      });
    });
  });

  describe("Assignee badges — uses @repo/ui Badge", () => {
    it("renders assignee names as secondary badges", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const aliceBadge = screen.getByText("Alice");
        expect(aliceBadge.className).toMatch(/secondary/);
        const bobBadge = screen.getByText("Bob");
        expect(bobBadge.className).toMatch(/secondary/);
      });
    });
  });

  describe("StatusBadge — uses @repo/ui StatusBadge", () => {
    it("renders blocked status with error variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const badge = screen.getByText(/Blocked/);
        expect(badge.className).toMatch(/red/);
      });
    });

    it("renders in-progress status with warning variant", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const badge = screen.getByText(/In Progress/);
        expect(badge.className).toMatch(/amber/);
      });
    });
  });

  describe("Done section — collapsible with Button ghost", () => {
    it("renders done section toggle button", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText(/Completed This Week/)).toBeInTheDocument();
      });
    });

    it("expands done items when toggle is clicked", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      // Wait for sprint data to load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // "Write docs" is in the done section — collapsed by default (not rendered)
      expect(screen.queryByText("Write docs")).not.toBeInTheDocument();

      // Click the toggle
      const toggle = screen.getByText(/Completed This Week/).closest("button")!;
      await act(async () => {
        fireEvent.click(toggle);
      });

      expect(screen.getByText("Write docs")).toBeInTheDocument();
    });
  });

  describe("ClientCard empty state — uses @repo/ui EmptyState", () => {
    it("shows 'No items' empty state for client with no items", async () => {
      mockFetchSuccess({
        clients: [{ name: "Empty Client", items: [] }],
      });
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("No items")).toBeInTheDocument();
      });
    });
  });

  describe("Section headers — uses @repo/ui CardHeader/CardTitle", () => {
    it("renders 'Outstanding & Next Week' section headers", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        const headers = screen.getAllByText(/Outstanding.*Next Week/);
        expect(headers.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("renders 'Highlights — What Got Done' section header", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText("Highlights — What Got Done")).toBeInTheDocument();
      });
    });
  });

  describe("Last updated", () => {
    it("renders last updated timestamp", async () => {
      mockFetchSuccess();
      renderWithProviders(<SprintApp archives={[]} />);

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  // ── Archives tab ────────────────────────────────────────────────────────

  describe("Archives tab", () => {
    it("shows EmptyState when no archives", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={[]} />);
      await openArchivesTab();

      expect(screen.getByText("No archive records found")).toBeInTheDocument();
    });

    it("renders archive type badges for each record", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={mockArchives} />);
      await openArchivesTab();

      expect(screen.getAllByText("Digest").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Overview").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Weekly").length).toBeGreaterThanOrEqual(1);
    });

    it("renders filter buttons as @repo/ui Button components", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={mockArchives} />);
      await openArchivesTab();

      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Daily Digests" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Daily Overviews" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Weekly Summaries" })).toBeInTheDocument();
    });

    it("filters archives by type when filter button is clicked", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={mockArchives} />);
      await openArchivesTab();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Daily Digests" }));
      });

      expect(screen.getAllByText("Digest").length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText("Overview")).not.toBeInTheDocument();
      expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
    });

    it("shows service filter buttons when Digest is selected", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={mockArchives} />);
      await openArchivesTab();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Daily Digests" }));
      });

      expect(screen.getByRole("button", { name: "slack" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "jira" })).toBeInTheDocument();
    });

    it("renders date range filter buttons", async () => {
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={mockArchives} />);
      await openArchivesTab();

      expect(screen.getByRole("button", { name: "Last 7 days" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Last 30 days" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "All time" })).toBeInTheDocument();
    });

    it("filters out records older than 7 days when Last 7 days is clicked", async () => {
      // a3 is 8 days ago — outside Last 7 days
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={mockArchives} />);
      await openArchivesTab();

      // Weekly (8 days ago) is within Last 30 days (default) — visible
      expect(screen.getAllByText("Weekly").length).toBeGreaterThanOrEqual(1);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
      });

      // Weekly (8 days ago) is outside Last 7 days — hidden
      expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
    });

    it("shows EmptyState after type filtering removes all records", async () => {
      // Only has an overview; filter to digest shows empty state
      const overviewOnly: ArchiveRecord[] = [
        { id: "o1", date: "2025-04-07", _type: "overview", summary: "overview" },
      ];
      mockFetchFailure();
      renderWithProviders(<SprintApp archives={overviewOnly} />);
      await openArchivesTab();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Daily Digests" }));
      });

      expect(screen.getByText("No archive records found")).toBeInTheDocument();
    });
  });
});
