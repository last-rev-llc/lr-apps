// @vitest-environment jsdom
import React from "react";
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from "vitest";
import { renderWithProviders, screen, waitFor, fireEvent } from "@repo/test-utils";

const summarizeMock = vi.fn();
vi.mock("../lib/actions", () => ({
  summarizeClientHealth: (...args: unknown[]) => summarizeMock(...args),
}));

import { AISummaryPanel } from "./ai-summary-panel";

beforeEach(() => {
  summarizeMock.mockReset();
});

describe("AISummaryPanel", () => {
  it("renders all four sections on a pro success", async () => {
    summarizeMock.mockResolvedValue({
      ok: true,
      summary: {
        headline: "Acme is stable across the portfolio.",
        positives: ["All sites up", "SSL valid"],
        concerns: ["One slow endpoint"],
        recommendations: ["Investigate slow endpoint", "Renew SSL early"],
      },
      cached: false,
      cachedAt: new Date().toISOString(),
      model: "claude-sonnet-4-6",
    });

    renderWithProviders(<AISummaryPanel clientId="c-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Acme is stable across the portfolio."),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Positives")).toBeInTheDocument();
    expect(screen.getByText("All sites up")).toBeInTheDocument();
    expect(screen.getByText("Concerns")).toBeInTheDocument();
    expect(screen.getByText("One slow endpoint")).toBeInTheDocument();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();
    expect(screen.getByText("Investigate slow endpoint")).toBeInTheDocument();
    expect(screen.getByText("Renew SSL early")).toBeInTheDocument();
  });

  it("renders the UpgradePrompt for free users when feature_locked", async () => {
    summarizeMock.mockResolvedValue({
      ok: false,
      error: "feature_locked",
      requiredTier: "pro",
    });

    renderWithProviders(<AISummaryPanel clientId="c-1" />);

    await waitFor(() => {
      expect(screen.getByText("Pro Plan Required")).toBeInTheDocument();
    });
    expect(screen.queryByText("AI Health Summary")).not.toBeInTheDocument();
  });

  it("renders an error message when the action returns an error", async () => {
    summarizeMock.mockResolvedValue({ ok: false, error: "server_error" });

    renderWithProviders(<AISummaryPanel clientId="c-1" />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert").textContent).toMatch(/failed/i);
  });

  it("shows a rate limit notice with reset time when rate_limited", async () => {
    const resetAt = Date.now() + 30 * 60 * 1000;
    summarizeMock.mockResolvedValue({
      ok: false,
      error: "rate_limited",
      resetAt,
    });

    renderWithProviders(<AISummaryPanel clientId="c-1" />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("alert").textContent).toMatch(/rate limit/i);
  });

  it("re-runs the action when Refresh summary is clicked", async () => {
    summarizeMock.mockResolvedValue({
      ok: true,
      summary: {
        headline: "Steady",
        positives: [],
        concerns: [],
        recommendations: [],
      },
      cached: false,
      cachedAt: new Date().toISOString(),
      model: "claude-sonnet-4-6",
    });

    renderWithProviders(<AISummaryPanel clientId="c-1" />);

    await waitFor(() => {
      expect(screen.getByText("Steady")).toBeInTheDocument();
    });
    expect(summarizeMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /refresh summary/i }));

    await waitFor(() => {
      expect(summarizeMock).toHaveBeenCalledTimes(2);
    });
  });

  it("shows 'Cached · …' label when the response is cached", async () => {
    summarizeMock.mockResolvedValue({
      ok: true,
      summary: {
        headline: "Cached headline",
        positives: [],
        concerns: [],
        recommendations: [],
      },
      cached: true,
      cachedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      model: "claude-sonnet-4-6",
    });

    renderWithProviders(<AISummaryPanel clientId="c-1" />);

    await waitFor(() => {
      expect(screen.getByText("Cached headline")).toBeInTheDocument();
    });
    const cachedLabel = screen.getByText(/cached/i, { selector: "span" });
    expect(cachedLabel.textContent).toMatch(/cached/i);
  });
});
