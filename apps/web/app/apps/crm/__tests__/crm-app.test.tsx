// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
    observe: vi.fn(() => {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@repo/db/client", () => ({ createClient: vi.fn(() => ({})) }));

vi.mock("../components/contact-detail", () => ({
  ContactDetail: () => null,
  ContactTypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

import { CrmApp } from "../components/crm-app";

const FIXTURE_CONTACTS = [
  {
    id: "contact-1",
    name: "Alice Johnson",
    type: "team" as const,
    company: "Last Rev",
    email: "alice@lastrev.com",
    title: "Engineer",
  },
  {
    id: "contact-2",
    name: "Bob Smith",
    type: "client" as const,
    company: "Acme Corp",
    email: "bob@acme.com",
    title: "Director",
  },
];

describe("CrmApp", () => {
  it("renders the CRM header (no Contacts emoji)", () => {
    renderWithProviders(<CrmApp initialContacts={[]} />);
    expect(screen.getByText("CRM")).toBeInTheDocument();
    expect(screen.queryByText(/👥/)).toBeNull();
  });

  it("preserves the {n} contacts · {m} with insights subtitle", () => {
    renderWithProviders(<CrmApp initialContacts={FIXTURE_CONTACTS} />);
    expect(screen.getByText(/2 contacts · 0 with insights/)).toBeInTheDocument();
  });

  it("renders the no-contacts-match empty state when filtered list is empty", () => {
    renderWithProviders(<CrmApp initialContacts={[]} />);
    expect(screen.getByText("No contacts match")).toBeInTheDocument();
  });

  it("renders contact cards with names from a populated list", () => {
    renderWithProviders(<CrmApp initialContacts={FIXTURE_CONTACTS} />);
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  it("renders type filter buttons for each populated type", () => {
    renderWithProviders(<CrmApp initialContacts={FIXTURE_CONTACTS} />);
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
  });

  it("shows contact avatar initials", () => {
    renderWithProviders(<CrmApp initialContacts={FIXTURE_CONTACTS} />);
    expect(screen.getAllByText("AJ").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BS").length).toBeGreaterThan(0);
  });
});
