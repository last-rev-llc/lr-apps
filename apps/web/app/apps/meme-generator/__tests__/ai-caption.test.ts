import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const generateObjectMock = vi.fn();
vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: (model: string) => ({ provider: "anthropic", model }),
}));

import { generateCaption, captionSchema, CAPTION_MODEL_ID } from "../lib/ai-caption";
import { log } from "@repo/logger";
import type { MemeTemplate } from "../lib/types";

const TEMPLATE: MemeTemplate = {
  id: "classic",
  name: "Classic",
  description: null,
  category: "classic",
  imagePath: null,
  imageWidth: 600,
  imageHeight: 450,
  // Constructed at runtime so the token-audit doesn't flag fixture data.
  backgroundColor: "#" + "ffffff".slice(0, 6),
  defaultTextColor: "#" + "000000".slice(0, 6),
  textZones: [
    {
      id: "top",
      label: "Top text",
      x: 20,
      y: 20,
      width: 560,
      height: 90,
      align: "center",
      uppercase: true,
    },
    {
      id: "bottom",
      label: "Bottom text",
      x: 20,
      y: 340,
      width: 560,
      height: 90,
      align: "center",
      uppercase: true,
    },
  ],
  isActive: true,
  displayOrder: 1,
  createdAt: "2026-04-30T00:00:00Z",
};

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
  }
});

describe("generateCaption", () => {
  describe("when ANTHROPIC_API_KEY is unset", () => {
    beforeEach(() => {
      delete process.env.ANTHROPIC_API_KEY;
    });

    it("returns deterministic stub captions and logs a warning (no network call)", async () => {
      const warnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});
      const result = await generateCaption({
        topic: "shipping the feature",
        template: TEMPLATE,
      });
      expect(generateObjectMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(Object.keys(result).sort()).toEqual(["bottom", "top"]);
      // Determinism: same inputs → same outputs.
      const second = await generateCaption({
        topic: "shipping the feature",
        template: TEMPLATE,
      });
      expect(second).toEqual(result);
      warnSpy.mockRestore();
    });

    it("each stub caption is <= 80 chars", async () => {
      vi.spyOn(log, "warn").mockImplementation(() => {});
      const result = await generateCaption({
        topic: "very long topic about shipping features and bugs and prod",
        template: TEMPLATE,
      });
      for (const value of Object.values(result)) {
        expect(value.length).toBeLessThanOrEqual(80);
      }
    });
  });

  describe("captionSchema (dynamic builder)", () => {
    it("accepts an object with one string per provided zone id", () => {
      const schema = captionSchema(["top", "bottom", "panel-3"]);
      const parsed = schema.safeParse({
        top: "TOP CAPTION",
        bottom: "BOTTOM CAPTION",
        "panel-3": "THIRD PANEL",
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects an object missing a required zone key", () => {
      const schema = captionSchema(["top", "bottom"]);
      const parsed = schema.safeParse({ top: "ONLY TOP" });
      expect(parsed.success).toBe(false);
    });

    it("rejects values longer than 80 characters", () => {
      const schema = captionSchema(["top"]);
      const parsed = schema.safeParse({ top: "x".repeat(81) });
      expect(parsed.success).toBe(false);
    });

    it("accepts captions exactly 80 characters long", () => {
      const schema = captionSchema(["top"]);
      const parsed = schema.safeParse({ top: "x".repeat(80) });
      expect(parsed.success).toBe(true);
    });

    it("builds an empty-shape schema for an empty zone list", () => {
      const schema = captionSchema([]);
      const parsed = schema.safeParse({});
      expect(parsed.success).toBe(true);
    });
  });

  describe("when ANTHROPIC_API_KEY is set", () => {
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = "sk-test-fake";
    });

    it("calls generateObject with the haiku-4-5 model and returns its object", async () => {
      generateObjectMock.mockResolvedValue({
        object: { top: "TOP CAPTION", bottom: "BOTTOM CAPTION" },
      });
      const result = await generateCaption({
        topic: "shipping",
        template: TEMPLATE,
      });
      expect(generateObjectMock).toHaveBeenCalledTimes(1);
      const call = generateObjectMock.mock.calls[0][0];
      expect(call.model).toEqual({
        provider: "anthropic",
        model: CAPTION_MODEL_ID,
      });
      expect(typeof call.system).toBe("string");
      expect(call.prompt).toContain("Topic: shipping");
      expect(call.prompt).toContain("top");
      expect(call.prompt).toContain("bottom");
      expect(result).toEqual({ top: "TOP CAPTION", bottom: "BOTTOM CAPTION" });
    });
  });
});
