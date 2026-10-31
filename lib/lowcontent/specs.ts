import type { LcInk, LcPaper, LcTrimId } from '@/types/lowcontent';

/**
 * Paperback geometry for the low-content pipeline. Numbers were read from KDP
 * Help on 2026-10-31. Anything this file does not encode is marked in
 * docs/LOWCONTENT-PIPELINE.md.
 *
 * Trim, bleed, margins, and the page-count table:
 * https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6
 * Submission guidelines (same tables, plus PDF rules and spine formulas):
 * https://kdp.amazon.com/en_US/help/topic/G201857950
 * Cover size, the standard-vs-premium spine split, and cover text:
 * https://kdp.amazon.com/en_US/help/topic/G201953020
 * Barcode box:
 * https://kdp.amazon.com/en_US/help/topic/G5HDYGP4BXLX4RUW
 * Low-content barcode placement (lower right of the back cover, 2" × 1.2"):
 * https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM
 */

export const KDP_TRIM_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6';
export const KDP_SUBMISSION_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201857950';
export const KDP_COVER_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201953020';
export const KDP_BARCODE_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G5HDYGP4BXLX4RUW';
export const KDP_LOW_CONTENT_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM';
export const KDP_FORMATTING_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201834260';

export const POINTS_PER_INCH = 72;
export const PRINT_DPI = 300;
export const BLEED_IN = 0.125;

/** Outside margins, measured from the trim edge. */
export const OUTSIDE_MARGIN_NO_BLEED_IN = 0.25;
export const OUTSIDE_MARGIN_WITH_BLEED_IN = 0.375;

/** Cover text stays this far inside the trim. The stricter of the two help pages. */
export const COVER_SAFE_INSET_IN = 0.25;
/** Cover page also says text must be at least 0.125" inside the trim. */
export const COVER_TEXT_MIN_INSET_IN = 0.125;

/** Spine text needs this much room on either side of the fold. */
export const SPINE_TEXT_MARGIN_IN = 0.0625;

/**
 * Spine text is drawn only when the page count is greater than 79.
 * G201953020 says both "at least 79" and "more than 79", and Cover Creator
 * uses 80. G201857950 says "more than 79". Staying above 79 satisfies all of them.
 */
export const SPINE_TEXT_MIN_PAGES_EXCLUSIVE = 79;

export const MIN_FONT_PT = 7;
export const MIN_RULE_PT = 0.75;

export const BARCODE_WIDTH_IN = 2;
export const BARCODE_HEIGHT_IN = 1.2;
export const BARCODE_INSET_IN = 0.25;

/** A large trim is wider than 6.12" or taller than 9". Pricing uses this. Page caps do not. */
export const LARGE_TRIM_WIDTH_IN = 6.12;
export const LARGE_TRIM_HEIGHT_IN = 9;

/**
 * Inches of spine per page.
 * Black/white and cream agree on both help pages.
 * Groundwood is only on the submission page.
 * Premium color agrees (submission page calls every color interior 0.002347").
 * Standard color does not: the cover page says 0.002252" and the submission
 * page folds all color interiors into 0.002347". This pipeline uses the cover
 * page for the standard-color split and warns.
 */
export const SPINE_PER_PAGE_IN: Record<string, number> = {
  'black:white': 0.002252,
  'black:cream': 0.0025,
  'black:groundwood': 0.00235,
  'premium-color:white': 0.002347,
  'standard-color:white': 0.002252,
};

export const STANDARD_COLOR_SPINE_CONFLICT =
  'Submission guidelines give every color interior a spine factor of 0.002347". The cover page gives standard color 0.002252" and premium color 0.002347". This pipeline uses the cover page for standard color. Confirm with the KDP cover calculator before upload.';

type PageLimit = { min: number; max: number };

type TrimSpec = {
  id: LcTrimId;
  label: string;
  widthIn: number;
  heightIn: number;
  /** With-bleed page size published on the trim help page, when it is an exact 0.125" addition. */
  bleedPage: { widthIn: number; heightIn: number };
  limits: Record<LcInk, Partial<Record<LcPaper, PageLimit>>>;
};

/**
 * Page caps for the four trims this pipeline renders. Read from the paperback
 * table on GVBQ3CMEQW3W2VL6 and repeated on G201857950. 8" × 10" is a large
 * trim for pricing and still uses the 828/776 caps, not the 8.5" × 11" caps.
 * Color columns are headed "white paper" only.
 */
