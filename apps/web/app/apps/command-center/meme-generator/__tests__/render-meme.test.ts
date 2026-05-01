import { describe, it, expect } from "vitest";
import {
  renderMeme,
  wrapTextToWidth,
  type CanvasContextLike,
} from "../lib/render-meme";
import type { MemeTemplate } from "../lib/types";

interface CallRecord {
  method: string;
  args: readonly unknown[];
}

function fakeContext(measureWidth: (text: string) => number): {
  ctx: CanvasContextLike;
  calls: CallRecord[];
  state: Record<string, unknown>;
} {
  const calls: CallRecord[] = [];
  const state: Record<string, unknown> = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineJoin: "miter",
    globalAlpha: 1,
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
  };
  const record = (method: string, ...args: unknown[]) => {
    calls.push({ method, args });
  };
  const ctx: CanvasContextLike = {
    get fillStyle() {
      return state.fillStyle as string;
    },
    set fillStyle(v) {
      state.fillStyle = v;
      record("set:fillStyle", v);
    },
    get strokeStyle() {
      return state.strokeStyle as string;
    },
    set strokeStyle(v) {
      state.strokeStyle = v;
      record("set:strokeStyle", v);
    },
    get lineWidth() {
      return state.lineWidth as number;
    },
    set lineWidth(v) {
      state.lineWidth = v;
      record("set:lineWidth", v);
    },
    get lineJoin() {
      return state.lineJoin as CanvasLineJoin;
    },
    set lineJoin(v) {
      state.lineJoin = v;
      record("set:lineJoin", v);
    },
    get globalAlpha() {
      return state.globalAlpha as number;
    },
    set globalAlpha(v) {
      state.globalAlpha = v;
      record("set:globalAlpha", v);
    },
    get font() {
      return state.font as string;
    },
    set font(v) {
      state.font = v;
      record("set:font", v);
    },
    get textAlign() {
      return state.textAlign as CanvasTextAlign;
    },
    set textAlign(v) {
      state.textAlign = v;
      record("set:textAlign", v);
    },
    get textBaseline() {
      return state.textBaseline as CanvasTextBaseline;
    },
    set textBaseline(v) {
      state.textBaseline = v;
      record("set:textBaseline", v);
    },
    fillRect: (x, y, w, h) => record("fillRect", x, y, w, h),
    beginPath: () => record("beginPath"),
    moveTo: (x, y) => record("moveTo", x, y),
    lineTo: (x, y) => record("lineTo", x, y),
    stroke: () => record("stroke"),
    fillText: (text, x, y) => record("fillText", text, x, y),
    strokeText: (text, x, y) => record("strokeText", text, x, y),
    measureText: (text) => ({ width: measureWidth(text) }),
    drawImage: (img, dx, dy, dw, dh) =>
      record("drawImage", img, dx, dy, dw, dh),
  };
  return { ctx, calls, state };
}

const W = 600;
const H = 450;

const LEGACY_ZONES = [
  {
    id: "top",
    label: "Top text",
    x: 20,
    y: 20,
    width: 560,
    height: 90,
    align: "center" as const,
    vAlign: "top" as const,
    uppercase: true,
    defaultText: "WHEN YOU FINALLY",
  },
  {
    id: "bottom",
    label: "Bottom text",
    x: 20,
    y: 20,
    width: 560,
    height: H - 40,
    align: "center" as const,
    vAlign: "bottom" as const,
    uppercase: true,
    defaultText: "SHIP THE FEATURE",
  },
];

const COLOR_SCHEMES: Array<
  Pick<MemeTemplate, "id" | "backgroundColor" | "defaultTextColor"> & {
    legacyEmoji: string;
    expectedGridStroke: string;
  }
> = [
  {
    id: "dark",
    backgroundColor: "#0d0d0d",
    defaultTextColor: "#ffffff",
    legacyEmoji: "🌑",
    expectedGridStroke: "#ffffff12",
  },
  {
    id: "matrix",
    backgroundColor: "#001a00",
    defaultTextColor: "#00ff41",
    legacyEmoji: "🟢",
    expectedGridStroke: "#00ff4112",
  },
  {
    id: "vaporwave",
    backgroundColor: "#1a0533",
    defaultTextColor: "#ff71ce",
    legacyEmoji: "🌸",
    expectedGridStroke: "#ff71ce12",
  },
  {
    id: "fire",
    backgroundColor: "#1a0a00",
    defaultTextColor: "#ff6b35",
    legacyEmoji: "🔥",
    expectedGridStroke: "#ff6b3512",
  },
  {
    id: "ice",
    backgroundColor: "#001a2e",
    defaultTextColor: "#7dd8ff",
    legacyEmoji: "❄️",
    expectedGridStroke: "#7dd8ff12",
  },
  {
    id: "classic",
    backgroundColor: "#ffffff",
    defaultTextColor: "#000000",
    legacyEmoji: "😂",
    expectedGridStroke: "#00000012",
  },
];

