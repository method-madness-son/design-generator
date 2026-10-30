// Clear, classic pastels — bright and cheerful rather than muted/earthy. Each pairs a light
// pastel background with a clearer, more saturated version of the same hue to use for
// icon/title/subtitle text, so there's still enough contrast to read comfortably against it.
//
//
// These colors are shared globally: merged into BACKGROUND_COLORS (lib/backgroundColors.ts) and into every
// project's accent color options (lib/colorOptions.ts).
export const PASTEL_COLORS: Record<string, { background: string; accent: string }> = {
  'Baby Blue': { background: '#D6EAF8', accent: '#4A90C4' },
  Peach: { background: '#FDE7CE', accent: '#E8894A' },
  Lavender: { background: '#E6D9F5', accent: '#9B6FC9' },
  Mint: { background: '#D4F3E3', accent: '#3FAF7A' },
  'Soft Pink': { background: '#FAD9E6', accent: '#E0659A' },
};
