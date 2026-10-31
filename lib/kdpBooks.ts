import fs from 'fs';
import path from 'path';
import type {
  BookContent,
  BookFormat,
  BookManifest,
  BookMarket,
  BookPageBody,
  BookPageSpec,
  BookPaper,
  CheatSheetPage,
  ChecklistPage,
  CopyrightPage,
  HabitPage,
  KdpMetadata,
  LogPage,
  LowContentIsbn,
  NotesPage,
  PaperPage,
  RenderedPage,
  StatsPage,
  TitlePage,
  TrimSizeId,
} from '@/types/kdp';
import {
  BOOK_CONTENTS,
  BOOK_FORMATS,
  BOOK_MARKETS,
  BOOK_PAPERS,
  LOW_CONTENT_ISBN_OPTIONS,
  PAPER_STYLES,
  TRIM_SIZE_IDS,
} from '@/types/kdp';
import { validateKdpMetadata } from '@/lib/kdpMetadata';
import { MIN_PAGE_COUNT, TRIM_SPECS, buildGeometry, gutterInches, type BookGeometry } from '@/lib/kdpSizes';
import {
  LOW_CONTENT_TEMPLATE_IDS,
  isLowContentTemplateId,
  lowContentTemplate,
} from '@/lib/kdpTemplates';

const BOOKS_DIR = path.join(process.cwd(), 'kdp');

const isSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

export type LoadedBook = {
  id: string;
  manifest: BookManifest | null;
  pages: RenderedPage[];
  geometry: BookGeometry | null;
  /** Parsed even when the rest of the manifest fails, so the index can still group the book. */
  content: BookContent | null;
  errors: string[];
  warnings: string[];
};

export function getBookIds(): string[] {
  if (!fs.existsSync(BOOKS_DIR)) return [];
  return fs
    .readdirSync(BOOKS_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''))
    .filter(isSlug)
    .sort();
}

