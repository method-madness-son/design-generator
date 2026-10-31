import type { TeePlacementSize } from '@/types/tee';

/**
 * Front print canvas for a DTG tee.
 *
 * Pixel size is Printify's knowledge-hub full-chest canvas (15 × 18 in at 300 DPI).
 * The help center says the real maximum differs by print provider and is shown in
 * the Product Creator Upload panel. This module does not claim a measured
 * Bella+Canvas 3001 or Comfort Colors 1717 pallet. See docs/TEE-PIPELINE.md.
 */
export const PRINT_DPI = 300;

export const TEE_PRINT_AREA = {
  id: 'front-15x18',
  widthIn: 15,
  heightIn: 18,
} as const;

/**
 * Design box inside the print canvas.
 * Offsets are from the center of the print area, in inches.
 * Positive X is the wearer's left (the right side of a front-facing image).
 * Positive Y is down. These offsets are not from a Product Creator template.
 */
export const TEE_PLACEMENTS: Record<
  TeePlacementSize,
  { label: string; widthIn: number; heightIn: number; offsetXIn: number; offsetYIn: number }
> = {
  'full-front': { label: 'Full front', widthIn: 12, heightIn: 14, offsetXIn: 0, offsetYIn: 0 },
  'left-chest': { label: 'Left chest', widthIn: 4, heightIn: 4, offsetXIn: 3.25, offsetYIn: -5 },
};

export function printAreaPx() {
  return {
    widthPx: TEE_PRINT_AREA.widthIn * PRINT_DPI,
    heightPx: TEE_PRINT_AREA.heightIn * PRINT_DPI,
  };
}

export function designBoxInches(size: TeePlacementSize) {
  const spec = TEE_PLACEMENTS[size];
  const cx = TEE_PRINT_AREA.widthIn / 2 + spec.offsetXIn;
  const cy = TEE_PRINT_AREA.heightIn / 2 + spec.offsetYIn;
  return {
    xIn: cx - spec.widthIn / 2,
    yIn: cy - spec.heightIn / 2,
    widthIn: spec.widthIn,
    heightIn: spec.heightIn,
  };
}

export function designBoxPx(size: TeePlacementSize) {
  const area = printAreaPx();
  const box = designBoxInches(size);
  return {
    widthPx: area.widthPx,
    heightPx: area.heightPx,
    x: Math.round(box.xIn * PRINT_DPI),
    y: Math.round(box.yIn * PRINT_DPI),
    width: Math.round(box.widthIn * PRINT_DPI),
    height: Math.round(box.heightIn * PRINT_DPI),
    widthIn: box.widthIn,
    heightIn: box.heightIn,
  };
}

export function designBoxInsidePrintArea(size: TeePlacementSize): boolean {
  const box = designBoxInches(size);
  const right = box.xIn + box.widthIn;
  const bottom = box.yIn + box.heightIn;
  return box.xIn >= 0 && box.yIn >= 0 && right <= TEE_PRINT_AREA.widthIn && bottom <= TEE_PRINT_AREA.heightIn;
}

/**
 * Flat front tee drawing. Proportions are illustrative (about a size L torso),
 * not a graded Bella+Canvas or Comfort Colors pattern.
 * The print-area rect uses the same inch placement as the print file.
 */
export const WIREFRAME = {
  viewWidth: 680,
  viewHeight: 820,
  pxPerIn: 18,
  centerX: 340,
  // Lowest point of the shallow crew scoop in TeeWireframe (quadratic at t=0.5).
  necklineBottom: 174,
  gapBelowNeckIn: 1.25,
};

export function wireframePrintRect() {
  const width = TEE_PRINT_AREA.widthIn * WIREFRAME.pxPerIn;
  const height = TEE_PRINT_AREA.heightIn * WIREFRAME.pxPerIn;
  return {
    x: WIREFRAME.centerX - width / 2,
    y: WIREFRAME.necklineBottom + WIREFRAME.gapBelowNeckIn * WIREFRAME.pxPerIn,
    width,
    height,
  };
}

export function wireframeDesignRect(size: TeePlacementSize) {
  const area = wireframePrintRect();
  const spec = TEE_PLACEMENTS[size];
  const width = spec.widthIn * WIREFRAME.pxPerIn;
  const height = spec.heightIn * WIREFRAME.pxPerIn;
  const cx = area.x + area.width / 2 + spec.offsetXIn * WIREFRAME.pxPerIn;
  const cy = area.y + area.height / 2 + spec.offsetYIn * WIREFRAME.pxPerIn;
  return { x: cx - width / 2, y: cy - height / 2, width, height };
}
