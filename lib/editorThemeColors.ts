// Dark background + accent pairs inspired by well-known code editor themes, for posters that
// want a "coding setup" dark-mode look rather than the bright pastel system. Each accent is that
// theme's own signature color, picked for good contrast against its background.
//
// Shared globally: merged into BACKGROUND_COLORS (lib/backgroundColors.ts) and into every
// project's accent color options (lib/colorOptions.ts), alongside the pastels.
export const EDITOR_THEME_COLORS: Record<string, { background: string; accent: string }> = {
  Dracula: { background: '#282A36', accent: '#BD93F9' },
  Monokai: { background: '#272822', accent: '#F92672' },
  'Solarized Dark': { background: '#002B36', accent: '#B58900' },
  Nord: { background: '#434C5E', accent: '#88C0D0' },
  'Night Owl': { background: '#011627', accent: '#7FDBCA' },
  'GitHub Dark': { background: '#0D1117', accent: '#58A6FF' },
};
