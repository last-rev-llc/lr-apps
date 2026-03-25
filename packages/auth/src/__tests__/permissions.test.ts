import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSION_HIERARCHY } from "../permissions";

describe("permissions", () => {
  it("view satisfies view requirement", () => {
    expect(hasPermission("view", "view")).toBe(true);
  });

  it("edit satisfies view requirement", () => {
    expect(hasPermission("edit", "view")).toBe(true);
  });

  it("admin satisfies view requirement", () => {
    expect(hasPermission("admin", "view")).toBe(true);
  });

  it("admin satisfies edit requirement", () => {
    expect(hasPermission("admin", "edit")).toBe(true);
  });

  it("view does NOT satisfy edit requirement", () => {
    expect(hasPermission("view", "edit")).toBe(false);
  });

  it("view does NOT satisfy admin requirement", () => {
    expect(hasPermission("view", "admin")).toBe(false);
  });

  it("edit does NOT satisfy admin requirement", () => {
    expect(hasPermission("edit", "admin")).toBe(false);
  });

  it("hierarchy is ordered correctly", () => {
    expect(PERMISSION_HIERARCHY).toEqual(["view", "edit", "admin"]);
  });
});
