import type { BookPaper, TrimSizeId } from '@/types/kdp';

/**
 * Paperback interior geometry from KDP Help, fetched 2026-10-30.
 *
 * Trim, bleed, and margins:
 * https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6
 * Paperback submission (same bleed and gutter tables):
 * https://kdp.amazon.com/en_US/help/topic/G201857950
 *
 * Bleed is 0.125" past the trim on the top, bottom, and outside edges only.
 * The binding edge has no bleed. With bleed, the PDF page is
 * (trim width + 0.125") by (trim height + 0.25"). KDP's 6" x 9" example is
 * 6.125" x 9.25". Their table prints 5.5" x 8.5" with bleed as 5.626" x 8.75";
 * 5.5 + 0.125 = 5.625, and 5.625 in is 14.2875 cm, which they round to 14.29 cm.
 * This module uses the exact 0.125" addition (5.625" x 8.75").
 *
 * The other private repo's 8.5" x 11" interior is 621 x 810 pt. That matches
 * 8.625" x 11.25" at 72 pt/in, so the same formula is used here per book
 * instead of hardcoding 8.5" x 11".
 *
 * Margins below are measured from the trim edge, which is the edge that
 * remains after the 0.125" is cut off. KDP's Word guide tells you to type the
 * "with bleed" outside margin into a page that is already enlarged by the
 * bleed, which lands text 0.125" closer to the trim. This wireframe keeps the
 * full 0.375" inside the trim so type cannot sit in the strip that is cut off.
 * A larger margin still satisfies "at least 0.375"."
 *
 * Inside margin and gutter are the same value. KDP's Word steps say to put
 * that value in the Inside field and leave the separate Gutter field at 0
 * when mirror margins are on. Page count bands are inclusive.
 */

export const KDP_TRIM_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6';
export const KDP_SUBMISSION_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201857950';

export const POINTS_PER_INCH = 72;
export const PRINT_DPI = 300;
export const BLEED_IN = 0.125;
export const MIN_PAGE_COUNT = 24;
export const OUTSIDE_MARGIN_NO_BLEED_IN = 0.25;
export const OUTSIDE_MARGIN_WITH_BLEED_IN = 0.375;

/** A large trim is wider than 6.12" or taller than 9" (KDP trim-size page). */
export const LARGE_TRIM_WIDTH_IN = 6.12;
export const LARGE_TRIM_HEIGHT_IN = 9;

type PageBand = { min: number; max: number; gutterIn: number };

export const GUTTER_BANDS: readonly PageBand[] = [
  { min: 24, max: 150, gutterIn: 0.375 },
  { min: 151, max: 300, gutterIn: 0.5 },
  { min: 301, max: 500, gutterIn: 0.625 },
  { min: 501, max: 700, gutterIn: 0.75 },
  { min: 701, max: 828, gutterIn: 0.875 },
];

export type TrimSpec = {
  id: TrimSizeId;
  label: string;
  widthIn: number;
  heightIn: number;
  /** Black-ink page caps from the paperback trim table. Color ink is out of scope. */
  maxPages: Record<BookPaper, number>;
};

export const TRIM_SPECS: Record<TrimSizeId, TrimSpec> = {
  '5.5x8.5': {
    id: '5.5x8.5',
    label: '5.5" × 8.5"',
    widthIn: 5.5,
    heightIn: 8.5,
    maxPages: { white: 828, cream: 776 },
  },
  '6x9': {
    id: '6x9',
    label: '6" × 9"',
    widthIn: 6,
    heightIn: 9,
    maxPages: { white: 828, cream: 776 },
  },
  '8.5x11': {
    id: '8.5x11',
    label: '8.5" × 11"',
    widthIn: 8.5,
    heightIn: 11,
    maxPages: { white: 590, cream: 550 },
  },
};

