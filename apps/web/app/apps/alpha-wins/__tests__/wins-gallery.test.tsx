// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
globalThis.React = React;
import { renderWithProviders, screen, fireEvent, act } from "@repo/test-utils";
import { WinsGallery } from "../components/wins-gallery";

const MOCK_WINS = [
  {
    id: "win-1",
    name: "Slack Automation",
    icon: "🤖",
    type: "Workflow",
    description: "Automates Slack messages for the team.",
    integrations: ["Slack"],
    skills: ["Automation"],
    tags: ["team"],
    howItWorks: ["Step 1: Connect Slack", "Step 2: Set trigger"],
    prompt: "Connect Slack and set up the automation trigger.",
    postedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "win-2",
    name: "GitHub PR Summary",
    icon: "📝",
    type: "Integration",
    description: "Summarizes pull requests automatically.",
    integrations: ["GitHub"],
    skills: ["Summarization"],
    tags: ["dev"],
    howItWorks: ["Step 1: Connect GitHub"],
    prompt: "Connect GitHub and summarize open PRs.",
    postedAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "win-3",
    name: "Daily Digest",
    icon: "📰",
    type: "Workflow",
    description: "Sends a daily digest of important updates.",
    integrations: ["Slack", "Email"],
    skills: [],
    tags: ["daily"],
    howItWorks: ["Step 1: Configure sources"],
    prompt: "Set up daily digest with your preferred sources.",
    postedAt: "2026-02-01T10:00:00Z",
  },
];

beforeAll(() => {
  vi.stubGlobal("navigator", {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

describe("WinsGallery", () => {
  it("renders win names and descriptions", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    expect(screen.getByText("Slack Automation")).toBeInTheDocument();
    expect(screen.getByText("GitHub PR Summary")).toBeInTheDocument();
    expect(screen.getByText("Daily Digest")).toBeInTheDocument();
    expect(
      screen.getByText("Automates Slack messages for the team."),
    ).toBeInTheDocument();
  });

  it("shows win count badge", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    expect(screen.getByText("3 wins")).toBeInTheDocument();
  });

  it("filters wins by search query", async () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    const searchInput = screen.getByPlaceholderText("Search wins…");
    fireEvent.change(searchInput, { target: { value: "Slack" } });
    expect(screen.getByText("Slack Automation")).toBeInTheDocument();
    expect(screen.getByText("Daily Digest")).toBeInTheDocument(); // has Slack integration
    expect(screen.queryByText("GitHub PR Summary")).not.toBeInTheDocument();
  });

  it("filters wins by integration pill", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    // Click GitHub integration filter
    fireEvent.click(screen.getByRole("button", { name: "GitHub" }));
    expect(screen.getByText("GitHub PR Summary")).toBeInTheDocument();
    expect(screen.queryByText("Slack Automation")).not.toBeInTheDocument();
  });

  it("renders category filter pills for distinct types", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    // MOCK_WINS has type values "Workflow" (x2) and "Integration" (x1)
    expect(screen.getByRole("button", { name: "All Categories" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workflow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Integration" })).toBeInTheDocument();
  });

  it("filters wins by category pill", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    fireEvent.click(screen.getByRole("button", { name: "Integration" }));
    expect(screen.getByText("GitHub PR Summary")).toBeInTheDocument();
    expect(screen.queryByText("Slack Automation")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Digest")).not.toBeInTheDocument();
  });

  it("category and integration filters compose", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    fireEvent.click(screen.getByRole("button", { name: "Workflow" }));
    // Both Workflow wins still visible
    expect(screen.getByText("Slack Automation")).toBeInTheDocument();
    expect(screen.getByText("Daily Digest")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Email" }));
    // Only Daily Digest matches Workflow + Email
    expect(screen.getByText("Daily Digest")).toBeInTheDocument();
    expect(screen.queryByText("Slack Automation")).not.toBeInTheDocument();
  });

  it("opens modal when win card is clicked", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Slack Automation/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Setup Prompt")).toBeInTheDocument();
  });

  it("shows correct win name in modal", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /GitHub PR Summary/i }),
    );
    // Win name appears in DialogTitle (at least one occurrence in the dialog)
    const matches = screen.getAllByText(/GitHub PR Summary/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("copy prompt button calls clipboard.writeText", async () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Slack Automation/i }),
    );
    const copyBtn = screen.getByRole("button", { name: /Copy Prompt/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      MOCK_WINS[0].prompt,
    );
  });

  it("shows empty state message when search matches nothing", () => {
    renderWithProviders(<WinsGallery wins={MOCK_WINS} />);
    const searchInput = screen.getByPlaceholderText("Search wins…");
    fireEvent.change(searchInput, { target: { value: "zzznomatch" } });
    expect(screen.getByText("No wins match that filter")).toBeInTheDocument();
  });

  it("renders empty gallery without errors", () => {
    renderWithProviders(<WinsGallery wins={[]} />);
    expect(screen.getByText("0 wins")).toBeInTheDocument();
  });
});
