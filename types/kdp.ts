// Unbranded KDP interior manifest. Field meanings follow the book-details form
// described in KDP Help (see lib/kdpMetadata.ts, lib/kdpSizes.ts, and
// lib/kdpTemplates.ts). No brand, imprint, or ISBN number: a low-content book
// records only the bookshelf ISBN choice (`none` or `own`).

export const TRIM_SIZE_IDS = ['5.5x8.5', '6x9', '8.5x11'] as const;
export type TrimSizeId = (typeof TRIM_SIZE_IDS)[number];

export const BOOK_MARKETS = ['rc', 'sim-racing', 'tech', 'hockey', 'generic'] as const;
export type BookMarket = (typeof BOOK_MARKETS)[number];

export const BOOK_FORMATS = ['kdp-logbook', 'kdp-journal', 'kdp-cheatsheet'] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

/** `low-content` is the bookshelf Low-content box. `standard` is every other interior. */
export const BOOK_CONTENTS = ['standard', 'low-content'] as const;
export type BookContent = (typeof BOOK_CONTENTS)[number];

/**
 * Print-ISBN choice for a low-content book. Free KDP ISBNs are not eligible.
 * `none` is "Publish without an ISBN". `own` is "Use my own ISBN".
 * The number itself is entered at upload and is not stored here.
 */
export const LOW_CONTENT_ISBN_OPTIONS = ['none', 'own'] as const;
export type LowContentIsbn = (typeof LOW_CONTENT_ISBN_OPTIONS)[number];

export const BOOK_PAPERS = ['white', 'cream'] as const;
export type BookPaper = (typeof BOOK_PAPERS)[number];

export type KdpCategory = {
  label: string;
  /** BISAC subject code, when one is known. Optional. */
  bisac?: string;
};

export type KdpMetadata = {
  title: string;
  subtitle: string;
  description: string;
  categories: KdpCategory[];
  /** Exactly seven keyword boxes, matching the KDP bookshelf form. */
  keywords: string[];
};

export type TitlePage = {
  type: 'title';
  kicker?: string;
  title?: string;
  subtitle?: string;
  note?: string;
};

export type CopyrightPage = {
  type: 'copyright';
  year?: string;
  holder?: string;
  notices?: string[];
};

export type LogField = {
  label: string;
  /** Ruled write-in lines under the label. Defaults to 1. */
  lines?: number;
};

export type LogPage = {
  type: 'log';
  /** True draws a dated log; false draws an undated log. */
  dated: boolean;
  heading?: string;
  fields: LogField[];
  grid?: {
    columns: string[];
    rows: number;
  };
};

export type StatsPage = {
  type: 'stats';
  heading?: string;
  columns: string[];
  rows: number;
};

export type NotesPage = {
  type: 'notes';
  heading?: string;
};

export type ChecklistPage = {
  type: 'checklist';
  heading?: string;
  items: string[];
};

export const PAPER_STYLES = ['lined', 'dot', 'grid'] as const;
export type PaperStyle = (typeof PAPER_STYLES)[number];

/** Lined, dot-grid, or square-grid notebook paper. These pages are not blank. */
export type PaperPage = {
  type: 'paper';
  style: PaperStyle;
  heading?: string;
};

export type HabitPage = {
  type: 'habit';
  heading?: string;
  habits: string[];
  /** Day columns. 7 is a week. Up to 31 is a month. */
  days: number;
};

export type CheatSheetRow = {
  label: string;
  value: string;
};

export type CheatSheetPage = {
  type: 'cheatsheet';
  heading?: string;
  sections: {
    title: string;
    rows: CheatSheetRow[];
  }[];
};

export type BookPageBody =
  | TitlePage
  | CopyrightPage
  | LogPage
  | StatsPage
  | NotesPage
  | CheatSheetPage
  | ChecklistPage
  | PaperPage
  | HabitPage;

export type BookPageSpec = BookPageBody & {
  /** How many interior pages this template expands to. Defaults to 1. */
  repeat?: number;
};

type BookManifestBase = {
  id: string;
  market: BookMarket;
  format: BookFormat;
  trim: TrimSizeId;
  /** When true, every page is built at the with-bleed size. KDP requires the whole file to bleed if any page does. */
  bleed: boolean;
  paper: BookPaper;
  /** Wireframe renderer is black ink only. Color interiors are a follow-up. */
  ink: 'black';
  kdp: KdpMetadata;
  pages: BookPageSpec[];
};

export type BookManifest =
  | (BookManifestBase & { content: 'low-content'; isbn: LowContentIsbn })
  | (BookManifestBase & { content: 'standard' });

export type RenderedPage = BookPageBody & {
  /** 1-based index within this template's repeat run. */
  entryIndex: number;
  entryCount: number;
};
