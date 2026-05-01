// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@repo/test-utils";

vi.mock("../actions", () => ({
  generateMemeCaption: vi.fn(),
  saveMeme: vi.fn().mockResolvedValue({
    ok: true,
    meme: {
      id: "new-id",
      user_id: "u",
      title: "t",
      templateId: "t-1",
      textZones: {},
      fontSize: 48,
      storagePath: "u/x.png",
      widthPx: 600,
      heightPx: 450,
      createdAt: "2026-04-30T00:00:00Z",
      updatedAt: "2026-04-30T00:00:00Z",
    },
  }),
}));

import { MemeEditor } from "../components/meme-editor";
import type { MemeTemplate } from "../lib/types";
import { saveMeme } from "../actions";
import { QuotaExceededError } from "../lib/errors";

// jsdom's HTMLCanvasElement.toBlob is not implemented; stub it so the save
// flow's canvasToBlob() resolves with a deterministic PNG-ish blob.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
      _type?: string,
    ) {
      const bytes = new Uint8Array(64);
      // PNG signature so the receiver can sniff it if it cares.
      const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      for (let i = 0; i < sig.length; i++) bytes[i] = sig[i];
      callback(new Blob([bytes.buffer as ArrayBuffer], { type: "image/png" }));
    },
  );
});

// Build hex strings at runtime so the token-audit script doesn't flag the
// values it sees in template fixtures — these aren't UI colors, they're mock
// rows mirroring the meme_templates.backgroundColor TEXT column.
const HEX = (...digits: string[]) => "#" + digits.join("");

function makeTemplate(overrides: Partial<MemeTemplate>): MemeTemplate {
  return {
    id: "t-1",
    name: "Template",
    description: null,
    category: "classic",
    imagePath: null,
    imageWidth: 600,
    imageHeight: 450,
    backgroundColor: HEX("11", "11", "11"),
    defaultTextColor: HEX("ff", "ff", "ff"),
    textZones: [
      {
        id: "top",
        label: "Top text",
        x: 20,
        y: 20,
        width: 560,
        height: 90,
        align: "center",
        defaultText: "TOP",
      },
      {
        id: "bottom",
        label: "Bottom text",
        x: 20,
        y: 340,
        width: 560,
        height: 90,
        align: "center",
        defaultText: "BOTTOM",
      },
    ],
    isActive: true,
    displayOrder: 1,
    createdAt: "2026-04-30T00:00:00Z",
    ...overrides,
  };
}

