// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@repo/test-utils";

beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  }
});

const deleteContactMock = vi.fn();
const updateContactMock = vi.fn();

vi.mock("../lib/actions", () => ({
  deleteContact: (...args: unknown[]) => deleteContactMock(...args),
  updateContact: (...args: unknown[]) => updateContactMock(...args),
  createContact: vi.fn(),
}));

import { ContactDetail } from "../components/contact-detail";

const FIXTURE = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Alice Johnson",
  type: "team" as const,
  email: "alice@lastrev.com",
};

describe("ContactDetail", () => {
  beforeEach(() => {
    deleteContactMock.mockReset();
    updateContactMock.mockReset();
    vi.spyOn(global, "fetch").mockReset();
  });

  it("renders Edit / Delete / Re-research action buttons", () => {
    renderWithProviders(<ContactDetail contact={FIXTURE} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Re-research" })).toBeInTheDocument();
  });

  it("toggles into edit mode when Edit is clicked", () => {
    renderWithProviders(<ContactDetail contact={FIXTURE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("opens a confirm dialog when Delete is clicked", () => {
    renderWithProviders(<ContactDetail contact={FIXTURE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete contact?")).toBeInTheDocument();
  });

  it("calls deleteContact and closes on confirm", async () => {
    deleteContactMock.mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderWithProviders(<ContactDetail contact={FIXTURE} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Delete" }).find((b) => b.closest('[role="alertdialog"]') || b.closest('[role="dialog"]'))!,
    );

    await waitFor(() => {
      expect(deleteContactMock).toHaveBeenCalledWith(FIXTURE.id);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("posts to /api/enrich on Re-research and surfaces 429", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 }),
    );

    renderWithProviders(<ContactDetail contact={FIXTURE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Re-research" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/enrich",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText(/Rate limited/i)).toBeInTheDocument();
  });
});
