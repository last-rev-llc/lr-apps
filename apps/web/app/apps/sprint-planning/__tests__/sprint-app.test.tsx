// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithProviders, screen, waitFor, fireEvent, act } from "@repo/test-utils";
import type { SprintItem, SprintClient, ArchiveRecord } from "../lib/types";

vi.mock("@repo/ui", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <button data-value={value}>{children}</button>,
  TabsContent: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-tab={value}>{children}</div>,
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

// ── Factory helpers ──────────────────────────────────────────────────────────

function makeSprintItem(overrides: Partial<SprintItem> = {}): SprintItem {
  return {
    title: "Test Item",
    status: "not-started",
    ...overrides,
  };
}

function makeSprintClient(
  name: string,
  items: SprintItem[] = [],
): SprintClient {
  return { name, items };
}

function makeArchiveRecord(
  type: ArchiveRecord["_type"],
  overrides: Partial<ArchiveRecord> = {},
): ArchiveRecord {
  return {
    id: `${type}-1`,
    date: "2026-04-08",
    _type: type,
    summary: `A ${type} summary`,
    ...overrides,
  };
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

function mockFetchSuccess(data: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  } as unknown as Response);
}

function mockFetchError() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
  } as unknown as Response);
}

import { SprintApp } from "../components/sprint-app";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchError();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SprintApp — backlog tab", () => {
  it("backlog renders grouped by client with mock data", async () => {
    mockFetchSuccess({
      clients: [
        makeSprintClient("Acme Corp", [
          makeSprintItem({ title: "Acme Task 1" }),
          makeSprintItem({ title: "Acme Task 2" }),
        ]),
        makeSprintClient("Beta Inc", [
          makeSprintItem({ title: "Beta Task 1" }),
        ]),
      ],
    });

    renderWithProviders(<SprintApp archives={[]} />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText("Acme Task 1")).toBeInTheDocument();
    expect(screen.getByText("Acme Task 2")).toBeInTheDocument();
    expect(screen.getByText("Beta Task 1")).toBeInTheDocument();
  });

  it("shows item counts per client", async () => {
    mockFetchSuccess({
      clients: [
        makeSprintClient("Acme Corp", [
          makeSprintItem(),
          makeSprintItem(),
          makeSprintItem(),
        ]),
      ],
    });

    renderWithProviders(<SprintApp archives={[]} />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("shows empty state when no backlog data", async () => {
    mockFetchError();

    renderWithProviders(<SprintApp archives={[]} />);

    await waitFor(() => {
      expect(
        screen.getByText(/No backlog data yet/),
      ).toBeInTheDocument();
    });
  });

  it("ticket cards render with correct status", async () => {
    mockFetchSuccess({
      clients: [
        makeSprintClient("Acme Corp", [
          makeSprintItem({ title: "Blocked Task", status: "blocked" }),
          makeSprintItem({ title: "In Progress Task", status: "in-progress" }),
          makeSprintItem({ title: "Done Task", status: "done" }),
        ]),
      ],
    });

    renderWithProviders(<SprintApp archives={[]} />);

    await waitFor(() => {
      expect(screen.getByText("Blocked Task")).toBeInTheDocument();
    });

    // Blocked items appear under the blocked status group header
    expect(screen.getByText(/🛑 Blocked/)).toBeInTheDocument();
    // In-progress items appear under their group
    expect(screen.getByText(/🔄 In Progress/)).toBeInTheDocument();
    expect(screen.getByText("In Progress Task")).toBeInTheDocument();
    // Done items appear in the "What Got Done" section label
    expect(screen.getByText(/What Got Done/)).toBeInTheDocument();
  });

  it("done section is collapsible", async () => {
    mockFetchSuccess({
      clients: [
        makeSprintClient("Acme Corp", [
          makeSprintItem({ title: "Active Task", status: "in-progress" }),
          makeSprintItem({ title: "Finished Feature", status: "done" }),
        ]),
      ],
    });

    renderWithProviders(<SprintApp archives={[]} />);

    await waitFor(() => {
      expect(screen.getByText("Active Task")).toBeInTheDocument();
    });

    // Done task not visible before toggle is clicked
    expect(screen.queryByText("Finished Feature")).not.toBeInTheDocument();

    // Find the collapse toggle button and click it
    const buttons = screen.getAllByRole("button");
    const doneToggle = buttons.find((b) =>
      /Completed This Week/.test(b.textContent ?? ""),
    );
    expect(doneToggle).toBeDefined();
    fireEvent.click(doneToggle!);

    // Done task now visible
    expect(screen.getByText("Finished Feature")).toBeInTheDocument();
  });
});

describe("SprintApp — archives tab", () => {
  it("archive display shows completed sprints with type badges", async () => {
    const archives = [
      makeArchiveRecord("digest", { id: "d1", summary: "Digest summary text" }),
      makeArchiveRecord("weekly", { id: "w1", summary: "Weekly summary text" }),
    ];

    await act(async () => {
      renderWithProviders(<SprintApp archives={archives} />);
    });

    expect(screen.getByText("Digest")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Digest summary text")).toBeInTheDocument();
    expect(screen.getByText("Weekly summary text")).toBeInTheDocument();
  });

  it("shows all three archive types", async () => {
    const archives = [
      makeArchiveRecord("digest", { id: "d1" }),
      makeArchiveRecord("overview", { id: "o1" }),
      makeArchiveRecord("weekly", { id: "w1" }),
    ];

    await act(async () => {
      renderWithProviders(<SprintApp archives={archives} />);
    });

    expect(screen.getByText("Digest")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("shows empty state when no archives", async () => {
    await act(async () => {
      renderWithProviders(<SprintApp archives={[]} />);
    });

    expect(screen.getByText("No archive records found")).toBeInTheDocument();
  });

  it("archive filters narrow results by type", async () => {
    const archives = [
      makeArchiveRecord("digest", { id: "d1" }),
      makeArchiveRecord("overview", { id: "o1" }),
      makeArchiveRecord("weekly", { id: "w1" }),
    ];

    await act(async () => {
      renderWithProviders(<SprintApp archives={archives} />);
    });

    // Switch to "All time" range so no records are filtered by date
    fireEvent.click(screen.getByText("All time"));

    // All types visible initially
    expect(screen.getByText("Digest")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();

    // Click "Daily Digests" type filter
    fireEvent.click(screen.getByText("Daily Digests"));

    // Only digest records remain
    expect(screen.getByText("Digest")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
  });
});
