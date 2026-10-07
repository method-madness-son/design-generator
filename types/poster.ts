export type AspectRatioOption = '2/3' | '3/2' | '3/4' | '4/3' | '4/5' | '5/4' | '1/1';

export type ProjectConfig = {
  id: string;
  title: string;
  description: string;
  // Exposed on the canvas as CSS variables: { ink: '#111' } -> var(--poster-ink)
  colorPalette: Record<string, string>;
  // Named alternatives to colorPalette that a poster can pick with "palette".
  palettes?: Record<string, Record<string, string>>;
  // Named title/body font pairings (CSS font-family values) a poster can pick with "fonts".
  // titleClasses, if set, is merged over the poster's title classes (e.g. a heavier weight).
  fontPairs?: Record<string, { title: string; body: string; titleClasses?: string }>;
  // Rem options offered in the icon/title/subtitle size dropdowns.
  sizeScale?: { icon: number[]; title: number[]; subtitle: number[] };
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
    fontFamily: string;
    // Non-size styling only (weight, tracking, leading, color); size comes from titleRem/subtitleRem.
    titleClasses: string;
    subtitleClasses: string;
    bodyClasses?: string;
    titleRem: number;
    subtitleRem: number;
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
  fonts?: string;
  icon?: {
    name: string;
    position: 'top' | 'bottom';
    className?: string;
    sizeRem?: number;
  };
  overrides?: DeepPartial<Omit<ProjectConfig, 'id' | 'title' | 'description' | 'colorPalette' | 'palettes' | 'fontPairs'>> & {
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
  body: string[];
  bodyClasses: string;
  titleFont: string;
  bodyFont: string;
  fontsName?: string;
  colorPalette: Record<string, string>;
  paletteName?: string;
  icon?: PosterFile['icon'];
  pinterest?: PosterFile['pinterest'];
  etsy?: PosterFile['etsy'];
};
