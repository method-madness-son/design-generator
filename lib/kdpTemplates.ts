import type {
  BookPageBody,
  ChecklistPage,
  CopyrightPage,
  HabitPage,
  LogPage,
  LowContentIsbn,
  PaperPage,
  TitlePage,
} from '@/types/kdp';

/**
 * Reusable interiors for low-content books, fetched against KDP Help on 2026-10-31.
 *
 * Low-content books (minimal or no content, repetitive, filled in by the reader):
 * https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM
 * ISBN exception, and series ineligibility, in the metadata guidelines:
 * https://kdp.amazon.com/en_US/help/topic/G201097560
 * Free KDP ISBN is not offered for low-content books:
 * https://kdp.amazon.com/en_US/help/topic/GTJ8LBXL6Z4WV5QX
 * Public domain is a separate program. These templates are original fill-in pages:
 * https://kdp.amazon.com/help/topic/G200743940
 * Consecutive blank pages (4 in the middle, 10 at the end). This catalog does not emit them:
 * https://kdp.amazon.com/en_US/help/topic/G201834260
 * Line weight minimum 0.75 pt, stated on the manuscript checklist:
 * https://kdp.amazon.com/en_US/help/topic/G202145060
 *
 * A manifest page can be `{ "template": "mileage-log", "repeat": 40 }` or a full
 * `type` object. `repeat` is applied by the loader. `heading` replaces the
 * template heading when that page has one.
 */

export const KDP_LOW_CONTENT_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM';
export const KDP_ISBN_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/GTJ8LBXL6Z4WV5QX';
export const KDP_PUBLIC_DOMAIN_HELP_URL = 'https://kdp.amazon.com/help/topic/G200743940';
export const KDP_BLANK_PAGES_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201834260';
export const KDP_EXPANDED_DISTRIBUTION_URL = 'https://kdp.amazon.com/en_US/help/topic/GQTT4W3T5AYK7L45';

export const LOW_CONTENT_TEMPLATE_IDS = [
  'title',
  'copyright',
  'dated-log',
  'undated-log',
  'checklist',
  'lined',
  'dot-grid',
  'square-grid',
  'habit-tracker',
  'mileage-log',
  'maintenance-log',
  'gratitude-log',
] as const;

export type LowContentTemplateId = (typeof LOW_CONTENT_TEMPLATE_IDS)[number];

export const LOW_CONTENT_TEMPLATE_SUMMARIES: Record<LowContentTemplateId, string> = {
  title: 'Title page. Uses the manifest title and subtitle.',
  copyright: 'Placeholder rights page. Not a copyright registration.',
  'dated-log': 'Dated log with a short write-in grid.',
  'undated-log': 'Undated log with write-in fields and a grid.',
  checklist: 'Checkbox list.',
  lined: 'Ruled notebook page.',
  'dot-grid': 'Dot-grid notebook page.',
  'square-grid': 'Square-grid notebook page.',
  'habit-tracker': 'Weekly habit grid, seven day columns.',
  'mileage-log': 'Dated mileage log with a trip grid.',
  'maintenance-log': 'Dated maintenance log with a parts grid.',
  'gratitude-log': 'Dated thankfulness prompts with a notes grid.',
};

const TEMPLATES: Record<LowContentTemplateId, () => BookPageBody> = {
  title: titlePage,
  copyright: copyrightPage,
  'dated-log': datedLog,
  'undated-log': undatedLog,
  checklist: checklistPage,
  lined: () => paperPage('lined', 'Placeholder lined page'),
  'dot-grid': () => paperPage('dot', 'Placeholder dot-grid page'),
  'square-grid': () => paperPage('grid', 'Placeholder square-grid page'),
  'habit-tracker': habitTracker,
  'mileage-log': mileageLog,
  'maintenance-log': maintenanceLog,
  'gratitude-log': gratitudeLog,
};

