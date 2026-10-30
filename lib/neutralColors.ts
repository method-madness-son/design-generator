// A few shades of white/soft gray, from near-white down to near-black, for posters that want a
// plain neutral look rather than a pastel or editor-theme color. Each still pairs with a
// contrasting gray accent for icon/title/subtitle text — except White, whose accent is white
// itself, so picking "White" as a title/subtitle color actually gives white text (its natural
// dark-on-white pairing is already covered by each project's own "Ink" option).
//
// Shared globally: merged into BACKGROUND_COLORS (lib/backgroundColors.ts) and into every
// project's accent color options (lib/colorOptions.ts), alongside the pastels and editor themes.
export const NEUTRAL_COLORS: Record<string, { background: string; accent: string }> = {
  // Light
  White: { background: '#FFFFFF', accent: '#FFFFFF' },
  'Soft Gray': { background: '#D9D9D9', accent: '#4D4D4D' },
  'Pearl Gray': { background: '#B3B3B3', accent: '#737373' },
  // Dark
  'Charcoal Gray': { background: '#595959', accent: '#BFBFBF' },
  'Jet Black': { background: '#0A0A0A', accent: '#999999' },
};