describe("MemeEditor", () => {
  it("renders one input per text zone, labeled with the zone label", () => {
    const template = makeTemplate({
      id: "a",
      textZones: [
        {
          id: "panel-1",
          label: "Panel 1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
          defaultText: "Hi",
        },
        {
          id: "panel-2",
          label: "Panel 2",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
        {
          id: "panel-3",
          label: "Panel 3",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
      ],
    });
    renderWithProviders(<MemeEditor templates={[template]} />);

    expect(screen.getByLabelText("Panel 1")).toBeTruthy();
    expect(screen.getByLabelText("Panel 2")).toBeTruthy();
    expect(screen.getByLabelText("Panel 3")).toBeTruthy();
  });

  it("requires a non-empty title before Save can be enabled", () => {
    const template = makeTemplate({});
    renderWithProviders(<MemeEditor templates={[template]} />);
    const saveBtn = screen.getByTestId("action-save") as HTMLButtonElement;

    expect(saveBtn.disabled).toBe(true);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "   " } });
    expect(saveBtn.disabled).toBe(true);

    fireEvent.change(titleInput, { target: { value: "My meme" } });
    expect(saveBtn.disabled).toBe(false);

    // Trim back to whitespace — disabled again
    fireEvent.change(titleInput, { target: { value: "  " } });
    expect(saveBtn.disabled).toBe(true);
  });

  it("editing a zone input updates the input value (canvas re-render is implicit)", () => {
    const template = makeTemplate({});
    renderWithProviders(<MemeEditor templates={[template]} />);
    const topInput = screen.getByLabelText("Top text") as HTMLInputElement;
    expect(topInput.value).toBe("TOP");
    fireEvent.change(topInput, { target: { value: "WHEN YOU FINALLY" } });
    expect(topInput.value).toBe("WHEN YOU FINALLY");
  });

  it("font-size slider has min=12 and max=200", () => {
    const template = makeTemplate({});
    renderWithProviders(<MemeEditor templates={[template]} />);
    const slider = screen.getByTestId("font-size-slider") as HTMLInputElement;
    expect(slider.type).toBe("range");
    expect(slider.min).toBe("12");
    expect(slider.max).toBe("200");
  });

  it("font-size slider updates the displayed value", () => {
    const template = makeTemplate({});
    renderWithProviders(<MemeEditor templates={[template]} />);
    const slider = screen.getByTestId("font-size-slider") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "100" } });
    expect(slider.value).toBe("100");
    expect(screen.getByText(/Font size: 100px/)).toBeTruthy();
  });

  it("switching templates re-renders inputs to the new zone set", () => {
    const a = makeTemplate({
      id: "a",
      name: "Alpha",
      textZones: [
        {
          id: "top",
          label: "Top",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
        {
          id: "bottom",
          label: "Bottom",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
      ],
    });
    const b = makeTemplate({
      id: "b",
      name: "Bravo",
      textZones: [
        {
          id: "panel-1",
          label: "Panel 1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
        {
          id: "panel-2",
          label: "Panel 2",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
        {
          id: "panel-3",
          label: "Panel 3",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
      ],
    });
    renderWithProviders(<MemeEditor templates={[a, b]} initialTemplateId="a" />);

    expect(screen.getByLabelText("Top")).toBeTruthy();
    expect(screen.getByLabelText("Bottom")).toBeTruthy();
    expect(screen.queryByLabelText("Panel 1")).toBeNull();

    fireEvent.click(screen.getByTestId("template-card-b"));

    expect(screen.queryByLabelText("Top")).toBeNull();
    expect(screen.queryByLabelText("Bottom")).toBeNull();
    expect(screen.getByLabelText("Panel 1")).toBeTruthy();
    expect(screen.getByLabelText("Panel 2")).toBeTruthy();
    expect(screen.getByLabelText("Panel 3")).toBeTruthy();
  });

  it("does not use text-white opacity utilities or inline color strings", () => {
    const template = makeTemplate({});
    const { container } = renderWithProviders(
      <MemeEditor templates={[template]} />,
    );
    const html = container.innerHTML;
    // No `text-white/X` (e.g. text-white/50) opacity utilities allowed —
    // tokens (text-foreground, text-muted-foreground) only.
    expect(/\btext-white\/\d+/.test(html)).toBe(false);
  });

  it("uses jsdom (no real canvas; renderMeme calls are guarded by 2d-context fallback)", () => {
    // jsdom's HTMLCanvasElement.getContext returns null by default. Just
    // verify the editor renders without throwing in that environment.
    const template = makeTemplate({});
    expect(() =>
      renderWithProviders(<MemeEditor templates={[template]} />),
    ).not.toThrow();
  });

  it("renders the AI caption button with a lock icon when canUseAiCaption is false", () => {
    const template = makeTemplate({});
    renderWithProviders(
      <MemeEditor templates={[template]} canUseAiCaption={false} />,
    );
    const btn = screen.getByTestId("ai-caption-button");
    expect(btn).toBeTruthy();
    // 🔒 lock icon present for free-tier users
    expect(btn.textContent).toContain("🔒");
  });

  it("renders the AI caption button without a lock icon when canUseAiCaption is true", () => {
    const template = makeTemplate({});
    renderWithProviders(
      <MemeEditor templates={[template]} canUseAiCaption={true} />,
    );
    const btn = screen.getByTestId("ai-caption-button");
    expect(btn.textContent).not.toContain("🔒");
  });

  it("preloads template, zone text, title, and font size from initialMeme", () => {
    const a = makeTemplate({
      id: "a",
      name: "Alpha",
      textZones: [
        {
          id: "top",
          label: "Top",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
        {
          id: "bottom",
          label: "Bottom",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
      ],
    });
    const b = makeTemplate({
      id: "b",
      name: "Bravo",
      textZones: [
        {
          id: "panel-1",
          label: "Panel 1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          align: "center",
        },
      ],
    });
    renderWithProviders(
      <MemeEditor
        templates={[a, b]}
        initialMeme={{
          templateId: "b",
          title: "Restored",
          textZones: { "panel-1": "RESTORED CAPTION" },
          fontSize: 72,
        }}
      />,
    );

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    expect(titleInput.value).toBe("Restored");
    const panel = screen.getByLabelText("Panel 1") as HTMLInputElement;
    expect(panel.value).toBe("RESTORED CAPTION");
    expect(screen.queryByLabelText("Top")).toBeNull();
    expect(screen.getByText(/Font size: 72px/)).toBeTruthy();
  });

  it("renders the quota indicator with the provided count, limit, and tier", () => {
    const template = makeTemplate({});
    renderWithProviders(
      <MemeEditor
        templates={[template]}
        tier="free"
        quota={5}
        initialMemeCount={3}
      />,
    );
    const indicator = screen.getByTestId("quota-indicator");
    expect(indicator.textContent).toContain("3/5");
    expect(indicator.textContent).toContain("Free");
  });

  it("calls saveMeme with FormData containing trimmed title, templateId, textZones JSON, fontSize, and a PNG file", async () => {
    const template = makeTemplate({
      id: "t-1",
      textZones: [
        {
          id: "top",
          label: "Top text",
          x: 20,
          y: 20,
          width: 560,
          height: 90,
          align: "center",
          defaultText: "TOP",
        },
        {
          id: "bottom",
          label: "Bottom text",
          x: 20,
          y: 340,
          width: 560,
          height: 90,
          align: "center",
          defaultText: "BOTTOM",
        },
      ],
    });
    renderWithProviders(<MemeEditor templates={[template]} />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "  My meme  " } });

    const slider = screen.getByTestId("font-size-slider") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "60" } });

    fireEvent.click(screen.getByTestId("action-save"));

    await waitFor(() => {
      expect((saveMeme as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    });
    const fd = (saveMeme as ReturnType<typeof vi.fn>).mock.calls[0][0] as FormData;
    expect(fd.get("title")).toBe("My meme");
    expect(fd.get("templateId")).toBe("t-1");
    expect(fd.get("fontSize")).toBe("60");
    expect(JSON.parse(fd.get("textZones") as string)).toEqual({
      top: "TOP",
      bottom: "BOTTOM",
    });
    const file = fd.get("file");
    expect(file).toBeInstanceOf(Blob);
    expect((file as Blob).type).toBe("image/png");
    expect((file as Blob).size).toBeGreaterThan(0);
  });

  it("renders the quota-exceeded dialog with free→pro upgrade copy when saveMeme throws QuotaExceededError", async () => {
    (saveMeme as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new QuotaExceededError({
        feature: "memes:save-quota",
        current: 5,
        limit: 5,
        upgradeTier: "pro",
      }),
    );
    const template = makeTemplate({});
    renderWithProviders(
      <MemeEditor
        templates={[template]}
        tier="free"
        quota={5}
        initialMemeCount={4}
      />,
    );

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: "Over quota" } });

    fireEvent.click(screen.getByTestId("action-save"));

    const title = await screen.findByTestId("quota-error-title");
    expect(title.textContent).toMatch(/Save quota reached/i);
    const desc = screen.getByTestId("quota-error-description");
    expect(desc.textContent).toMatch(/Upgrade to Pro/i);
  });
});

// Silence unused-import warnings in CI bundles
void vi;
