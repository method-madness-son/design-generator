export type AspectRatioOption = '2/3' | '3/2' | '3/4' | '4/3' | '4/5' | '5/4' | '1/1' | '11/17';

export type ProjectConfig = {
  id: string;
  title: string;
  description: string;
  // Exposed on the canvas as CSS variables: { ink: '#111' } -> var(--poster-ink)
  colorPalette: Record<string, string>;
  // Named alternatives to colorPalette that a poster can pick with "palette".
  palettes?: Record<string, Record<string, string>>;
  // Rem options offered in the icon/title/subtitle/body size dropdowns.
  sizeScale?: { icon: number[]; title: number[]; subtitle: number[]; body?: number[] };
  // Default icon size in rem; a poster's icon.sizeRem overrides it.
  iconRem: number;
  defaultLayout: {
    aspectRatio: AspectRatioOption;
    containerClasses: string;
    // Physical width of the print; export is sized to this at 300 DPI.
    printWidthInches?: number;
  };
  defaultBackground: {
    className: string;
  };
  defaultTypography: {
    // Applies to both title and subtitle unless titleFontFamily/subtitleFontFamily override it.
    fontFamily: string;
    titleFontFamily?: string;
    subtitleFontFamily?: string;
    // Weight/tracking/leading plus the default text color; an explicit titleColor/subtitleColor
    // selection overrides the color via inline style. Size comes from titleRem/subtitleRem.
    titleClasses: string;
    subtitleClasses: string;
    bodyClasses?: string;
    bodyFontFamily?: string;
    titleRem: number;
    subtitleRem: number;
    bodyRem?: number;
  };
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type PosterFile = {
  id: string;
  title: string;
  subtitle: string;
  // Optional short lines shown as a list under the subtitle.
  body?: string[];
  palette?: string;
  titleFont?: string;
  subtitleFont?: string;
  titleColor?: string;
  subtitleColor?: string;
  iconColor?: string;
  backgroundColor?: string;
  icon?: {
    name: string;
    position: 'top' | 'bottom';
    className?: string;
    sizeRem?: number;
  };
  // Renders a built-in generative graphic (components/Fractal.tsx) instead of a lucide icon.
  graphic?: {
    type: 'lorenz' | 'tree' | 'spiral' | 'road-arrow' | 'pen-arrow' | 'loop-arrow' | 'surfaces';
    position: 'top' | 'bottom';
    className?: string;
    sizeRem?: number;
  };
  overrides?: DeepPartial<Omit<ProjectConfig, 'id' | 'title' | 'description' | 'colorPalette' | 'palettes'>> & {
    colorPalette?: Record<string, string>;
  };
  // Copy-paste-ready fields for listing this poster as a Pinterest pin.
  pinterest?: {
    title: string;
    description: string;
    keywords: string[];
    board: string;
    altText: string;
  };
  // Copy-paste-ready fields for an Etsy listing (tags: max 13, each max 20 characters).
  etsy?: {
    title: string;
    description: string;
    tags: string[];
    category: string;
  };
  // Evidence behind the etsy block, written by the etsy-listing-researcher agent. Not uploaded;
  // checked by `npm run listing:check` (lib/etsyListing.ts).
  research?: PosterResearch;
};

export type MarketResearch = {
  // Phrases buyers search or the marketplace indexes, e.g. Etsy /market/<phrase> pages.
  searchPhrases: string[];
  // Short observations about competing listings: angle, sizes, gaps. Never copied copy.
  competitorNotes: string[];
  priceRange?: { min: number; max: number; currency: string };
};

export type PosterResearch = {
  researchedAt: string; // YYYY-MM-DD
  // "pages" when listing pages were read directly; "search-results" when only search snippets were.
  method: 'pages' | 'search-results';
  primaryKeyword: string;
  etsy: MarketResearch;
  amazon: MarketResearch;
  sources: string[];
  notes?: string;
};

export type ResolvedPoster = {
  id: string;
  projectId: string;
  title: string;
  subtitle: string;
  aspectRatio: AspectRatioOption;
  printWidthInches: number;
  containerClasses: string;
  bgClass: string;
  titleClasses: string;
  subtitleClasses: string;
  titleRem: number;
  subtitleRem: number;
  iconRem: number;
  bodyRem: number;
  // Un-customized sizes (ignoring any selection); see lib/posterResolver.ts.
  titleDefaultRem: number;
  subtitleDefaultRem: number;
  iconDefaultRem: number;
  bodyDefaultRem: number;
  body: string[];
  bodyClasses: string;
  titleFont: string;
  subtitleFont: string;
  bodyFont: string;
  titleFontName?: string;
  subtitleFontName?: string;
  bodyFontName?: string;
  // CSS color values; set only when explicitly picked, overriding the default color baked into
  // titleClasses/subtitleClasses, the icon's className, or colorPalette.background.
  titleColor?: string;
  subtitleColor?: string;
  iconColor?: string;
  bodyColor?: string;
  backgroundColor?: string;
  colorPalette: Record<string, string>;
  paletteName?: string;
  icon?: PosterFile['icon'];
  graphic?: PosterFile['graphic'];
  pinterest?: PosterFile['pinterest'];
  etsy?: PosterFile['etsy'];
};