export const TRIM_SPECS: Record<LcTrimId, TrimSpec> = {
  '5x8': {
    id: '5x8',
    label: '5" × 8"',
    widthIn: 5,
    heightIn: 8,
    bleedPage: { widthIn: 5.125, heightIn: 8.25 },
    limits: {
      black: {
        white: { min: 24, max: 828 },
        cream: { min: 24, max: 776 },
        groundwood: { min: 24, max: 812 },
      },
      'standard-color': { white: { min: 72, max: 600 } },
      'premium-color': { white: { min: 24, max: 828 } },
    },
  },
  '6x9': {
    id: '6x9',
    label: '6" × 9"',
    widthIn: 6,
    heightIn: 9,
    bleedPage: { widthIn: 6.125, heightIn: 9.25 },
    limits: {
      black: {
        white: { min: 24, max: 828 },
        cream: { min: 24, max: 776 },
        groundwood: { min: 24, max: 812 },
      },
      'standard-color': { white: { min: 72, max: 600 } },
      'premium-color': { white: { min: 24, max: 828 } },
    },
  },
  '8x10': {
    id: '8x10',
    label: '8" × 10"',
    widthIn: 8,
    heightIn: 10,
    bleedPage: { widthIn: 8.125, heightIn: 10.25 },
    limits: {
      black: {
        white: { min: 24, max: 828 },
        cream: { min: 24, max: 776 },
        groundwood: { min: 24, max: 812 },
      },
      'standard-color': { white: { min: 72, max: 600 } },
      'premium-color': { white: { min: 24, max: 828 } },
    },
  },
  '8.5x11': {
    id: '8.5x11',
    label: '8.5" × 11"',
    widthIn: 8.5,
    heightIn: 11,
    bleedPage: { widthIn: 8.625, heightIn: 11.25 },
    limits: {
      black: {
        white: { min: 24, max: 590 },
        cream: { min: 24, max: 550 },
        groundwood: { min: 24, max: 578 },
      },
      'standard-color': { white: { min: 72, max: 600 } },
      'premium-color': { white: { min: 24, max: 590 } },
    },
  },
};

export const GUTTER_BANDS: readonly { min: number; max: number; gutterIn: number }[] = [
  { min: 24, max: 150, gutterIn: 0.375 },
  { min: 151, max: 300, gutterIn: 0.5 },
  { min: 301, max: 500, gutterIn: 0.625 },
  { min: 501, max: 700, gutterIn: 0.75 },
  { min: 701, max: 828, gutterIn: 0.875 },
];

export type Insets = { top: number; right: number; bottom: number; left: number };
export type PdfRect = { x: number; y: number; width: number; height: number };
export type InchRect = { x: number; y: number; width: number; height: number };

export type InteriorGeometry = {
  trim: TrimSpec;
  largeTrim: boolean;
  bleed: boolean;
  bleedIn: number;
  paper: LcPaper;
  ink: LcInk;
  pageCount: number;
  gutterIn: number;
  outsideMarginIn: number;
  pageWidthIn: number;
  pageHeightIn: number;
  pageWidthPt: number;
  pageHeightPt: number;
  pageWidthPx: number;
  pageHeightPx: number;
};

export type CoverGeometry = {
  trimWidthIn: number;
  trimHeightIn: number;
  bleedIn: number;
  spineIn: number;
  spineFactor: number;
  pageCount: number;
  fullWidthIn: number;
  fullHeightIn: number;
  fullWidthPt: number;
  fullHeightPt: number;
  fullWidthPx: number;
  fullHeightPx: number;
  back: InchRect;
  spine: InchRect;
  front: InchRect;
  barcode: InchRect;
  safeInsetIn: number;
  spineMarginIn: number;
  allowSpineText: boolean;
};

export function isLargeTrim(widthIn: number, heightIn: number): boolean {
  return widthIn > LARGE_TRIM_WIDTH_IN || heightIn > LARGE_TRIM_HEIGHT_IN;
}

export function pageLimit(trim: LcTrimId, ink: LcInk, paper: LcPaper): PageLimit | null {
  return TRIM_SPECS[trim].limits[ink][paper] ?? null;
}

export function gutterInches(pageCount: number): number | null {
  const band = GUTTER_BANDS.find((entry) => pageCount >= entry.min && pageCount <= entry.max);
  return band ? band.gutterIn : null;
}

export function spineFactor(ink: LcInk, paper: LcPaper): number | null {
  return SPINE_PER_PAGE_IN[`${ink}:${paper}`] ?? null;
}

