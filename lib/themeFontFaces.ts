/**
 * CSS font-family values for every face the global theme allows.
 * next/font loads the files in app/themeFonts.ts (or app/fonts.ts, for faces
 * the poster pipeline already loads). Variable names must match those files.
 */
export const THEME_FONT_CSS: Record<string, string> = {
  Shrikhand: 'var(--font-theme-shrikhand), cursive',
  Caprasimo: 'var(--font-theme-caprasimo), serif',
  Righteous: 'var(--font-theme-righteous), cursive',
  'Lilita One': 'var(--font-theme-lilita-one), cursive',
  Anton: 'var(--font-theme-anton), sans-serif',
  'Bebas Neue': 'var(--font-theme-bebas-neue), sans-serif',
  'Alfa Slab One': 'var(--font-theme-alfa-slab-one), serif',
  'Titan One': 'var(--font-theme-titan-one), cursive',
  Fredoka: 'var(--font-theme-fredoka), sans-serif',
  Monoton: 'var(--font-theme-monoton), cursive',
  Oswald: 'var(--font-theme-oswald), sans-serif',
  'Work Sans': 'var(--font-theme-work-sans), sans-serif',
  Caveat: 'var(--font-theme-caveat), cursive',
  'Permanent Marker': 'var(--font-theme-permanent-marker), cursive',
  'JetBrains Mono': 'var(--font-jetbrains-mono), monospace',
  'Fira Code': 'var(--font-theme-fira-code), monospace',
  'Space Mono': 'var(--font-theme-space-mono), monospace',
  'IBM Plex Mono': 'var(--font-theme-ibm-plex-mono), monospace',
  'Press Start 2P': 'var(--font-press-start-2p), monospace',
  Graduate: 'var(--font-theme-graduate), serif',
  'Racing Sans One': 'var(--font-theme-racing-sans-one), sans-serif',
  'Russo One': 'var(--font-theme-russo-one), sans-serif',
  Orbitron: 'var(--font-theme-orbitron), sans-serif',
  Pacifico: 'var(--font-theme-pacifico), cursive',
  'Playfair Display': 'var(--font-playfair-display), serif',
};

/** Faces already loaded for posters. app/themeFonts.ts must not load them again. */
export const FONTS_ALREADY_IN_POSTER_LAYOUT = ['JetBrains Mono', 'Press Start 2P', 'Playfair Display'] as const;
