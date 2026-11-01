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

// The listing size a resolved poster renders at, or null when its layout is not a sellable size
// (e.g. a project whose default layout is not 8x10). Saved exports must be one of these.
export function posterSizeFor(aspectRatio: AspectRatioOption, printWidthInches: number): PosterSizeName | null {
  const match = (Object.entries(POSTER_SIZES) as [PosterSizeName, (typeof POSTER_SIZES)[PosterSizeName]][]).find(
    ([, size]) => size.aspectRatio === aspectRatio && size.printWidthInches === printWidthInches,
  );
  return match ? match[0] : null;
}

export function posterSizePixels(size: PosterSizeName): { width: number; height: number } {
  const spec = POSTER_SIZES[size];
  return { width: spec.printWidthInches * PRINT_DPI, height: spec.printHeightInches * PRINT_DPI };
}

export const isPosterSizeName = (value: string): value is PosterSizeName => value in POSTER_SIZES;