export function isLowContentTemplateId(value: string): value is LowContentTemplateId {
  return (LOW_CONTENT_TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Fresh page body so a heading override cannot change the catalog. */
export function lowContentTemplate(id: LowContentTemplateId): BookPageBody {
  return TEMPLATES[id]();
}

export function lowContentUploadNotes(isbn: LowContentIsbn): string[] {
  const shared = [
    'Check the Low-content box under Categories on the bookshelf. KDP rejects the book if that box is cleared or a different box is selected. This repo does not check it for you.',
    'A free KDP ISBN, a series, Expanded Distribution, and a release date are unavailable for this book.',
    'The ISBN choice cannot be changed after publishing unless the book is unpublished and published again.',
  ];
  if (isbn === 'none') {
    return [
      ...shared,
      'ISBN choice: publish without an ISBN. Look Inside is unavailable. KDP places a barcode in a 2 in × 1.2 in box at the lower right of the back cover.',
    ];
  }
  return [
    ...shared,
    'ISBN choice: use your own ISBN. Enter the number during title setup. It is not stored in this manifest. Look Inside can be available with your own ISBN.',
  ];
}

function titlePage(): TitlePage {
  return {
    type: 'title',
    kicker: 'Placeholder title page',
    note: 'No cover art, logo, or brand color in this file. Replace this text before listing.',
  };
}

function copyrightPage(): CopyrightPage {
  return {
    type: 'copyright',
    year: '2026',
    holder: '[Rights holder placeholder]',
    notices: [
      'Placeholder notice. This page is not a real copyright registration.',
      'No imprint, ISBN, logo, or brand name is assigned in this wireframe.',
      'Low-content interiors are fill-in templates. The ISBN choice is recorded on the manifest.',
    ],
  };
}

function datedLog(): LogPage {
  return {
    type: 'log',
    dated: true,
    heading: 'Placeholder dated log',
    fields: [
      { label: 'Date (placeholder)' },
      { label: 'Title (placeholder)' },
      { label: 'Entry (placeholder)', lines: 3 },
    ],
    grid: { columns: ['Item', 'Value', 'Note'], rows: 4 },
  };
}

function undatedLog(): LogPage {
  return {
    type: 'log',
    dated: false,
    heading: 'Placeholder undated log',
    fields: [
      { label: 'Title (placeholder)' },
      { label: 'Details (placeholder)', lines: 2 },
    ],
    grid: { columns: ['Item', 'Note'], rows: 6 },
  };
}

function checklistPage(): ChecklistPage {
  return {
    type: 'checklist',
    heading: 'Placeholder checklist',
    items: Array.from({ length: 12 }, (_, index) => `Placeholder item ${index + 1}`),
  };
}

function paperPage(style: PaperPage['style'], heading: string): PaperPage {
  return { type: 'paper', style, heading };
}

function habitTracker(): HabitPage {
  return {
    type: 'habit',
    heading: 'Placeholder habit tracker',
    habits: Array.from({ length: 8 }, (_, index) => `Placeholder habit ${index + 1}`),
    days: 7,
  };
}

function mileageLog(): LogPage {
  return {
    type: 'log',
    dated: true,
    heading: 'Placeholder mileage log',
    fields: [
      { label: 'Date (placeholder)' },
      { label: 'Vehicle (placeholder)' },
    ],
    grid: { columns: ['Start', 'End', 'Distance', 'Purpose'], rows: 8 },
  };
}

function maintenanceLog(): LogPage {
  return {
    type: 'log',
    dated: true,
    heading: 'Placeholder maintenance log',
    fields: [
      { label: 'Date (placeholder)' },
      { label: 'Item (placeholder)' },
      { label: 'Reading (placeholder)' },
      { label: 'Work done (placeholder)', lines: 2 },
      { label: 'Parts (placeholder)' },
      { label: 'Next due (placeholder)' },
    ],
    grid: { columns: ['Part', 'Note'], rows: 4 },
  };
}

function gratitudeLog(): LogPage {
  return {
    type: 'log',
    dated: true,
    heading: 'Placeholder gratitude log',
    fields: [
      { label: 'Date (placeholder)' },
      { label: 'Grateful for (placeholder)', lines: 3 },
      { label: 'One small win (placeholder)', lines: 2 },
      { label: 'Tomorrow (placeholder)', lines: 2 },
    ],
    grid: { columns: ['Note'], rows: 4 },
  };
}
