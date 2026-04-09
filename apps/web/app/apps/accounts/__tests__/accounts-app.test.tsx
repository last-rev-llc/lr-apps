// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, fireEvent, within } from "@repo/test-utils";
import { AccountsApp } from "../components/accounts-app";
import type { Client } from "../lib/types";


// ── Mock data ──────────────────────────────────────────────────────────────

const mockClients: Client[] = [
  {
    id: "c1",
    name: "Acme Corp",
    health: "good",
    industry: "SaaS",
    contacts: [
      {
        name: "Alice Johnson",
        role: "VP Engineering",
        email: "alice@acme.com",
        linkedin: "https://linkedin.com/in/alice",
        isPrimary: true,
      },
      {
        name: "Bob Smith",
        role: "CTO",
        email: "bob@acme.com",
        isPrimary: false,
      },
    ],
    github: {
      openPRs: 12,
      repos: ["acme-web", "acme-api"],
      prs: [
        { repo: "acme-web", number: 42, title: "Add dark mode", author: "alice", authorName: "Alice" },
        { repo: "acme-api", number: 99, title: "Fix auth flow", author: "bob", authorName: "Bob" },
      ],
    },
    jira: { status: "active", openTickets: 8, staleTickets: 2 },
  },
  {
    id: "c2",
    name: "Beta Inc",
    health: "at-risk",
    industry: "E-commerce",
    contacts: [
      {
        name: "Carol Davis",
        role: "PM",
        email: "carol@beta.com",
        isPrimary: true,
      },
    ],
    github: {
      openPRs: 3,
      repos: ["beta-store"],
      prs: [
        { repo: "beta-store", number: 7, title: "Update checkout", author: "carol", authorName: "Carol" },
      ],
    },
  },
  {
    id: "c3",
    name: "Gamma Ltd",
    health: "critical",
    industry: "FinTech",
    contacts: [],
    github: { openPRs: 0 },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function clickTab(name: RegExp) {
  const tab = screen.getByRole("tab", { name });
  tab.focus();
  fireEvent.keyDown(tab, { key: "Enter" });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("AccountsApp", () => {
  // ── Client selector ───────────────────────────────────────────────────

  it("renders all client names in the selector dropdown", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Acme Corp");
    expect(options[1]).toHaveTextContent("Beta Inc");
    expect(options[2]).toHaveTextContent("Gamma Ltd");
  });

  it("shows health badge for the selected client", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);

    expect(screen.getByText("good")).toBeInTheDocument();
  });

  it("shows industry badge for the selected client", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);

    // "SaaS" appears in both the selector badge and the overview tab
    expect(screen.getAllByText("SaaS").length).toBeGreaterThanOrEqual(1);
  });

  it("updates dashboard when a different client is selected", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "c2" } });

    expect(screen.getByText("at-risk")).toBeInTheDocument();
    expect(screen.getAllByText("E-commerce").length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state when clients array is empty", () => {
    renderWithProviders(<AccountsApp clients={[]} />);

    expect(screen.getByText("No clients found")).toBeInTheDocument();
  });

  // ── Contacts tab ──────────────────────────────────────────────────────

  it("renders contacts tab with contact details", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/Contacts/i);

    // Contacts tab panel should be active
    const contactsPanel = screen.getByRole("tabpanel");
    expect(within(contactsPanel).getByText("Alice Johnson")).toBeInTheDocument();
    expect(within(contactsPanel).getByText("VP Engineering")).toBeInTheDocument();
    expect(within(contactsPanel).getByText("alice@acme.com")).toBeInTheDocument();
    expect(within(contactsPanel).getByText("Bob Smith")).toBeInTheDocument();
    expect(within(contactsPanel).getByText("CTO")).toBeInTheDocument();
  });

  it("shows Primary badge for primary contacts", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/Contacts/i);

    const contactsPanel = screen.getByRole("tabpanel");
    expect(within(contactsPanel).getByText("Primary")).toBeInTheDocument();
  });

  it("renders LinkedIn links for contacts that have them", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/Contacts/i);

    const contactsPanel = screen.getByRole("tabpanel");
    const linkedinLink = within(contactsPanel).getByText("LinkedIn ↗");
    expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com/in/alice");
  });

  // ── GitHub / PRs tab ──────────────────────────────────────────────────

  it("renders open PR count in the GitHub tab", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/GitHub/i);

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("12")).toBeInTheDocument();
    expect(within(panel).getByText("open PRs")).toBeInTheDocument();
  });

  it("shows Needs attention badge when prCount > 10", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/GitHub/i);

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Needs attention")).toBeInTheDocument();
  });

  it("renders PR list with number and title", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/GitHub/i);

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("#42")).toBeInTheDocument();
    expect(within(panel).getByText("Add dark mode")).toBeInTheDocument();
    expect(within(panel).getByText("#99")).toBeInTheDocument();
    expect(within(panel).getByText("Fix auth flow")).toBeInTheDocument();
  });

  it("renders repo buttons in the GitHub tab", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);
    clickTab(/GitHub/i);

    const panel = screen.getByRole("tabpanel");
    // Repo buttons show the repo name with an emoji prefix
    expect(within(panel).getByText(/acme-web/)).toBeInTheDocument();
    expect(within(panel).getByText(/acme-api/)).toBeInTheDocument();
  });

  it("does not show Needs attention when prCount <= 10", () => {
    renderWithProviders(<AccountsApp clients={mockClients} />);

    // Select Beta Inc (3 open PRs)
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "c2" } });

    clickTab(/GitHub/i);

    expect(screen.queryByText("Needs attention")).not.toBeInTheDocument();
  });
});
