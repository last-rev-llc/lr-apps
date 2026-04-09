// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("@/lib/require-app-layout-access", () => ({
  requireAppLayoutAccess: vi.fn(),
}));

import { requireAppLayoutAccess } from "@/lib/require-app-layout-access";
import AccountsLayout from "../layout";

const mockRequireAppLayoutAccess = vi.mocked(requireAppLayoutAccess);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAppLayoutAccess.mockResolvedValue(undefined);
});

describe("AccountsLayout", () => {
  it("calls requireAppLayoutAccess with 'accounts'", async () => {
    const jsx = await AccountsLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(mockRequireAppLayoutAccess).toHaveBeenCalledWith("accounts");
  });

  it("renders children when authenticated", async () => {
    const jsx = await AccountsLayout({
      children: <div>child content</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders header with Accounts title", async () => {
    const jsx = await AccountsLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("Accounts")).toBeInTheDocument();
  });

  it("renders Client Intelligence Hub subtitle", async () => {
    const jsx = await AccountsLayout({
      children: <div>test</div>,
    });
    renderWithProviders(jsx);

    expect(screen.getByText("Client Intelligence Hub")).toBeInTheDocument();
  });

  it("propagates auth error when requireAppLayoutAccess rejects", async () => {
    mockRequireAppLayoutAccess.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      AccountsLayout({ children: <div>test</div> }),
    ).rejects.toThrow("Unauthorized");
  });
});
