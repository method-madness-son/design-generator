// Low-content KDP paperback manifest. Distinct from types/kdp.ts (the interior
// wireframe) and from the cheat-sheet book engine. Author is always null:
// this pipeline does not invent a pen name. KDP's upload form still asks for
// one. See docs/LOWCONTENT-PIPELINE.md.

export const LC_TRIMS = ['5x8', '6x9', '8x10', '8.5x11'] as const;
export type LcTrimId = (typeof LC_TRIMS)[number];

export const LC_PAPERS = ['white', 'cream', 'groundwood'] as const;
export type LcPaper = (typeof LC_PAPERS)[number];

export const LC_INKS = ['black', 'standard-color', 'premium-color'] as const;
export type LcInk = (typeof LC_INKS)[number];

export const LC_MARKETS = ['nd', 'hockey', 'cooking', 'rally'] as const;
export type LcMarket = (typeof LC_MARKETS)[number];

export const LC_ISBN = ['none', 'own'] as const;
export type LcIsbn = (typeof LC_ISBN)[number];

export const LC_TEMPLATES = [
  'title',
  'belongs-to',
  'contents',
  'weekly-planner',
  'monthly-planner',
  'habit-tracker',
  'lined',
  'dot-grid',
  'graph',
  'gratitude',
  'stats-tracker',
  'recipe',
  'meal-planner',
  'logbook',
  'quick-start',
  'brain-dump',
  'sort-page',
  'daily-plan',
  'weekly-overview',
  'weekly-reset',
  'tiny-step',
  'dopamine-menu',
  'task-reward',
  'launch-shutdown',
  'urgent-important',
  'monthly-review',
  'fresh-start',
  'low-energy',
  'energy-check',
  'body-double',
  'decision-helper',
  'parking-lot',
  'wins-list',
  'day-routine',
  'focus-log',
  'appointments',
  'project-planner',
  'mood-sleep',
] as const;
export type LcTemplateId = (typeof LC_TEMPLATES)[number];

export type LcField = {
  label: string;
  /** Ruled write-in lines under the label. Defaults to 1. */
  lines?: number;
};

export type LcPageConfig = {
  heading?: string;
  /** Weekly and monthly planners, and the meal grid. */
  dated?: boolean;
  columns?: string[];
  rows?: number;
  prompts?: string[];
  habits?: string[];
  /** Habit-tracker day columns. 7 is a week. Up to 31 is a month. */
  days?: number;
  fields?: LcField[];
  note?: string;
  /** Page variant, such as launch vs shutdown or an example menu vs a blank one. */
  variant?: string;
};

export type LcPageRef = {
  template: LcTemplateId;
  /** How many interior pages this template expands to. Required, at least 1. */
  repeat: number;
  config?: LcPageConfig;
};

export type LcCategory = {
  label: string;
  /** BISAC subject code, when one is known. Optional. */
  bisac?: string;
};

export type LcReadingAge = {
  min: number;
  max: number;
};

export type LcMetadata = {
  title: string;
  subtitle: string;
  /** Exactly seven keyword boxes. */
  keywords: string[];
  description: string;
  /** This pipeline stores two. KDP's picker currently allows up to three. */
  categories: LcCategory[];
  /** List price in USD for Amazon.com. */
  priceUsd: number;
  /** Null leaves KDP's optional reading-age control empty. */
  readingAge: LcReadingAge | null;
  /** Records the bookshelf Low-content checkbox. Always true in this pipeline. */
  lowContent: true;
  /** `none` publishes without an ISBN. `own` uses an ISBN you already have. A free KDP ISBN is not eligible. */
  isbn: LcIsbn;
  /** Required Yes/No on the details form. Samples are false. */
  sexuallyExplicit: false;
};

export type LcThemeRef = {
  /** Palette id from theme/global.json, or a market override id (hockey, rally, cooking, nd). */
  palette: string;
  displayFont: string;
  supportingFont: string;
};

export type LowContentManifest = {
  id: string;
  /** Display name, for example "ND Books". */
  project: string;
  /** Folder under lowcontent/, for example "nd-books". */
  projectSlug: string;
  market: LcMarket;
  title: string;
  subtitle: string;
  trim: LcTrimId;
  /** Must equal the sum of page repeats. */
  pageCount: number;
  paper: LcPaper;
  ink: LcInk;
  /** Interior bleed. Cover files always include bleed, even when this is false. */
  bleed: boolean;
  theme: LcThemeRef;
  author: null;
  pages: LcPageRef[];
  kdp: LcMetadata;
};

export type LcProjectFile = {
  id: string;
  title: string;
  description: string;
  market: LcMarket;
};

export type RenderedLcPage = {
  template: LcTemplateId;
  config: LcPageConfig;
  /** 1-based index within this template run. */
  entryIndex: number;
  entryCount: number;
  /** 1-based page number in the interior. */
  pageNumber: number;
};

export type LcOutlineEntry = {
  template: LcTemplateId;
  label: string;
  start: number;
  end: number;
};

export type ResolvedInteriorTheme = {
  paletteId: string;
  paletteLabel: string;
  paper: string;
  ink: string;
  accent: string;
  rule: string;
  displayFont: string;
  supportingFont: string;
  /** CSS font-family from the shared theme, including the next/font variable. */
  displayFontCss: string;
  supportingFontCss: string;
  sourcePath: string;
  marketStatus: string | null;
};