/** Points. Values that land on an integer stay integers so 6.125" is 441 pt. */
export function inchesToPoints(inches: number): number {
  const raw = inches * POINTS_PER_INCH;
  const nearest = Math.round(raw);
  if (Math.abs(raw - nearest) < 1e-6) return nearest;
  return Math.round(raw * 1000) / 1000;
}

export function inchesToPixels(inches: number): number {
  return Math.round(inches * PRINT_DPI);
}

export function buildInteriorGeometry(
  trimId: LcTrimId,
  bleed: boolean,
  pageCount: number,
  paper: LcPaper,
  ink: LcInk,
): InteriorGeometry {
  const trim = TRIM_SPECS[trimId];
  const gutterIn = gutterInches(pageCount);
  if (gutterIn === null) {
    throw new Error(`Page count ${pageCount} is outside the gutter table (24–828).`);
  }
  const bleedIn = bleed ? BLEED_IN : 0;
  const pageWidthIn = trim.widthIn + bleedIn;
  const pageHeightIn = trim.heightIn + bleedIn * 2;
  return {
    trim,
    largeTrim: isLargeTrim(trim.widthIn, trim.heightIn),
    bleed,
    bleedIn,
    paper,
    ink,
    pageCount,
    gutterIn,
    outsideMarginIn: bleed ? OUTSIDE_MARGIN_WITH_BLEED_IN : OUTSIDE_MARGIN_NO_BLEED_IN,
    pageWidthIn,
    pageHeightIn,
    pageWidthPt: inchesToPoints(pageWidthIn),
    pageHeightPt: inchesToPoints(pageHeightIn),
    pageWidthPx: inchesToPixels(pageWidthIn),
    pageHeightPx: inchesToPixels(pageHeightIn),
  };
}

/**
 * Safe-area insets from the PDF page edge.
 * Odd pages are recto: binding on the left, bleed on the right.
 * Even pages are verso: binding on the right, bleed on the left.
 * Margins are measured from the trim, then the bleed strip is added outside that.
 */
export function safeInsetsIn(geometry: InteriorGeometry, odd: boolean): Insets {
  const outer = geometry.bleedIn + geometry.outsideMarginIn;
  const gutter = geometry.bleedIn + geometry.gutterIn;
  return {
    top: outer,
    bottom: outer,
    left: odd ? gutter : outer,
    right: odd ? outer : gutter,
  };
}

export function scaleX(pageWidthIn: number, pageWidthPx: number, inches: number): number {
  return (inches / pageWidthIn) * pageWidthPx;
}

export function scaleY(pageHeightIn: number, pageHeightPx: number, inches: number): number {
  return (inches / pageHeightIn) * pageHeightPx;
}

export function ptToPx(pageHeightIn: number, pageHeightPx: number, points: number): number {
  return (points / POINTS_PER_INCH) * (pageHeightPx / pageHeightIn);
}

export function printBoxes(geometry: InteriorGeometry, odd: boolean): {
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
    width: inchesToPoints(geometry.trim.widthIn),
    height: inchesToPoints(geometry.trim.heightIn),
  };
  return { media, bleed: media, trim, art: trim };
}

export function buildCoverGeometry(
  trimId: LcTrimId,
  pageCount: number,
  paper: LcPaper,
  ink: LcInk,
): CoverGeometry {
  const trim = TRIM_SPECS[trimId];
  const factor = spineFactor(ink, paper);
  if (factor === null) {
    throw new Error(`No spine factor for ${ink} on ${paper} paper.`);
  }
  const bleedIn = BLEED_IN;
  const spineIn = pageCount * factor;
  const fullWidthIn = bleedIn + trim.widthIn + spineIn + trim.widthIn + bleedIn;
  const fullHeightIn = bleedIn + trim.heightIn + bleedIn;
  const back: InchRect = { x: bleedIn, y: bleedIn, width: trim.widthIn, height: trim.heightIn };
  const spine: InchRect = { x: bleedIn + trim.widthIn, y: bleedIn, width: spineIn, height: trim.heightIn };
  const front: InchRect = {
    x: bleedIn + trim.widthIn + spineIn,
    y: bleedIn,
    width: trim.widthIn,
    height: trim.heightIn,
  };
  // Lower right of the back cover, inset from the spine (the back cover's right edge) and the bottom trim.
  const barcode: InchRect = {
    x: back.x + back.width - BARCODE_INSET_IN - BARCODE_WIDTH_IN,
    y: back.y + back.height - BARCODE_INSET_IN - BARCODE_HEIGHT_IN,
    width: BARCODE_WIDTH_IN,
    height: BARCODE_HEIGHT_IN,
  };
  return {
    trimWidthIn: trim.widthIn,
    trimHeightIn: trim.heightIn,
    bleedIn,
    spineIn,
    spineFactor: factor,
    pageCount,
    fullWidthIn,
    fullHeightIn,
    fullWidthPt: inchesToPoints(fullWidthIn),
    fullHeightPt: inchesToPoints(fullHeightIn),
    fullWidthPx: inchesToPixels(fullWidthIn),
    fullHeightPx: inchesToPixels(fullHeightIn),
    back,
    spine,
    front,
    barcode,
    safeInsetIn: COVER_SAFE_INSET_IN,
    spineMarginIn: SPINE_TEXT_MARGIN_IN,
    allowSpineText: pageCount > SPINE_TEXT_MIN_PAGES_EXCLUSIVE,
  };
}

