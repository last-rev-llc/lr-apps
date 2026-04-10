// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import { SubscriptionCard } from "../components/SubscriptionCard";
import type { Subscription } from "@repo/billing";

vi.mock("../components/ManageSubscriptionButton", () => ({
  ManageSubscriptionButton: () => (
    <button type="button">Manage Subscription</button>
  ),
}));

const baseSubscription: Subscription = {
  id: "sub_1",
  user_id: "user_1",
  stripe_customer_id: "cus_abc123",
  stripe_subscription_id: "sub_abc123",
  tier: "pro",
  status: "active",
  current_period_start: "2026-03-15T12:00:00Z",
  current_period_end: "2026-04-15T12:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("SubscriptionCard", () => {
  it("shows Free Plan when subscription is null", () => {
    renderWithProviders(<SubscriptionCard subscription={null} />);

    expect(screen.getByText("Free Plan")).toBeTruthy();
    expect(screen.getByText("View Pricing")).toBeTruthy();
    expect(
      screen.queryByText("Manage Subscription"),
    ).toBeNull();
  });

  it("shows Free Plan when subscription has no stripe_customer_id", () => {
    const sub: Subscription = {
      ...baseSubscription,
      stripe_customer_id: null,
    };
    renderWithProviders(<SubscriptionCard subscription={sub} />);

    expect(screen.getByText("Free Plan")).toBeTruthy();
    expect(screen.getByText("View Pricing")).toBeTruthy();
  });

  it("shows active subscription with tier and status badge", () => {
    renderWithProviders(<SubscriptionCard subscription={baseSubscription} />);

    expect(screen.getByText("Pro Plan")).toBeTruthy();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByText("Manage Subscription")).toBeTruthy();
  });

  it("shows renewal date for active subscription", () => {
    renderWithProviders(<SubscriptionCard subscription={baseSubscription} />);

    expect(screen.getByText("Renewal date")).toBeTruthy();
    // Date formatted as "April 15, 2026" — mid-month date avoids timezone edge cases
    expect(screen.getByText(/April 15, 2026/)).toBeTruthy();
  });

  it("shows Past Due badge and warning for past_due status", () => {
    const sub: Subscription = { ...baseSubscription, status: "past_due" };
    renderWithProviders(<SubscriptionCard subscription={sub} />);

    expect(screen.getByText("Past Due")).toBeTruthy();
    expect(
      screen.getByText(/update your payment method/i),
    ).toBeTruthy();
  });

  it("shows Canceled badge and warning for canceled status", () => {
    const sub: Subscription = { ...baseSubscription, status: "canceled" };
    renderWithProviders(<SubscriptionCard subscription={sub} />);

    expect(screen.getAllByText("Canceled").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/access continues until the end of the billing period/i),
    ).toBeTruthy();
  });

  it("shows enterprise tier correctly", () => {
    const sub: Subscription = { ...baseSubscription, tier: "enterprise" };
    renderWithProviders(<SubscriptionCard subscription={sub} />);

    expect(screen.getByText("Enterprise Plan")).toBeTruthy();
  });

  it("View Pricing link points to /pricing", () => {
    renderWithProviders(<SubscriptionCard subscription={null} />);

    const link = screen.getByText("View Pricing").closest("a");
    expect(link?.getAttribute("href")).toBe("/pricing");
  });
});
