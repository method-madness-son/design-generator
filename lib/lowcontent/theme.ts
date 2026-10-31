import type { LcMarket, ResolvedInteriorTheme } from '@/types/lowcontent';
import { fontFamilyCss, getMarket, getPalette } from '@/lib/theme';

/**
 * Interior colors for a low-content book. Palettes and font allow-lists come
 * from the shared theme (`theme/global.json`, `lib/theme.ts`). This file does
 * not load a second copy of the theme.
 */

type ColorStop = { name: string; hex: string };

const PAPER_FALLBACK = '#FBF8F3';
const INK_FALLBACK = '#1A1A1A';

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = match[1];
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number | null {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  if (!left || !right) return null;
  const lum = (rgb: [number, number, number]) =>
    0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  const hi = Math.max(lum(left), lum(right));
  const lo = Math.min(lum(left), lum(right));
  return (hi + 0.05) / (lo + 0.05);
}

function mixHex(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  if (!a || !b) return from;
  const mixed = (index: number) => Math.round(a[index] + (b[index] - a[index]) * amount);
  const part = (value: number) => value.toString(16).padStart(2, '0');
  return `#${part(mixed(0))}${part(mixed(1))}${part(mixed(2))}`;
}

function paletteColors(paletteId: string): { label: string; status: string | null; colors: ColorStop[] } | null {
  const named = getPalette(paletteId);
  if (named) return { label: named.display_name, status: named.status, colors: named.colors };
  const market = getMarket(paletteId);
  if (market?.palette && market.palette.length > 0) {
    return { label: paletteId, status: market.status, colors: market.palette };
  }
  return null;
}

export function resolveInteriorTheme(
  paletteId: string,
  displayFont: string,
  supportingFont: string,
  market: LcMarket,
): ResolvedInteriorTheme {
  const palette = paletteColors(paletteId);
  if (!palette) throw new Error(`Unknown theme palette "${paletteId}".`);
  const ranked = [...palette.colors].filter((color) => hexToRgb(color.hex)).sort((a, b) => luminance(b.hex) - luminance(a.hex));
  const lightest = ranked[0];
  const darkest = ranked[ranked.length - 1];
  const paper = lightest && luminance(lightest.hex) > 0.72 ? lightest.hex : PAPER_FALLBACK;
  let ink =
    darkest && (contrastRatio(darkest.hex, paper) ?? 0) >= 4.5 ? darkest.hex : INK_FALLBACK;
  if ((contrastRatio(ink, paper) ?? 0) < 4.5) ink = INK_FALLBACK;
  const accentStop = ranked.find(
    (color) =>
      color.hex.toLowerCase() !== ink.toLowerCase() &&
      color.hex.toLowerCase() !== paper.toLowerCase() &&
      (contrastRatio(color.hex, paper) ?? 0) >= 3,
  );
  const marketBlock = getMarket(market);
  return {
    paletteId,
    paletteLabel: palette.label,
    paper,
    ink,
    accent: accentStop ? accentStop.hex : ink,
    rule: mixHex(ink, paper, 0.55),
    displayFont,
    supportingFont,
    displayFontCss: fontFamilyCss(displayFont),
    supportingFontCss: fontFamilyCss(supportingFont),
    sourcePath: 'theme/global.json',
    marketStatus: palette.status ?? marketBlock?.status ?? null,
  };
}
