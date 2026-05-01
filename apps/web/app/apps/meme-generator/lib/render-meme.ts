import type { MemeTemplate, TextZone } from "./types";

const TEXT_OUTLINE_COLOR = "#000000";

// Minimal canvas-context surface the renderer needs. Lets us snapshot calls
// in unit tests without a real DOM canvas. Property types match the
// CanvasRenderingContext2D shape so the real DOM context assigns to it.
export interface CanvasContextLike {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  globalAlpha: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;

  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fillText(text: string, x: number, y: number): void;
  strokeText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  drawImage?: (
    img: CanvasImageSource,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => void;
}

export function wrapTextToWidth(
  ctx: Pick<CanvasContextLike, "measureText" | "font">,
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const fontBefore = ctx.font;
  ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
  const lines: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  ctx.font = fontBefore;
  return lines;
}

function alignToCanvasAlign(align: TextZone["align"]): CanvasTextAlign {
  if (align === "left") return "left";
  if (align === "right") return "right";
  return "center";
}

function alignedX(zone: TextZone): number {
  if (zone.align === "left") return zone.x;
  if (zone.align === "right") return zone.x + zone.width;
  return zone.x + zone.width / 2;
}

interface ZoneWithVAlign extends TextZone {
  vAlign?: "top" | "middle" | "bottom";
}

function startYForVAlign(zone: ZoneWithVAlign, totalHeight: number): number {
  const vAlign = zone.vAlign ?? "top";
  if (vAlign === "bottom") return zone.y + zone.height - totalHeight;
  if (vAlign === "middle")
    return zone.y + Math.max(0, (zone.height - totalHeight) / 2);
  return zone.y;
}

export interface RenderInput {
  template: MemeTemplate;
  zoneText: Record<string, string>;
  fontSize: number;
  /** Optional preloaded background image for image templates. */
  image?: CanvasImageSource;
}

export function renderMeme(
  ctx: CanvasContextLike,
  input: RenderInput,
): void {
  const { template, zoneText, fontSize, image } = input;
  const W = template.imageWidth;
  const H = template.imageHeight;

  if (image && template.imagePath) {
    ctx.drawImage?.(image, 0, 0, W, H);
  } else if (template.backgroundColor) {
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, W, H);
  }

  for (const zone of template.textZones) {
    const raw = zoneText[zone.id];
    if (typeof raw !== "string" || raw.trim() === "") continue;

    const text = zone.uppercase ? raw.toUpperCase() : raw;
    const effectiveFontSize = zone.fontSize ?? fontSize;
    const lines = wrapTextToWidth(ctx, text, zone.width, effectiveFontSize);
    if (lines.length === 0) continue;

    const lineH = effectiveFontSize * 1.2;
    const totalH = lines.length * lineH;
    const startY = startYForVAlign(zone, totalH);
    const drawX = alignedX(zone);
    const fillColor = zone.color ?? template.defaultTextColor;

    ctx.font = `900 ${effectiveFontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = alignToCanvasAlign(zone.align);
    ctx.textBaseline = "top";

    let lineY = startY;
    for (const line of lines) {
      ctx.strokeStyle = TEXT_OUTLINE_COLOR;
      ctx.lineWidth = effectiveFontSize / 8;
      ctx.lineJoin = "round";
      ctx.strokeText(line, drawX, lineY);
      ctx.fillStyle = fillColor;
      ctx.fillText(line, drawX, lineY);
      lineY += lineH;
    }
  }
}
