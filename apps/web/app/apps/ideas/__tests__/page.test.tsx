// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import IdeasPage from "../page";

describe("IdeasPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<IdeasPage />);
    expect(screen.getByRole("heading", { name: "Ideas" })).toBeInTheDocument();
  });
});
