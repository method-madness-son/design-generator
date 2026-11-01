import { THEME_FONT_CSS } from '@/lib/themeFontFaces';

export type FontGroup = { label: string; fonts: Record<string, string> };

export const FONT_GROUPS: FontGroup[] = [
  {
    label: 'Sans',
    fonts: {
      Lexend: 'var(--font-lexend), sans-serif',
      Nunito: 'var(--font-nunito), sans-serif',
      'Atkinson Hyperlegible': 'var(--font-atkinson), sans-serif',
      Andika: 'var(--font-andika), sans-serif',
      Montserrat: 'var(--font-montserrat), sans-serif',
      'Big Shoulders': 'var(--font-big-shoulders), sans-serif',
      'Big Shoulders Stencil': THEME_FONT_CSS['Big Shoulders Stencil'],
      'Archivo Black': 'var(--font-archivo-black), sans-serif',
      Asap: 'var(--font-asap), sans-serif',
      'Source Sans 3': 'var(--font-source-sans-3), sans-serif',
      Sora: 'var(--font-sora), sans-serif',
      Overpass: 'var(--font-overpass), sans-serif',
      'Public Sans': 'var(--font-public-sans), sans-serif',
      Geist: 'var(--font-geist), sans-serif',
      Onest: 'var(--font-onest), sans-serif',
      Amaranth: 'var(--font-amaranth), sans-serif',
      'Barlow Condensed': THEME_FONT_CSS['Barlow Condensed'],
      Anton: THEME_FONT_CSS.Anton,
      Oswald: THEME_FONT_CSS.Oswald,
      'Work Sans': THEME_FONT_CSS['Work Sans'],
    },
  },
  {
    label: 'Serif',
    fonts: {
      Fraunces: 'var(--font-fraunces), serif',
      Cinzel: 'var(--font-cinzel), serif',
      'Playfair Display': 'var(--font-playfair-display), serif',
      Bitter: 'var(--font-bitter), serif',
      'Crimson Pro': 'var(--font-crimson-pro), serif',
      Castoro: 'var(--font-castoro), serif',
      Petrona: 'var(--font-petrona), serif',
      Georgia: "Georgia, 'Times New Roman', serif",
    },
  },
  {
    label: 'Mono',
    fonts: {
      'JetBrains Mono': 'var(--font-jetbrains-mono), monospace',
      'Noto Sans Mono': 'var(--font-noto-sans-mono), monospace',
      'Space Mono': THEME_FONT_CSS['Space Mono'],
      Monospace: "ui-monospace, SFMono-Regular, 'SF Mono', 'JetBrains Mono', Consolas, 'Liberation Mono', monospace",
    },
  },
  {
    label: 'Display',
    fonts: {
      'Press Start 2P': 'var(--font-press-start-2p), monospace',
      'Pixelify Sans': THEME_FONT_CSS['Pixelify Sans'],
      Doto: 'var(--font-doto), sans-serif',
      Datatype: 'var(--font-datatype), sans-serif',
    },
  },
  {
    label: 'Handwriting',
    fonts: {
      Kalam: THEME_FONT_CSS.Kalam,
      'Permanent Marker': THEME_FONT_CSS['Permanent Marker'],
      Yomogi: 'var(--font-yomogi), cursive',
      Galada: 'var(--font-galada), cursive',
      Sarina: 'var(--font-sarina), cursive',
    },
  },
];

// Flat lookup used by the resolver and other non-UI code.
export const GLOBAL_FONTS: Record<string, string> = Object.assign(
  {},
  ...FONT_GROUPS.map((g) => g.fonts),
);