function buildTemplate(
  scheme: (typeof COLOR_SCHEMES)[number],
): MemeTemplate {
  return {
    id: scheme.id,
    name: scheme.id,
    imageWidth: W,
    imageHeight: H,
    backgroundColor: scheme.backgroundColor,
    defaultTextColor: scheme.defaultTextColor,
    legacyEmoji: scheme.legacyEmoji,
    textZones: LEGACY_ZONES,
  };
}

describe("wrapTextToWidth", () => {
  it("splits at the word boundary that exceeds maxWidth", () => {
    // Each character measures 10px wide.
    const ctx = {
      font: "",
      measureText: (t: string) => ({ width: t.length * 10 }),
    };
    const lines = wrapTextToWidth(ctx, "AAA BB CCCC DD", 50, 48);
    // "AAA" (30) → ok; "AAA BB" (60) → overflow → push "AAA"; "BB" (20) ok;
    // "BB CCCC" (70) → overflow → push "BB"; "CCCC" (40) ok;
    // "CCCC DD" (70) → overflow → push "CCCC"; "DD" (20) ok → push "DD".
    expect(lines).toEqual(["AAA", "BB", "CCCC", "DD"]);
  });

  it("keeps a single word that exceeds maxWidth as one line", () => {
    const ctx = {
      font: "",
      measureText: (t: string) => ({ width: t.length * 100 }),
    };
    expect(wrapTextToWidth(ctx, "supercalifragilistic", 200, 48)).toEqual([
      "supercalifragilistic",
    ]);
  });

  it("returns [] for whitespace-only text", () => {
    const ctx = { font: "", measureText: () => ({ width: 0 }) };
    expect(wrapTextToWidth(ctx, "   ", 100, 48)).toEqual([]);
  });

  it("restores ctx.font afterwards", () => {
    const state = { font: "10px serif" };
    const ctx = {
      get font() {
        return state.font;
      },
      set font(v: string) {
        state.font = v;
      },
      measureText: () => ({ width: 0 }),
    };
    wrapTextToWidth(ctx, "hi", 100, 48);
    expect(state.font).toBe("10px serif");
  });
});