export function loadBook(id: string): LoadedBook | null {
  if (!isSlug(id)) return null;
  const filePath = path.join(BOOKS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  } catch (error) {
    return emptyBook(id, [
      `${id}.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
  return evaluateManifest(id, raw);
}

export function loadBooks(): LoadedBook[] {
  return getBookIds().map((id) => loadBook(id)).filter((book): book is LoadedBook => book !== null);
}

function emptyBook(id: string, errors: string[]): LoadedBook {
  return { id, manifest: null, pages: [], geometry: null, content: null, errors, warnings: [] };
}

export function evaluateManifest(id: string, raw: unknown): LoadedBook {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(raw)) return emptyBook(id, ['Manifest must be a JSON object.']);

  if (raw.id !== id) errors.push(`Manifest id must match the filename (${id}).`);
  if (!isOneOf<BookMarket>(raw.market, BOOK_MARKETS)) {
    errors.push(`market must be one of ${BOOK_MARKETS.join(', ')}.`);
  }
  if (!isOneOf<BookFormat>(raw.format, BOOK_FORMATS)) {
    errors.push(`format must be one of ${BOOK_FORMATS.join(', ')}.`);
  }
  if (!isOneOf<TrimSizeId>(raw.trim, TRIM_SIZE_IDS)) {
    errors.push(`trim must be one of ${TRIM_SIZE_IDS.join(', ')}.`);
  }
  if (typeof raw.bleed !== 'boolean') errors.push('bleed must be true or false.');
  if (!isOneOf<BookPaper>(raw.paper, BOOK_PAPERS)) errors.push('paper must be "white" or "cream".');
  if (raw.ink !== 'black') errors.push('ink must be "black". Color interiors are not part of this wireframe.');
  const content = parseContent(raw, errors);
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) errors.push('pages must be a non-empty array.');

  const metadataReport = validateKdpMetadata(raw.kdp);
  errors.push(...metadataReport.errors);
  warnings.push(...metadataReport.warnings);

  const pageSpecs = Array.isArray(raw.pages) ? raw.pages.map((page, index) => parsePage(page, index, errors)) : [];
  const parsedPages = pageSpecs.filter((page): page is BookPageSpec => page !== null);
  const rendered = parsedPages.flatMap((page) => expandPage(page));

  if (content === 'low-content' && parsedPages.some((page) => page.type === 'cheatsheet')) {
    warnings.push(
      'Low-content book includes a cheat-sheet page with filled-in reference text. KDP lists manuals and nonfiction as not generally low-content. Confirm the Low-content box still fits.',
    );
  }

  if (rendered.length > 0 && rendered.length < MIN_PAGE_COUNT) {
    errors.push(
      `Interior has ${rendered.length} pages. KDP paperbacks start at ${MIN_PAGE_COUNT}. Repeat a template until the book reaches that.`,
    );
  }
  if (rendered.length > 0 && rendered.length % 2 === 1) {
    warnings.push('Odd page count. KDP rounds the printed count up to an even number, which can add a blank page.');
  }

  const trimId = isOneOf<TrimSizeId>(raw.trim, TRIM_SIZE_IDS) ? raw.trim : null;
  const paper = isOneOf<BookPaper>(raw.paper, BOOK_PAPERS) ? raw.paper : null;
  let geometry: BookGeometry | null = null;
  if (trimId && paper && rendered.length >= MIN_PAGE_COUNT) {
    const maxPages = TRIM_SPECS[trimId].maxPages[paper];
    if (rendered.length > maxPages) {
      errors.push(
        `${rendered.length} pages is over the ${maxPages}-page cap for ${trimId} black ink on ${paper} paper.`,
      );
    } else if (gutterInches(rendered.length) === null) {
      errors.push(`No gutter band covers ${rendered.length} pages.`);
    } else if (typeof raw.bleed === 'boolean') {
      geometry = buildGeometry(trimId, raw.bleed, rendered.length, paper);
    }
  }

  const manifest = buildManifest({
    errors,
    id,
    raw,
    metadata: metadataReport.metadata,
    trimId,
    paper,
    pages: parsedPages,
  });

  if (manifest && geometry === null) {
    errors.push('Could not build page geometry.');
  }
  if (errors.length === 0 && manifest === null) {
    errors.push('Could not build the manifest.');
  }

  return {
    id,
    manifest: errors.length === 0 ? manifest : null,
    pages: errors.length === 0 ? rendered : [],
    geometry: errors.length === 0 ? geometry : null,
    content,
    errors,
    warnings,
  };
}

function parseContent(raw: Record<string, unknown>, errors: string[]): BookContent | null {
  if (!isOneOf<BookContent>(raw.content, BOOK_CONTENTS)) {
    errors.push(`content must be one of ${BOOK_CONTENTS.join(', ')}.`);
    return null;
  }
  if (raw.content === 'low-content') {
    if (raw.isbn === 'kdp') {
      errors.push('Low-content books are not eligible for a free KDP ISBN. Set isbn to "none" or "own".');
    } else if (!isOneOf<LowContentIsbn>(raw.isbn, LOW_CONTENT_ISBN_OPTIONS)) {
      errors.push('Low-content books must set isbn to "none" (publish without an ISBN) or "own" (use your own ISBN).');
    }
    return 'low-content';
  }
  if (raw.isbn !== undefined) {
    errors.push('Remove isbn from a standard interior. The none/own choice is only for low-content books.');
  }
  return 'standard';
}

function buildManifest(input: {
  errors: string[];
  id: string;
  raw: Record<string, unknown>;
  metadata: KdpMetadata | null;
  trimId: TrimSizeId | null;
  paper: BookPaper | null;
  pages: BookPageSpec[];
}): BookManifest | null {
  const { errors, id, raw, metadata, trimId, paper, pages } = input;
  if (
    errors.length > 0 ||
    !metadata ||
    !trimId ||
    !paper ||
    typeof raw.bleed !== 'boolean' ||
    !isOneOf<BookMarket>(raw.market, BOOK_MARKETS) ||
    !isOneOf<BookFormat>(raw.format, BOOK_FORMATS) ||
    !isOneOf<BookContent>(raw.content, BOOK_CONTENTS)
  ) {
    return null;
  }
  const shared = {
    id,
    market: raw.market,
    format: raw.format,
    trim: trimId,
    bleed: raw.bleed,
    paper,
    ink: 'black' as const,
    kdp: metadata,
    pages,
  };
  if (raw.content === 'low-content' && isOneOf<LowContentIsbn>(raw.isbn, LOW_CONTENT_ISBN_OPTIONS)) {
    return { ...shared, content: 'low-content', isbn: raw.isbn };
  }
  if (raw.content === 'standard') {
    return { ...shared, content: 'standard' };
  }
  return null;
}

function expandPage(page: BookPageSpec): RenderedPage[] {
  const { repeat = 1, ...body } = page;
  return Array.from({ length: repeat }, (_, index) => ({
    ...body,
    entryIndex: index + 1,
    entryCount: repeat,
  }));
}

function parsePage(input: unknown, index: number, errors: string[]): BookPageSpec | null {
  if (!isRecord(input)) {
    errors.push(`pages[${index}] must be an object.`);
    return null;
  }
  const repeat = parseRepeat(input.repeat, index, errors);
  const body = input.template !== undefined ? parseTemplatePage(input, index, errors) : parseBody(input, index, errors);
  if (repeat === null || body === null) return null;
  return { ...body, repeat };
}

function parseTemplatePage(input: Record<string, unknown>, index: number, errors: string[]): BookPageBody | null {
  const where = `pages[${index}]`;
  if (input.type !== undefined) {
    errors.push(`${where} sets both template and type. Use one.`);
    return null;
  }
  let extraField = false;
  for (const key of Object.keys(input)) {
    if (key !== 'template' && key !== 'repeat' && key !== 'heading') {
      extraField = true;
      errors.push(`${where}.${key} is not a template field. A template reference accepts template, repeat, and heading.`);
    }
  }
  if (typeof input.template !== 'string' || !isLowContentTemplateId(input.template)) {
    errors.push(`${where}.template must be one of ${LOW_CONTENT_TEMPLATE_IDS.join(', ')}.`);
    return null;
  }
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null || extraField) return null;
  const body = lowContentTemplate(input.template);
  if (heading === undefined) return body;
  const headed = withHeading(body, heading);
  if (!headed) {
    errors.push(`${where}.heading does not apply to the ${input.template} template.`);
    return null;
  }
  return headed;
}

function withHeading(body: BookPageBody, heading: string): BookPageBody | null {
  switch (body.type) {
    case 'title':
    case 'copyright':
      return null;
    case 'log':
    case 'stats':
    case 'notes':
    case 'cheatsheet':
    case 'checklist':
    case 'paper':
    case 'habit':
      return { ...body, heading };
    default: {
      const unreachable: never = body;
      return unreachable;
    }
  }
}

function parseRepeat(input: unknown, index: number, errors: string[]): number | null {
  if (input === undefined) return 1;
  if (typeof input !== 'number' || !Number.isInteger(input) || input < 1 || input > 800) {
    errors.push(`pages[${index}].repeat must be an integer from 1 to 800.`);
    return null;
  }
  return input;
}

function parseBody(input: Record<string, unknown>, index: number, errors: string[]): BookPageBody | null {
  const where = `pages[${index}]`;
  switch (input.type) {
    case 'title':
      return parseTitle(input, where, errors);
    case 'copyright':
      return parseCopyright(input, where, errors);
    case 'log':
      return parseLog(input, where, errors);
    case 'stats':
      return parseStats(input, where, errors);
    case 'notes':
      return parseNotes(input, where, errors);
    case 'cheatsheet':
      return parseCheatSheet(input, where, errors);
    case 'checklist':
      return parseChecklist(input, where, errors);
    case 'paper':
      return parsePaper(input, where, errors);
    case 'habit':
      return parseHabit(input, where, errors);
    default:
      errors.push(
        `${where}.type must be title, copyright, log, stats, notes, cheatsheet, checklist, paper, or habit.`,
      );
      return null;
  }
}

function optionalText(input: Record<string, unknown>, key: string, where: string, errors: string[]): string | undefined | null {
  if (input[key] === undefined) return undefined;
  if (typeof input[key] !== 'string' || (input[key] as string).trim().length === 0) {
    errors.push(`${where}.${key} must be a non-empty string when it is set.`);
    return null;
  }
  return input[key] as string;
}

function parseTitle(input: Record<string, unknown>, where: string, errors: string[]): TitlePage | null {
  const kicker = optionalText(input, 'kicker', where, errors);
  const title = optionalText(input, 'title', where, errors);
  const subtitle = optionalText(input, 'subtitle', where, errors);
  const note = optionalText(input, 'note', where, errors);
  if (kicker === null || title === null || subtitle === null || note === null) return null;
  return { type: 'title', kicker, title, subtitle, note };
}

function parseCopyright(input: Record<string, unknown>, where: string, errors: string[]): CopyrightPage | null {
  const year = optionalText(input, 'year', where, errors);
  const holder = optionalText(input, 'holder', where, errors);
  if (year === null || holder === null) return null;
  let notices: string[] | undefined;
  if (input.notices !== undefined) {
    if (!Array.isArray(input.notices) || input.notices.some((entry) => typeof entry !== 'string' || entry.trim().length === 0)) {
      errors.push(`${where}.notices must be an array of non-empty strings.`);
      return null;
    }
    notices = input.notices as string[];
  }
  return { type: 'copyright', year, holder, notices };
}

function parseLog(input: Record<string, unknown>, where: string, errors: string[]): LogPage | null {
  if (typeof input.dated !== 'boolean') {
    errors.push(`${where}.dated must be true or false.`);
    return null;
  }
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    errors.push(`${where}.fields must be a non-empty array.`);
    return null;
  }
  const fields: LogPage['fields'] = [];
  for (let fieldIndex = 0; fieldIndex < input.fields.length; fieldIndex += 1) {
    const field = input.fields[fieldIndex];
    if (!isRecord(field) || typeof field.label !== 'string' || field.label.trim().length === 0) {
      errors.push(`${where}.fields[${fieldIndex}].label must be a non-empty string.`);
      return null;
    }
    let lines: number | undefined;
    if (field.lines !== undefined) {
      if (typeof field.lines !== 'number' || !Number.isInteger(field.lines) || field.lines < 1 || field.lines > 8) {
        errors.push(`${where}.fields[${fieldIndex}].lines must be an integer from 1 to 8.`);
        return null;
      }
      lines = field.lines;
    }
    fields.push({ label: field.label, lines });
  }
  let grid: LogPage['grid'];
  if (input.grid !== undefined) {
    grid = parseGrid(input.grid, where, errors) ?? undefined;
    if (input.grid !== undefined && grid === undefined) return null;
  }
  return { type: 'log', dated: input.dated, heading, fields, grid };
}

function parseGrid(input: unknown, where: string, errors: string[]): LogPage['grid'] | null {
  if (!isRecord(input) || !Array.isArray(input.columns) || input.columns.length === 0 || input.columns.length > 8) {
    errors.push(`${where}.grid.columns must be 1 to 8 labels.`);
    return null;
  }
  if (input.columns.some((column) => typeof column !== 'string' || column.trim().length === 0)) {
    errors.push(`${where}.grid.columns must be non-empty strings.`);
    return null;
  }
  if (typeof input.rows !== 'number' || !Number.isInteger(input.rows) || input.rows < 1 || input.rows > 40) {
    errors.push(`${where}.grid.rows must be an integer from 1 to 40.`);
    return null;
  }
  return { columns: input.columns as string[], rows: input.rows };
}

function parseStats(input: Record<string, unknown>, where: string, errors: string[]): StatsPage | null {
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  if (!Array.isArray(input.columns) || input.columns.length < 1 || input.columns.length > 8) {
    errors.push(`${where}.columns must be 1 to 8 labels.`);
    return null;
  }
  if (input.columns.some((column) => typeof column !== 'string' || column.trim().length === 0)) {
    errors.push(`${where}.columns must be non-empty strings.`);
    return null;
  }
  if (typeof input.rows !== 'number' || !Number.isInteger(input.rows) || input.rows < 1 || input.rows > 40) {
    errors.push(`${where}.rows must be an integer from 1 to 40.`);
    return null;
  }
  return { type: 'stats', heading, columns: input.columns as string[], rows: input.rows };
}

function parseNotes(input: Record<string, unknown>, where: string, errors: string[]): NotesPage | null {
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  return { type: 'notes', heading };
}

function parseChecklist(input: Record<string, unknown>, where: string, errors: string[]): ChecklistPage | null {
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 40) {
    errors.push(`${where}.items must contain 1 to 40 labels.`);
    return null;
  }
  if (input.items.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    errors.push(`${where}.items must be non-empty strings.`);
    return null;
  }
  return { type: 'checklist', heading, items: input.items as string[] };
}

function parsePaper(input: Record<string, unknown>, where: string, errors: string[]): PaperPage | null {
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  if (typeof input.style !== 'string' || !(PAPER_STYLES as readonly string[]).includes(input.style)) {
    errors.push(`${where}.style must be lined, dot, or grid.`);
    return null;
  }
  return { type: 'paper', style: input.style as PaperPage['style'], heading };
}

function parseHabit(input: Record<string, unknown>, where: string, errors: string[]): HabitPage | null {
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  if (!Array.isArray(input.habits) || input.habits.length < 1 || input.habits.length > 16) {
    errors.push(`${where}.habits must contain 1 to 16 labels.`);
    return null;
  }
  if (input.habits.some((habit) => typeof habit !== 'string' || habit.trim().length === 0)) {
    errors.push(`${where}.habits must be non-empty strings.`);
    return null;
  }
  if (typeof input.days !== 'number' || !Number.isInteger(input.days) || input.days < 1 || input.days > 31) {
    errors.push(`${where}.days must be an integer from 1 to 31.`);
    return null;
  }
  return { type: 'habit', heading, habits: input.habits as string[], days: input.days };
}

function parseCheatSheet(input: Record<string, unknown>, where: string, errors: string[]): CheatSheetPage | null {
  const heading = optionalText(input, 'heading', where, errors);
  if (heading === null) return null;
  if (!Array.isArray(input.sections) || input.sections.length === 0 || input.sections.length > 8) {
    errors.push(`${where}.sections must contain 1 to 8 sections.`);
    return null;
  }
  const sections: CheatSheetPage['sections'] = [];
  for (let sectionIndex = 0; sectionIndex < input.sections.length; sectionIndex += 1) {
    const section = input.sections[sectionIndex];
    if (!isRecord(section) || typeof section.title !== 'string' || section.title.trim().length === 0) {
      errors.push(`${where}.sections[${sectionIndex}].title must be a non-empty string.`);
      return null;
    }
    if (!Array.isArray(section.rows) || section.rows.length === 0 || section.rows.length > 20) {
      errors.push(`${where}.sections[${sectionIndex}].rows must contain 1 to 20 rows.`);
      return null;
    }
    const rows: CheatSheetPage['sections'][number]['rows'] = [];
    for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex += 1) {
      const row = section.rows[rowIndex];
      if (!isRecord(row) || typeof row.label !== 'string' || typeof row.value !== 'string') {
        errors.push(`${where}.sections[${sectionIndex}].rows[${rowIndex}] needs a label and a value.`);
        return null;
      }
      if (row.label.trim().length === 0 || row.value.trim().length === 0) {
        errors.push(`${where}.sections[${sectionIndex}].rows[${rowIndex}] label and value must be non-empty.`);
        return null;
      }
      rows.push({ label: row.label, value: row.value });
    }
    sections.push({ title: section.title, rows });
  }
  return { type: 'cheatsheet', heading, sections };
}

export function pageKindLabel(page: BookPageBody): string {
  switch (page.type) {
    case 'title':
      return 'Title page';
    case 'copyright':
      return 'Copyright page';
    case 'log':
      return page.dated ? 'Dated log page' : 'Undated log page';
    case 'stats':
      return 'Stats tracker';
    case 'notes':
      return 'Notes page';
    case 'cheatsheet':
      return 'Cheat-sheet page';
    case 'checklist':
      return 'Checklist page';
    case 'paper':
      if (page.style === 'lined') return 'Lined page';
      if (page.style === 'dot') return 'Dot-grid page';
      return 'Square-grid page';
    case 'habit':
      return 'Habit tracker';
    default: {
      const unreachable: never = page;
      return unreachable;
    }
  }
}

const CHECK_METADATA = {
  title: 'Template Check',
  subtitle: 'Placeholder',
  description: 'Placeholder description for the low-content template check. Interior pages are fill-in templates.',
  categories: [{ label: 'NON-CLASSIFIABLE', bisac: 'NON000000' }],
  keywords: ['alpha log', 'bravo log', 'charlie log', 'delta log', 'echo log', 'foxtrot log', 'golf log'],
};

/**
 * Locks the low-content path: every catalog id resolves, a template book reaches
 * the 24-page minimum, a free KDP ISBN is rejected, and a standard interior
 * still validates without an ISBN choice.
 */
export function assertLowContentPipeline(): void {
  const failures: string[] = [];
  for (const id of LOW_CONTENT_TEMPLATE_IDS) {
    const body = lowContentTemplate(id);
    if (!body || body.type.length === 0) failures.push(`Template ${id} did not resolve.`);
  }

  const ready = evaluateManifest('low-content-check', {
    id: 'low-content-check',
    market: 'generic',
    format: 'kdp-logbook',
    content: 'low-content',
    isbn: 'none',
    trim: '5.5x8.5',
    bleed: true,
    paper: 'white',
    ink: 'black',
    kdp: CHECK_METADATA,
    pages: [
      { template: 'title' },
      { template: 'copyright' },
      { template: 'mileage-log', repeat: 20, heading: 'Placeholder mileage check' },
      { template: 'lined', repeat: 2 },
    ],
  });
  if (ready.errors.length > 0) failures.push(`Template book failed: ${ready.errors.join(' ')}`);
  if (ready.pages.length !== 24) failures.push(`Template book expanded to ${ready.pages.length} pages, expected 24.`);
  if (ready.geometry?.pageWidthPt !== 405 || ready.geometry.pageHeightPt !== 630) {
    failures.push('Template book did not use the 5.5x8.5 with-bleed page size.');
  }
  const mileage = ready.pages[2];
  if (!mileage || mileage.type !== 'log' || mileage.heading !== 'Placeholder mileage check' || mileage.entryCount !== 20) {
    failures.push('Template heading override or repeat count did not apply.');
  }
  if (ready.content !== 'low-content' || ready.manifest?.content !== 'low-content' || ready.manifest.isbn !== 'none') {
    failures.push('Template book did not record the low-content ISBN choice.');
  }

  const freeIsbn = evaluateManifest('low-content-check', {
    id: 'low-content-check',
    market: 'generic',
    format: 'kdp-logbook',
    content: 'low-content',
    isbn: 'kdp',
    trim: '6x9',
    bleed: true,
    paper: 'white',
    ink: 'black',
    kdp: CHECK_METADATA,
    pages: [{ template: 'lined', repeat: 24 }],
  });
  if (!freeIsbn.errors.some((error) => error.includes('free KDP ISBN'))) {
    failures.push('A free KDP ISBN was accepted for a low-content book.');
  }

  const standard = evaluateManifest('standard-check', {
    id: 'standard-check',
    market: 'generic',
    format: 'kdp-cheatsheet',
    content: 'standard',
    trim: '6x9',
    bleed: false,
    paper: 'cream',
    ink: 'black',
    kdp: CHECK_METADATA,
    pages: [{ type: 'notes', heading: 'Placeholder notes', repeat: 24 }],
  });
  if (standard.errors.length > 0 || standard.manifest?.content !== 'standard') {
    failures.push(`Standard interior failed: ${standard.errors.join(' ') || 'no manifest'}`);
  }
  if (standard.geometry?.pageWidthPt !== 432) {
    failures.push('Standard interior did not keep the no-bleed 6x9 page size.');
  }

  const standardIsbn = evaluateManifest('standard-check', {
    id: 'standard-check',
    market: 'generic',
    format: 'kdp-journal',
    content: 'standard',
    isbn: 'none',
    trim: '6x9',
    bleed: true,
    paper: 'white',
    ink: 'black',
    kdp: CHECK_METADATA,
    pages: [{ type: 'notes', heading: 'Placeholder notes', repeat: 24 }],
  });
  if (!standardIsbn.errors.some((error) => error.includes('Remove isbn'))) {
    failures.push('A standard interior accepted a low-content ISBN choice.');
  }

  if (failures.length > 0) {
    throw new Error(failures.join('\n'));
  }
}
