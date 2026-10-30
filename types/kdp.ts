// Unbranded KDP interior manifest. Field meanings follow the book-details form
// described in KDP Help (see lib/kdpMetadata.ts and lib/kdpSizes.ts for the
// pages these limits were checked against). No brand, imprint, or ISBN fields:
// those are follow-ups, not part of this wireframe.

export const TRIM_SIZE_IDS = ['5.5x8.5', '6x9', '8.5x11'] as const;
export type TrimSizeId = (typeof TRIM_SIZE_IDS)[number];

export const BOOK_MARKETS = ['rc', 'sim-racing', 'tech', 'hockey', 'generic'] as const;
export type BookMarket = (typeof BOOK_MARKETS)[number];

export const BOOK_FORMATS = ['kdp-logbook', 'kdp-journal', 'kdp-cheatsheet'] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

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

export type BookPageBody = TitlePage | CopyrightPage | LogPage | StatsPage | NotesPage | CheatSheetPage;

export type BookPageSpec = BookPageBody & {
  /** How many interior pages this template expands to. Defaults to 1. */
  repeat?: number;
};

export type BookManifest = {
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

export type RenderedPage = BookPageBody & {
  /** 1-based index within this template's repeat run. */
  entryIndex: number;
  entryCount: number;
};
