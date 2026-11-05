/**
 * Wrapping paper print area confirmed from the Printify catalog API:
 *
 *   Blueprint 1367 "Wrapping Papers", provider 99 "Printify Choice"
 *   All 6 variants (3 sizes × 2 finishes) share one print area: 9075 × 10800 px, position "front".
 *
 * Printify tiles the uploaded image across the roll. You upload one 9075×10800 PNG and it repeats
 * to fill 30×36, 30×72, or 30×180 rolls. 9075 / 30.25 = 300, 10800 / 36 = 300, so the tile is
 * 30.25″ × 36″ at 300 DPI. The extra 0.25″ width is likely bleed.
 */

export const WRAP_TILE_WIDTH_PX = 9075;
export const WRAP_TILE_HEIGHT_PX = 10800;
export const WRAP_DPI = 300;
export const WRAP_PNG_LIMIT_BYTES = 100 * 1024 * 1024;
export const WRAP_PIXELS_PER_METER = Math.round(WRAP_DPI / 0.0254);

export type WrapSizeId = '30x36' | '30x72' | '30x180';

export const WRAP_SIZES: Record<WrapSizeId, { label: string; widthIn: number; heightIn: number }> = {
  '30x36': { label: '30″ × 36″ sheet', widthIn: 30, heightIn: 36 },
  '30x72': { label: '30″ × 72″ roll', widthIn: 30, heightIn: 72 },
  '30x180': { label: '30″ × 180″ roll', widthIn: 30, heightIn: 180 },
};

export const WRAP_SIZE_IDS = Object.keys(WRAP_SIZES) as WrapSizeId[];

export function isWrapSize(value: string): value is WrapSizeId {
  return value in WRAP_SIZES;
}