export type BookGeometry = {
  trim: TrimSpec;
  largeTrim: boolean;
  bleed: boolean;
  bleedIn: number;
  paper: BookPaper;
  pageCount: number;
  gutterIn: number;
  outsideMarginIn: number;
  trimWidthIn: number;
  trimHeightIn: number;
  pageWidthIn: number;
  pageHeightIn: number;
  trimWidthPt: number;
  trimHeightPt: number;
  pageWidthPt: number;
  pageHeightPt: number;
  trimWidthPx: number;
  trimHeightPx: number;
  pageWidthPx: number;
  pageHeightPx: number;
};

export type PdfRect = { x: number; y: number; width: number; height: number };

export type Insets = { top: number; right: number; bottom: number; left: number };

export function inchesToPoints(inches: number): number {
  return Math.round(inches * POINTS_PER_INCH);
}

export function inchesToPixels(inches: number): number {
  return Math.round(inches * PRINT_DPI);
}

export function isLargeTrim(widthIn: number, heightIn: number): boolean {
  return widthIn > LARGE_TRIM_WIDTH_IN || heightIn > LARGE_TRIM_HEIGHT_IN;
}

/** Inside (gutter) margin for a paperback page count, or null when the count is outside 24–828. */
export function gutterInches(pageCount: number): number | null {
  const band = GUTTER_BANDS.find((entry) => pageCount >= entry.min && pageCount <= entry.max);
  return band ? band.gutterIn : null;
}

export function buildGeometry(
  trimId: TrimSizeId,
  bleed: boolean,
  pageCount: number,
  paper: BookPaper,
): BookGeometry {
  const trim = TRIM_SPECS[trimId];
  const gutterIn = gutterInches(pageCount);
  if (gutterIn === null) {
    throw new Error(`Page count ${pageCount} is outside the KDP paperback range of ${MIN_PAGE_COUNT}–828.`);
  }
  const bleedIn = bleed ? BLEED_IN : 0;
  const trimWidthIn = trim.widthIn;
  const trimHeightIn = trim.heightIn;
  const pageWidthIn = trimWidthIn + bleedIn;
  const pageHeightIn = trimHeightIn + bleedIn * 2;
  return {
    trim,
    largeTrim: isLargeTrim(trimWidthIn, trimHeightIn),
    bleed,
    bleedIn,
    paper,
    pageCount,
    gutterIn,
    outsideMarginIn: bleed ? OUTSIDE_MARGIN_WITH_BLEED_IN : OUTSIDE_MARGIN_NO_BLEED_IN,
    trimWidthIn,
    trimHeightIn,
    pageWidthIn,
    pageHeightIn,
    trimWidthPt: inchesToPoints(trimWidthIn),
    trimHeightPt: inchesToPoints(trimHeightIn),
    pageWidthPt: inchesToPoints(pageWidthIn),
    pageHeightPt: inchesToPoints(pageHeightIn),
    trimWidthPx: inchesToPixels(trimWidthIn),
    trimHeightPx: inchesToPixels(trimHeightIn),
    pageWidthPx: inchesToPixels(pageWidthIn),
    pageHeightPx: inchesToPixels(pageHeightIn),
  };
}

/**
 * Safe-area insets from the PDF page edge (the bleed edge when bleed is on).
 * Odd pages are recto: binding on the left, bleed on the right.
 * Even pages are verso: binding on the right, bleed on the left.
 */
export function safeInsetsIn(geometry: BookGeometry, odd: boolean): Insets {
  const outer = geometry.bleedIn + geometry.outsideMarginIn;
  return {
    top: outer,
    bottom: outer,
    left: odd ? geometry.gutterIn : outer,
    right: odd ? outer : geometry.gutterIn,
  };
}

export function scaleX(geometry: BookGeometry, inches: number): number {
  return (inches / geometry.pageWidthIn) * geometry.pageWidthPx;
}

export function scaleY(geometry: BookGeometry, inches: number): number {
  return (inches / geometry.pageHeightIn) * geometry.pageHeightPx;
}

export function insetsPx(geometry: BookGeometry, insets: Insets): Insets {
  return {
    top: scaleY(geometry, insets.top),
    right: scaleX(geometry, insets.right),
    bottom: scaleY(geometry, insets.bottom),
    left: scaleX(geometry, insets.left),
  };
}

