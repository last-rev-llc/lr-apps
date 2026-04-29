// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import ClientHealthPage from "../page";

describe("ClientHealthPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<ClientHealthPage />);
    expect(screen.getByRole("heading", { name: "Client Health" })).toBeInTheDocument();
  });
});
