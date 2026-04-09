// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

// StatCard uses IntersectionObserver to trigger count-up animation
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("@/app/apps/accounts/lib/queries", () => ({
  getClients: vi.fn().mockResolvedValue([
    {
      id: "c1",
      name: "Acme Corp",
      github: { openPRs: 5 },
      contacts: [{ name: "Alice", email: "alice@acme.com" }],
      jira: { openTickets: 12 },
    },
    {
      id: "c2",
      name: "Beta Inc",
      github: { openPRs: 3 },
      contacts: [
        { name: "Bob", email: "bob@beta.com" },
        { name: "Carol", email: "carol@beta.com" },
      ],
      jira: { openTickets: 7 },
    },
  ]),
  computeOverviewStats: vi.fn().mockReturnValue({
    total: 2,
    totalPRs: 8,
    totalContacts: 3,
    totalJiraTickets: 19,
  }),
}));

// Mock the client component to avoid rendering the full interactive tree
vi.mock("@/app/apps/accounts/components/accounts-app", () => ({
  AccountsApp: ({ clients }: { clients: unknown[] }) => (
    <div data-testid="accounts-app">clients: {clients.length}</div>
  ),
}));

import AccountsPage from "../page";

describe("AccountsPage", () => {
  it("renders the page header with Accounts title", async () => {
    const jsx = await AccountsPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Accounts")).toBeInTheDocument();
    expect(screen.getByText("Every client. One dashboard.")).toBeInTheDocument();
  });

  it("renders all four stat card labels", async () => {
    const jsx = await AccountsPage();
    renderWithProviders(jsx);

    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Open PRs")).toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Jira Tickets")).toBeInTheDocument();
  });

  it("passes clients to AccountsApp", async () => {
    const jsx = await AccountsPage();
    renderWithProviders(jsx);

    expect(screen.getByTestId("accounts-app")).toHaveTextContent("clients: 2");
  });
});
