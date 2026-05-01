// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import { QuotaIndicator } from "../components/quota-indicator";

describe("QuotaIndicator", () => {
  it("renders count/limit and tier label for free tier", () => {
    renderWithProviders(
      <QuotaIndicator count={3} limit={5} tier="free" />,
    );
    const el = screen.getByTestId("quota-indicator");
    expect(el.textContent).toContain("3/5");
    expect(el.textContent).toContain("Free");
  });

  it("renders Pro label for pro tier", () => {
    renderWithProviders(
      <QuotaIndicator count={12} limit={200} tier="pro" />,
    );
    const el = screen.getByTestId("quota-indicator");
    expect(el.textContent).toContain("12/200");
    expect(el.textContent).toContain("Pro");
  });

  it("renders Enterprise label for enterprise tier", () => {
    renderWithProviders(
      <QuotaIndicator count={100} limit={500} tier="enterprise" />,
    );
    expect(screen.getByTestId("quota-indicator").textContent).toContain(
      "Enterprise",
    );
  });

  it("uses aria-live=polite for accessibility", () => {
    renderWithProviders(
      <QuotaIndicator count={1} limit={5} tier="free" />,
    );
    expect(
      screen.getByTestId("quota-indicator").getAttribute("aria-live"),
    ).toBe("polite");
  });
});
