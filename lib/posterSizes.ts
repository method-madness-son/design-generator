import type { AspectRatioOption } from '@/types/poster';

// Standard print sizes offered as an explicit override on top of a project's own default layout
// (which is itself 8x10 today). See README.md for the Printify export requirements these numbers
// are built around: 300 DPI, exact trim-size pixel dimensions, content kept inside a safe margin.
export const PRINT_DPI = 300;

export type PosterSizeName = '8x10' | '11x17';

export const POSTER_SIZES: Record<
  PosterSizeName,
  { label: string; aspectRatio: AspectRatioOption; printWidthInches: number; printHeightInches: number }
> = {
  '8x10': { label: '8" × 10" (Vertical)', aspectRatio: '4/5', printWidthInches: 8, printHeightInches: 10 },
  '11x17': { label: '11" × 17" (Vertical)', aspectRatio: '11/17', printWidthInches: 11, printHeightInches: 17 },
};
