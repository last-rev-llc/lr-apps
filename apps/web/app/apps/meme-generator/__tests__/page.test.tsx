// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@repo/test-utils";
import MemeGeneratorPage from "../page";

describe("MemeGeneratorPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<MemeGeneratorPage />);
    expect(screen.getByRole("heading", { name: "Meme Generator" })).toBeInTheDocument();
  });
});
