import type { MugSizeId } from "@/types/mug";

export const MUG_DPI = 300;

/** JPEG/PNG limit from https://help.printify.com/hc/en-us/articles/4483617936657-What-type-of-print-files-does-Printify-require */
export const MUG_PNG_LIMIT_BYTES = 100 * 1024 * 1024;

export const MUG_PIXELS_PER_METER = Math.round(MUG_DPI / 0.0254);

/**
 * Top and bottom inset. Printify says sublimation position can vary by up to 0.5 in.
 * https://help.printify.com/hc/en-us/articles/4483626015889-What-are-safe-areas-and-bleeds
 * This is that published variation used as an inset, not a mug-template measurement.
 */
export const MUG_SAFE_INSET_IN = 0.5;

/**
 * UNVERIFIED. Printify does not publish a handle-seam inset.
 * Both ends of the single wrap file meet the handle, so type stays this far in from each end.
 */
export const MUG_HANDLE_GUTTER_IN = 0.5;

/** UNVERIFIED blank. White ceramic is treated as pure white. Printify does not publish a blank hex. */
export const CERAMIC_WHITE_HEX = "#FFFFFF";

export type MugCanvas = {
  id: MugSizeId;
  label: string;
  widthPx: number;
  heightPx: number;
  verified: boolean;
  sourceUrl: string;
  sourceNote: string;
};

export const MUG_CANVASES: Record<MugSizeId, MugCanvas> = {
  "11oz": {
    id: "11oz",
    label: "11 oz",
    widthPx: 2475,
    heightPx: 1155,
    verified: true,
    sourceUrl: "https://printify.com/knowledge-hub/how-to-design-and-sell-pod-mugs/",
    sourceNote:
      "Printify knowledge hub, fetched 2026-10-31: design a standard 11 oz canvas at 2475 × 1155 pixels. 8.25 × 3.85 in is that size divided by 300. The page does not print the inch size.",
  },
  "15oz": {
    id: "15oz",
    label: "15 oz",
    widthPx: 2475,
    heightPx: 1275,
    verified: false,
    sourceUrl: "https://www.podmadeeasy.com/blog/mug-design-size",
    sourceNote:
      "UNVERIFIED against printify.com. No Printify page fetched on 2026-10-31 states a 15 oz pixel size. 2475 × 1275 is a third-party claim (8.25 × 4.25 in at 300 DPI). Do not upload it until Product Creator confirms the size.",
  },
};

export function isMugSize(value: string): value is MugSizeId {
  return value === "11oz" || value === "15oz";
}

export function inchesToPx(inches: number): number {
  return Math.round(inches * MUG_DPI);
}

export function assertMugCanvases(): string[] {
  const errors: string[] = [];
  const eleven = MUG_CANVASES["11oz"];
  if (eleven.widthPx !== 2475 || eleven.heightPx !== 1155 || !eleven.verified) {
    errors.push("11 oz canvas must stay 2475×1155 and verified.");
  }
  if (MUG_CANVASES["15oz"].verified) {
    errors.push("15 oz is still unverified. Flip this only after Product Creator confirms the pixels.");
  }
  if (eleven.widthPx / MUG_DPI !== 8.25 || eleven.heightPx / MUG_DPI !== 3.85) {
    errors.push("11 oz pixel size is no longer 8.25 × 3.85 in at 300 DPI.");
  }
  return errors;
}