/** PDF boxes in points, origin at the bottom-left of the media box. */
export function printBoxes(geometry: BookGeometry, odd: boolean): {
  media: PdfRect;
  bleed: PdfRect;
  trim: PdfRect;
  art: PdfRect;
} {
  const media = { x: 0, y: 0, width: geometry.pageWidthPt, height: geometry.pageHeightPt };
  const bleedPt = inchesToPoints(geometry.bleedIn);
  const trim = {
    x: odd ? 0 : bleedPt,
    y: bleedPt,
    width: geometry.trimWidthPt,
    height: geometry.trimHeightPt,
  };
  return { media, bleed: media, trim, art: trim };
}

export function formatInches(inches: number): string {
  const rounded = Math.round(inches * 1000) / 1000;
  return `${rounded}"`;
}

/**
 * Locks the published examples in place: 6x9 → 441×666 pt, 8.5x11 → 621×810 pt,
 * 5.5x8.5 → 405×630 pt, plus the gutter bands. Throws on drift.
 */
export function assertReferenceGeometry(): void {
  const expected: { id: TrimSizeId; widthPt: number; heightPt: number }[] = [
    { id: '6x9', widthPt: 441, heightPt: 666 },
    { id: '8.5x11', widthPt: 621, heightPt: 810 },
    { id: '5.5x8.5', widthPt: 405, heightPt: 630 },
  ];
  for (const entry of expected) {
    const geometry = buildGeometry(entry.id, true, 24, 'white');
    if (geometry.pageWidthPt !== entry.widthPt || geometry.pageHeightPt !== entry.heightPt) {
      throw new Error(
        `${entry.id} with bleed is ${geometry.pageWidthPt}×${geometry.pageHeightPt} pt, expected ${entry.widthPt}×${entry.heightPt} pt.`,
      );
    }
    const bleedPt = inchesToPoints(BLEED_IN);
    if (geometry.pageWidthPt !== geometry.trimWidthPt + bleedPt) {
      throw new Error(`${entry.id} width does not add a single bleed edge.`);
    }
    if (geometry.pageHeightPt !== geometry.trimHeightPt + bleedPt * 2) {
      throw new Error(`${entry.id} height does not add bleed on top and bottom.`);
    }
  }

  const noBleed = buildGeometry('6x9', false, 24, 'white');
  if (noBleed.pageWidthPt !== 432 || noBleed.pageHeightPt !== 648) {
    throw new Error(`6x9 without bleed should be 432×648 pt, got ${noBleed.pageWidthPt}×${noBleed.pageHeightPt}.`);
  }

  const gutters: { pages: number; gutter: number | null }[] = [
    { pages: 23, gutter: null },
    { pages: 24, gutter: 0.375 },
    { pages: 150, gutter: 0.375 },
    { pages: 151, gutter: 0.5 },
    { pages: 300, gutter: 0.5 },
    { pages: 301, gutter: 0.625 },
    { pages: 500, gutter: 0.625 },
    { pages: 501, gutter: 0.75 },
    { pages: 700, gutter: 0.75 },
    { pages: 701, gutter: 0.875 },
    { pages: 828, gutter: 0.875 },
    { pages: 829, gutter: null },
  ];
  for (const entry of gutters) {
    const actual = gutterInches(entry.pages);
    if (actual !== entry.gutter) {
      throw new Error(`Gutter for ${entry.pages} pages is ${String(actual)}, expected ${String(entry.gutter)}.`);
    }
  }

  const odd = printBoxes(buildGeometry('8.5x11', true, 24, 'white'), true);
  const even = printBoxes(buildGeometry('8.5x11', true, 24, 'white'), false);
  if (odd.trim.x !== 0 || even.trim.x !== 9 || odd.trim.width !== 612 || even.trim.y !== 9) {
    throw new Error('8.5x11 trim boxes are not mirrored around the binding edge.');
  }
}