export function coverPrintBoxes(cover: CoverGeometry): { media: PdfRect; trim: PdfRect } {
  const bleedPt = inchesToPoints(cover.bleedIn);
  const media = { x: 0, y: 0, width: cover.fullWidthPt, height: cover.fullHeightPt };
  const trim = {
    x: bleedPt,
    y: bleedPt,
    width: inchesToPoints(cover.fullWidthIn - cover.bleedIn * 2),
    height: inchesToPoints(cover.fullHeightIn - cover.bleedIn * 2),
  };
  return { media, trim };
}

export function formatInches(inches: number): string {
  const rounded = Math.round(inches * 1000) / 1000;
  return `${rounded}"`;
}

export function assertReferenceSpecs(): void {
  const bleedPages: { id: LcTrimId; widthPt: number; heightPt: number }[] = [
    { id: '5x8', widthPt: 369, heightPt: 594 },
    { id: '6x9', widthPt: 441, heightPt: 666 },
    { id: '8x10', widthPt: 585, heightPt: 738 },
    { id: '8.5x11', widthPt: 621, heightPt: 810 },
  ];
  for (const entry of bleedPages) {
    const geometry = buildInteriorGeometry(entry.id, true, 24, 'white', 'black');
    const spec = TRIM_SPECS[entry.id];
    if (geometry.pageWidthIn !== spec.bleedPage.widthIn || geometry.pageHeightIn !== spec.bleedPage.heightIn) {
      throw new Error(`${entry.id} bleed page drifted from the help-page size.`);
    }
    if (geometry.pageWidthPt !== entry.widthPt || geometry.pageHeightPt !== entry.heightPt) {
      throw new Error(
        `${entry.id} with bleed is ${geometry.pageWidthPt}×${geometry.pageHeightPt} pt, expected ${entry.widthPt}×${entry.heightPt}.`,
      );
    }
  }

  const gutterChecks: [number, number][] = [
    [24, 0.375],
    [150, 0.375],
    [151, 0.5],
    [300, 0.5],
    [301, 0.625],
    [500, 0.625],
    [501, 0.75],
    [700, 0.75],
    [701, 0.875],
    [828, 0.875],
  ];
  for (const [count, gutter] of gutterChecks) {
    if (gutterInches(count) !== gutter) throw new Error(`Gutter for ${count} pages drifted.`);
  }
  if (gutterInches(23) !== null || gutterInches(829) !== null) {
    throw new Error('Gutter table should be empty outside 24–828.');
  }

  const cover = buildCoverGeometry('6x9', 24, 'white', 'black');
  const expectedSpine = 24 * 0.002252;
  if (Math.abs(cover.spineIn - expectedSpine) > 1e-9) throw new Error('White-paper spine factor drifted.');
  const expectedWidth = 0.125 + 6 + expectedSpine + 6 + 0.125;
  if (Math.abs(cover.fullWidthIn - expectedWidth) > 1e-9) throw new Error('Cover width formula drifted.');
  if (Math.abs(cover.fullHeightIn - 9.25) > 1e-9) throw new Error('Cover height formula drifted.');
  if (cover.allowSpineText) throw new Error('24 pages must not allow spine text.');
  if (!buildCoverGeometry('6x9', 80, 'white', 'black').allowSpineText) {
    throw new Error('80 pages should allow spine text.');
  }

  const eightByTen = pageLimit('8x10', 'black', 'white');
  if (!eightByTen || eightByTen.max !== 828) {
    throw new Error('8×10 white page cap must stay 828. It is not the 8.5×11 cap.');
  }
  if (pageLimit('8.5x11', 'premium-color', 'cream') !== null) {
    throw new Error('Color ink on cream paper is not in the KDP table.');
  }
  if (MIN_RULE_PT < 0.75) throw new Error('Rule weight dropped below 0.75 pt.');
}
