/** Global design theme shared by tee, poster, mug, and book pipelines. */

export type InkSetName = 'on_light_shirt' | 'on_dark_shirt';

export type WcagBand = 'AA_normal' | 'AA_large_graphics_only' | 'below_minimum';

export type ThemeMeta = {
  name: string;
  version: string;
  created: string;
  source_file: string;
  consumer: string;
  verification: {
    verified: string[];
    proposed_unverified: string[];
  };
  contrast_method: string;
  local_additions?: string[];
};

export type ShirtColor = {
  name: string;
  hex: string;
  is_dark: boolean;
  default_ink_set: InkSetName;
  source?: string;
  hex_note?: string;
};

export type ShirtFallback = {
  name: string;
  fallback: string;
  reason: string;
};

export type PaletteColor = {
  name: string;
  hex: string;
  role: string;
};

export type InkSwatch = {
  name: string;
  hex: string;
  contrast_ratio?: number;
  wcag?: string;
};

export type NamedPalette = {
  display_name: string;
  use_case: string;
  status: string;
  colors: PaletteColor[];
  recommended_shirts: string[];
  fonts: { display: string; supporting: string };
  ink: {
    reference_light_shirt: { name: string; hex: string };
    reference_dark_shirt: { name: string; hex: string };
    on_light_shirt: InkSwatch[];
    on_dark_shirt: InkSwatch[];
  };
  texture?: string;
};

export type FontFace = {
  family: string;
  google_fonts_name: string;
  google_fonts_url: string;
  license: string;
  license_verified_via: string;
  commercial_use: boolean;
  recommended_use: string;
  min_size_note: string;
};

export type BannedFont = {
  family?: string;
  rule?: string;
  reason?: string;
};

export type MarketSwatch = {
  name: string;
  hex: string;
  role: string;
  contrast_vs_ivory: number;
  contrast_vs_pepper: number;
};

/** Named palettes (nd) and proposed market palettes share this bag of optional fields. */
export type MarketOverride = {
  status: string;
  default_palette?: string;
  palettes?: string[];
  palette_by_subniche?: Record<string, string>;
  palette?: MarketSwatch[];
  fonts?: { display: string; supporting: string };
  recommended_shirts?: string[];
  notes?: string;
  alt_fonts?: string[];
  symbols_allowed?: string[];
  symbols_banned?: string[];
  tone?: string;
  print_note?: string;
};

export type GlobalTheme = {
  meta: ThemeMeta;
  shirt_colors: {
    blank: string;
    hex_note: string;
    colors: ShirtColor[];
    fallbacks?: ShirtFallback[];
    listing_rule: string;
    top_sellers: string[];
  };
  palettes: Record<string, NamedPalette>;
  fonts: {
    display: FontFace[];
    supporting: FontFace[];
    hand_drawn: FontFace[];
    mono: FontFace[];
    pairing_rules: string[];
    banned: BannedFont[];
  };
  per_market_overrides: Record<string, MarketOverride>;
  rules: {
    do: string[];
    dont: string[];
    trademark_watch: { phrase: string; note: string }[];
  };
};

export type InkChoice = {
  name: string;
  hex: string;
  wcag?: string;
  contrastRatio?: number;
};
