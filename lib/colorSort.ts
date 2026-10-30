// Converts a "#rrggbb" hex color to HSL. Returns null for anything that isn't a plain hex color.
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l };
}

// Orders two hex colors by hue, with near-gray colors grouped at the end (hue is meaningless for
// them); within a hue (or within the grays), lighter comes before darker.
const GRAY_SATURATION_THRESHOLD = 0.08;

export function compareColors(hexA: string, hexB: string): number {
  const a = hexToHsl(hexA);
  const b = hexToHsl(hexB);
  const aGray = !a || a.s < GRAY_SATURATION_THRESHOLD;
  const bGray = !b || b.s < GRAY_SATURATION_THRESHOLD;

  if (aGray !== bGray) return aGray ? 1 : -1;
  if (aGray && bGray) return (b?.l ?? 0) - (a?.l ?? 0);

  const hueDiff = a!.h - b!.h;
  if (Math.abs(hueDiff) > 0.001) return hueDiff;
  return b!.l - a!.l;
}

// Sorts a flat { name: hex } map by hue, then light-to-dark within each hue.
export function sortColorEntries(colors: Record<string, string>): [string, string][] {
  return Object.entries(colors).sort(([, hexA], [, hexB]) => compareColors(hexA, hexB));
}

// Sorts a flat { name: hex } map darkest-to-lightest, ignoring hue entirely.
export function sortColorEntriesByLightness(colors: Record<string, string>): [string, string][] {
  return Object.entries(colors).sort(([, hexA], [, hexB]) => {
    const a = hexToHsl(hexA);
    const b = hexToHsl(hexB);
    return (a?.l ?? 0) - (b?.l ?? 0);
  });
}

// Hue-weighted HSL distance rather than plain RGB Euclidean distance. Raw RGB distance badly
// under-distinguishes pale/pastel colors — at high lightness every hue's RGB values compress
// toward white, so two clearly-different pastel hues (e.g. a soft pink and a soft mint) can end
// up numerically "close" even though they look nothing alike. Weighting hue heavily (and treating
// near-gray colors specially, since hue is noisy/meaningless for them) keeps visually distinct
// colors from being silently collapsed into one swatch.
const GRAY_SATURATION_THRESHOLD_FOR_DISTANCE = 0.08;

function colorDistance(hexA: string, hexB: string): number {
  const a = hexToHsl(hexA);
  const b = hexToHsl(hexB);
  if (!a || !b) return Infinity;

  const lightDiff = (a.l - b.l) * 100;
  const satDiff = (a.s - b.s) * 100;
  const aGray = a.s < GRAY_SATURATION_THRESHOLD_FOR_DISTANCE;
  const bGray = b.s < GRAY_SATURATION_THRESHOLD_FOR_DISTANCE;
  if (aGray || bGray) return Math.hypot(lightDiff, satDiff);

  const hueDiff = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
  return Math.hypot(hueDiff, satDiff * 0.6, lightDiff * 0.6);
}

// Colors this close (or closer) read as the same swatch to the eye.
const SIMILAR_COLOR_THRESHOLD = 12;

// Drops any entry whose color is within the threshold of one already kept, so exact duplicates
// and near-identical colors (e.g. two slightly different near-black backgrounds) collapse to a
// single swatch. Keeps the first occurrence of each color, so pass entries in priority order.
export function dedupeSimilarColors<T extends readonly [string, string]>(entries: T[]): T[] {
  const kept: T[] = [];
  for (const entry of entries) {
    const isDuplicate = kept.some((existing) => colorDistance(entry[1], existing[1]) < SIMILAR_COLOR_THRESHOLD);
    if (!isDuplicate) kept.push(entry);
  }
  return kept;
}
