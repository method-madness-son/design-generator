import { MUG_CANVASES, MUG_HANDLE_GUTTER_IN, MUG_SAFE_INSET_IN, inchesToPx } from "@/lib/mugSizes";
import type { MugLine, MugSizeId, MugWrapLayout } from "@/types/mug";

export type Rect = { x: number; y: number; width: number; height: number };

export type SlotPlan = Rect & {
  displayPx: number;
  supportingPx: number;
  graphicPx: number;
};

const DISPLAY_CAP = 260;
const SUPPORT_CAP = 150;
const DISPLAY_FLOOR = 96;
const SUPPORT_FLOOR = 56;

const MONO = new Set(["JetBrains Mono", "Fira Code", "Space Mono", "IBM Plex Mono", "Press Start 2P"]);

export function fontAdvance(family: string): number {
  if (MONO.has(family)) return 0.62;
  if (family === "Caprasimo" || family === "Titan One" || family === "Alfa Slab One" || family === "Shrikhand") return 0.72;
  if (family === "Permanent Marker" || family === "Caveat" || family === "Pacifico") return 0.58;
  if (family === "Work Sans" || family === "Oswald") return 0.52;
  if (family === "Bebas Neue" || family === "Anton") return 0.48;
  return 0.64;
}

export function safeRect(size: MugSizeId): Rect {
  const canvas = MUG_CANVASES[size];
  const x = inchesToPx(MUG_HANDLE_GUTTER_IN);
  const y = inchesToPx(MUG_SAFE_INSET_IN);
  return { x, y, width: canvas.widthPx - x * 2, height: canvas.heightPx - y * 2 };
}

export function rectInside(inner: Rect, outer: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function lineWidthPx(text: string, fontPx: number, advance: number): number {
  return [...text].length * fontPx * advance;
}

function fitFontPx(text: string, slotWidth: number, advance: number, cap: number, floor: number): number {
  const letters = Math.max([...text].length, 1);
  const fitted = Math.floor((slotWidth - 16) / (letters * advance));
  return Math.max(floor, Math.min(cap, fitted));
}

function slotRects(wrap: MugWrapLayout, safe: Rect): Rect[] {
  if (wrap === "full-wrap") {
    const width = Math.round(safe.width * 0.4);
    return [
      { x: safe.x, y: safe.y, width, height: safe.height },
      { x: safe.x + safe.width - width, y: safe.y, width, height: safe.height },
    ];
  }
  if (wrap === "drinker-left" || wrap === "drinker-right") {
    const width = Math.round(safe.width * 0.36);
    const x = wrap === "drinker-left" ? safe.x : safe.x + safe.width - width;
    return [{ x, y: safe.y, width, height: safe.height }];
  }
  // About the face opposite the handle, not the full safe width, so the phrase
  // is readable from the front instead of running around the sides.
  const width = Math.round(safe.width * 0.42);
  const x = safe.x + Math.round((safe.width - width) / 2);
  return [{ x, y: safe.y, width, height: safe.height }];
}

export function planSlots(input: {
  wrap: MugWrapLayout;
  size: MugSizeId;
  lines: MugLine[];
  displayFont: string;
  supportingFont: string;
  hasGraphic: boolean;
}): SlotPlan[] {
  const displayLine = input.lines.find((line) => line.font === "display")?.text ?? input.lines[0]?.text ?? "";
  const supportLine = input.lines
    .filter((line) => line.font === "supporting")
    .reduce((longest, line) => (line.text.length > longest.length ? line.text : longest), "");
  return slotRects(input.wrap, safeRect(input.size)).map((rect) => ({
    ...rect,
    displayPx: fitFontPx(displayLine, rect.width, fontAdvance(input.displayFont), DISPLAY_CAP, DISPLAY_FLOOR),
    supportingPx: supportLine
      ? fitFontPx(supportLine, rect.width, fontAdvance(input.supportingFont), SUPPORT_CAP, SUPPORT_FLOOR)
      : 0,
    graphicPx: input.hasGraphic ? Math.min(96, Math.round(rect.height * 0.18)) : 0,
  }));
}

export function slotProblems(lines: MugLine[], slot: SlotPlan, displayFont: string, supportingFont: string): string[] {
  const problems: string[] = [];
  for (const line of lines) {
    const px = line.font === "display" ? slot.displayPx : slot.supportingPx;
    const advance = fontAdvance(line.font === "display" ? displayFont : supportingFont);
    if (lineWidthPx(line.text, px, advance) > slot.width - 8) {
      problems.push(`"${line.text}" is wider than its slot at ${px}px`);
    }
  }
  const block = slot.graphicPx + slot.displayPx + slot.supportingPx + 24;
  if (block > slot.height) problems.push(`type block is ${block}px tall and the slot is ${slot.height}px`);
  return problems;
}
