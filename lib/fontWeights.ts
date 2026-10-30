// For each font in lib/fontOptions.ts GLOBAL_FONTS: the heaviest weight actually loaded (for
// title/bold previews) and the closest-to-600 weight available (for subtitle/semibold previews).
// Matches the weight arrays passed to each font in app/fonts.ts — fonts loaded as variable carry
// their full range so 900/600 are always valid; static fonts fall back to their nearest loaded
// weight when 900 or 600 themselves aren't published.
export const FONT_WEIGHTS: Record<string, { bold: number; semibold: number }> = {
  Lexend: { bold: 900, semibold: 600 },
  Fraunces: { bold: 900, semibold: 600 },
  Nunito: { bold: 900, semibold: 600 },
  'Atkinson Hyperlegible': { bold: 700, semibold: 700 },
  Andika: { bold: 700, semibold: 700 },
  Cinzel: { bold: 700, semibold: 600 },
  'Playfair Display': { bold: 700, semibold: 500 },
  Montserrat: { bold: 900, semibold: 600 },
  'Big Shoulders': { bold: 900, semibold: 600 },
  'Archivo Black': { bold: 400, semibold: 400 },
  Asap: { bold: 900, semibold: 600 },
  'JetBrains Mono': { bold: 800, semibold: 600 },
  'Source Sans 3': { bold: 900, semibold: 600 },
  Bitter: { bold: 900, semibold: 600 },
  Sora: { bold: 800, semibold: 600 },
  Overpass: { bold: 900, semibold: 600 },
  'Public Sans': { bold: 900, semibold: 600 },
  Geist: { bold: 900, semibold: 600 },
  'Press Start 2P': { bold: 400, semibold: 400 },
  Onest: { bold: 900, semibold: 600 },
  Datatype: { bold: 900, semibold: 600 },
  'Noto Sans Mono': { bold: 900, semibold: 600 },
  Amaranth: { bold: 700, semibold: 700 },
  'Crimson Pro': { bold: 900, semibold: 600 },
  Castoro: { bold: 400, semibold: 400 },
  Petrona: { bold: 900, semibold: 600 },
  Yomogi: { bold: 400, semibold: 400 },
  Galada: { bold: 400, semibold: 400 },
  Sarina: { bold: 400, semibold: 400 },
  Doto: { bold: 900, semibold: 600 },
  Georgia: { bold: 700, semibold: 600 },
  Monospace: { bold: 700, semibold: 600 },
};

// Fallback for any font not listed above (e.g. a newly added one someone forgot to add here).
export const DEFAULT_FONT_WEIGHTS = { bold: 700, semibold: 600 };
