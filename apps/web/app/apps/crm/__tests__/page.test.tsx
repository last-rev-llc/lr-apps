// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("../lib/queries", () => ({
  getContacts: vi.fn(async () => []),
}));

vi.mock("../components/contact-detail", () => ({
  ContactDetail: () => null,
  ContactTypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock("../lib/actions", () => ({
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
}));

import CrmPage from "../page";

describe("CrmPage", () => {
  it("renders the CRM contact list shell via CrmApp", async () => {
    const ui = await CrmPage();
    renderWithProviders(ui);
    expect(screen.getByText("CRM")).toBeInTheDocument();
    expect(screen.getByText(/0 contacts/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new contact/i }),
    ).toBeInTheDocument();
  });
});
