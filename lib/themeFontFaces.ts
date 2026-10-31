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
  Silkscreen: 'var(--font-theme-silkscreen), monospace',
  'Pixelify Sans': 'var(--font-theme-pixelify-sans), sans-serif',
  VT323: 'var(--font-theme-vt323), monospace',
  'DM Serif Display': 'var(--font-theme-dm-serif-display), serif',
  Lexend: 'var(--font-lexend), sans-serif',
  'Atkinson Hyperlegible Next': 'var(--font-theme-atkinson-next), sans-serif',
  'Jersey 10': 'var(--font-theme-jersey-10), var(--font-press-start-2p), monospace',
  'Big Shoulders Stencil': 'var(--font-theme-big-shoulders-stencil), sans-serif',
  'Barlow Condensed': 'var(--font-theme-barlow-condensed), sans-serif',
  Kalam: 'var(--font-theme-kalam), cursive',
};

/** Faces already loaded for posters. app/themeFonts.ts must not load them again. */
export const FONTS_ALREADY_IN_POSTER_LAYOUT = ['JetBrains Mono', 'Press Start 2P', 'Playfair Display', 'Lexend'] as const;
