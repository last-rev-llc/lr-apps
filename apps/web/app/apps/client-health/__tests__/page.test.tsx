// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";

vi.mock("../lib/queries", () => ({
  listClientHealth: vi.fn().mockResolvedValue([]),
  getClientHealth: vi.fn(),
}));

import ClientHealthPage from "../page";

describe("ClientHealthPage", () => {
  it("renders the empty state when the user has no clients", async () => {
    const ui = await ClientHealthPage();
    renderWithProviders(ui);
    expect(
      screen.getByRole("heading", { name: "Client Health" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no clients yet/i)).toBeInTheDocument();
  });
});
