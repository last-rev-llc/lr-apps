// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@repo/test-utils";
import { PlanSection } from "../components/plan-section";

const render = renderWithProviders;

const NOW = new Date("2026-04-29T12:00:00.000Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PlanSection", () => {
  it("renders nothing when plan is null", () => {
    const { container } = render(
      <PlanSection plan={null} planModel={null} planGeneratedAt={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when plan is empty string", () => {
    const { container } = render(
      <PlanSection plan="" planModel={null} planGeneratedAt={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a 'Show plan' toggle and expands to render markdown lists and bold", () => {
    const md = "Here is the plan:\n\n- **Bold step**\n- second step";
    render(
      <PlanSection
        plan={md}
        planModel="claude-sonnet-4-6"
        planGeneratedAt="2026-04-29T11:30:00.000Z"
      />,
    );

    const toggle = screen.getByRole("button", { name: /show plan/i });
    expect(toggle).toBeInTheDocument();
    expect(screen.queryByText("Bold step")).not.toBeInTheDocument();

    fireEvent.click(toggle);

    // Markdown list rendered as <li> with strong
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
    expect(screen.getByText("Bold step").tagName.toLowerCase()).toBe("strong");

    // Caption with model + relative time
    const caption = screen.getByTestId("plan-caption");
    expect(caption.textContent).toContain("claude-sonnet-4-6");
    expect(caption.textContent?.toLowerCase()).toContain("ago");
  });

  it("does not render raw HTML — sanitizes by escaping it", () => {
    const md = "Hello <script>alert('xss')</script> world";
    render(
      <PlanSection
        plan={md}
        planModel="claude-sonnet-4-6"
        planGeneratedAt="2026-04-29T11:30:00.000Z"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show plan/i }));
    // No <script> tag should be in the DOM (react-markdown does not parse raw HTML by default)
    expect(document.querySelector("script")).toBeNull();
  });

  it("applies a stale class when the plan is older than 30 days", () => {
    const fortyDaysAgo = new Date(NOW - 40 * 86_400_000).toISOString();
    render(
      <PlanSection
        plan="step"
        planModel="claude-sonnet-4-6"
        planGeneratedAt={fortyDaysAgo}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show plan/i }));
    const caption = screen.getByTestId("plan-caption");
    expect(caption.className).toContain("italic");
    expect(caption.textContent).toContain("stale");
  });

  it("does not apply the stale class when the plan is recent", () => {
    const oneDayAgo = new Date(NOW - 86_400_000).toISOString();
    render(
      <PlanSection
        plan="step"
        planModel="claude-sonnet-4-6"
        planGeneratedAt={oneDayAgo}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show plan/i }));
    const caption = screen.getByTestId("plan-caption");
    expect(caption.className).not.toContain("italic");
    expect(caption.textContent).not.toContain("stale");
  });

  it("falls back to 'unknown model' when planModel is null", () => {
    render(
      <PlanSection
        plan="step"
        planModel={null}
        planGeneratedAt="2026-04-29T11:30:00.000Z"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show plan/i }));
    const caption = screen.getByTestId("plan-caption");
    expect(caption.textContent).toContain("unknown model");
  });
});
