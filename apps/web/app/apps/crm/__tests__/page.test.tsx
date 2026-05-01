// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import CrmPage from "../page";

describe("CrmPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<CrmPage />);
    expect(screen.getByRole("heading", { name: "CRM" })).toBeInTheDocument();
  });
});