describe("renderMeme — legacy color schemes", () => {
  for (const scheme of COLOR_SCHEMES) {
    it(`renders the ${scheme.id} scheme with bg, grid, emoji, and both zones`, () => {
      const template = buildTemplate(scheme);
      const { ctx, calls } = fakeContext(() => 100);

      renderMeme(ctx, {
        template,
        zoneText: { top: "WHEN YOU FINALLY", bottom: "SHIP THE FEATURE" },
        fontSize: 48,
      });

      // 1. Background fill.
      const bgFill = calls.find(
        (c) =>
          c.method === "fillRect" &&
          c.args[0] === 0 &&
          c.args[1] === 0 &&
          c.args[2] === W &&
          c.args[3] === H,
      );
      expect(bgFill).toBeDefined();

      // 2. Grid stroke colour applied — defaultTextColor + "12" alpha.
      const gridStroke = calls.find(
        (c) =>
          c.method === "set:strokeStyle" &&
          c.args[0] === scheme.expectedGridStroke,
      );
      expect(gridStroke).toBeDefined();

      // 3. Center emoji drawn at (W/2, H/2) at 0.15 alpha.
      const emojiCall = calls.find(
        (c) =>
          c.method === "fillText" &&
          c.args[0] === scheme.legacyEmoji &&
          c.args[1] === W / 2 &&
          c.args[2] === H / 2,
      );
      expect(emojiCall).toBeDefined();

      // 4. Top text drawn at y=20 (vAlign=top).
      const topFill = calls.find(
        (c) =>
          c.method === "fillText" &&
          c.args[0] === "WHEN YOU FINALLY" &&
          c.args[1] === W / 2 &&
          c.args[2] === 20,
      );
      expect(topFill).toBeDefined();

      // 5. Bottom text drawn at y = (zone.y + zone.height) - lineH * lines.
      // With single line at fontSize=48 → lineH=57.6; zone y=20, height=410.
      // startY = 20 + 410 - 57.6 = 372.4.
      const bottomFill = calls.find(
        (c) =>
          c.method === "fillText" &&
          c.args[0] === "SHIP THE FEATURE" &&
          c.args[1] === W / 2 &&
          typeof c.args[2] === "number" &&
          Math.abs((c.args[2] as number) - 372.4) < 0.001,
      );
      expect(bottomFill).toBeDefined();

      // 6. Stroke colour for text outline is black.
      const blackStroke = calls.filter(
        (c) => c.method === "set:strokeStyle" && c.args[0] === "#000000",
      );
      expect(blackStroke.length).toBeGreaterThanOrEqual(2); // top + bottom

      // 7. Fill colour for text matches defaultTextColor.
      const textFill = calls.filter(
        (c) =>
          c.method === "set:fillStyle" && c.args[0] === scheme.defaultTextColor,
      );
      expect(textFill.length).toBeGreaterThanOrEqual(2);
    });
  }

  it("skips zones whose text is empty / whitespace-only", () => {
    const template = buildTemplate(COLOR_SCHEMES[0]);
    const { ctx, calls } = fakeContext(() => 100);

    renderMeme(ctx, {
      template,
      zoneText: { top: "", bottom: "   " },
      fontSize: 48,
    });

    const drewText = calls.find(
      (c) =>
        c.method === "fillText" &&
        c.args[0] !== template.legacyEmoji,
    );
    expect(drewText).toBeUndefined();
  });

  it("uppercases zone text when zone.uppercase = true", () => {
    const template = buildTemplate(COLOR_SCHEMES[0]);
    const { ctx, calls } = fakeContext(() => 100);

    renderMeme(ctx, {
      template,
      zoneText: { top: "lower case", bottom: "" },
      fontSize: 48,
    });

    const upper = calls.find(
      (c) => c.method === "fillText" && c.args[0] === "LOWER CASE",
    );
    expect(upper).toBeDefined();
  });

  it("respects zone.fontSize and zone.color overrides", () => {
    const template: MemeTemplate = {
      ...buildTemplate(COLOR_SCHEMES[0]),
      textZones: [
        {
          id: "top",
          label: "Top",
          x: 0,
          y: 0,
          width: 600,
          height: 100,
          align: "center",
          fontSize: 24,
          color: "#abcdef",
          uppercase: false,
        },
      ],
    };
    const { ctx, calls } = fakeContext(() => 50);

    renderMeme(ctx, {
      template,
      zoneText: { top: "hi" },
      fontSize: 48,
    });

    const fontSet = calls.find(
      (c) => c.method === "set:font" && /24px Impact/.test(String(c.args[0])),
    );
    expect(fontSet).toBeDefined();

    const colorFill = calls.find(
      (c) => c.method === "set:fillStyle" && c.args[0] === "#abcdef",
    );
    expect(colorFill).toBeDefined();

    const lineWidth = calls.find(
      (c) => c.method === "set:lineWidth" && c.args[0] === 24 / 8,
    );
    expect(lineWidth).toBeDefined();
  });
});

describe("renderMeme — image templates", () => {
  it("draws the image first then text zones on top, no grid/emoji", () => {
    const template: MemeTemplate = {
      id: "imgflip-1",
      name: "imgflip-1",
      imagePath: "templates/x.png",
      imageWidth: W,
      imageHeight: H,
      defaultTextColor: "#ffffff",
      textZones: [
        {
          id: "caption",
          label: "Caption",
          x: 50,
          y: 50,
          width: 500,
          height: 100,
          align: "center",
        },
      ],
    };
    const fakeImage = { __img: true } as unknown as CanvasImageSource;
    const { ctx, calls } = fakeContext(() => 30);

    renderMeme(ctx, {
      template,
      zoneText: { caption: "hi there" },
      fontSize: 36,
      image: fakeImage,
    });

    const drawImageIdx = calls.findIndex((c) => c.method === "drawImage");
    expect(drawImageIdx).toBeGreaterThanOrEqual(0);
    expect(calls[drawImageIdx].args).toEqual([fakeImage, 0, 0, W, H]);

    const fillTextIdx = calls.findIndex(
      (c) => c.method === "fillText" && c.args[0] === "hi there",
    );
    expect(fillTextIdx).toBeGreaterThan(drawImageIdx);

    // No grid (moveTo) or background fillRect for image templates.
    const drewGrid = calls.find((c) => c.method === "moveTo");
    expect(drewGrid).toBeUndefined();
    const drewBg = calls.find(
      (c) => c.method === "fillRect" && c.args[0] === 0 && c.args[1] === 0,
    );
    expect(drewBg).toBeUndefined();
  });
});
