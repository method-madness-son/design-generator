import fs from 'fs';
import path from 'path';
import type {
  LcInk,
  LcIsbn,
  LcMarket,
  LcPageConfig,
  LcPageRef,
  LcPaper,
  LcProjectFile,
  LcTrimId,
  LowContentManifest,
  LcOutlineEntry,
  RenderedLcPage,
} from '@/types/lowcontent';
import { LC_INKS, LC_MARKETS, LC_PAPERS, LC_TRIMS } from '@/types/lowcontent';
import { copyGuard } from '@/lib/lowcontent/guard';
import { validateLcMetadata } from '@/lib/lowcontent/metadata';
import {
  STANDARD_COLOR_SPINE_CONFLICT,
  buildCoverGeometry,
  buildInteriorGeometry,
  gutterInches,
  pageLimit,
  spineFactor,
  type CoverGeometry,
  type InteriorGeometry,
} from '@/lib/lowcontent/specs';
import { fontIssue, getMarket } from '@/lib/theme';
import { resolveInteriorTheme } from '@/lib/lowcontent/theme';
import { buildOutline, expandPages, isTemplateId, pageCopy } from '@/lib/lowcontent/templates';
import type { ResolvedInteriorTheme } from '@/types/lowcontent';

const ROOT = path.join(process.cwd(), 'lowcontent');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

export type LoadedLowContentBook = {
  id: string;
  projectSlug: string | null;
  manifest: LowContentManifest | null;
  project: LcProjectFile | null;
  pages: RenderedLcPage[];
  outline: LcOutlineEntry[];
  geometry: InteriorGeometry | null;
  cover: CoverGeometry | null;
  theme: ResolvedInteriorTheme | null;
  errors: string[];
  warnings: string[];
};

export function listProjectSlugs(): string[] {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => SLUG.test(name))
    .sort();
}

export function getBookIds(): string[] {
  const ids: string[] = [];
  for (const slug of listProjectSlugs()) {
    const dir = path.join(ROOT, slug);
    for (const file of fs.readdirSync(dir)) {
      if (file === 'project.json' || !file.endsWith('.json')) continue;
      const id = file.replace(/\.json$/, '');
      if (SLUG.test(id)) ids.push(id);
    }
  }
  return ids.sort();
}

export function findBookFile(id: string): { projectSlug: string; filePath: string } | null {
  if (!SLUG.test(id)) return null;
  for (const slug of listProjectSlugs()) {
    const filePath = path.join(ROOT, slug, `${id}.json`);
    if (fs.existsSync(filePath)) return { projectSlug: slug, filePath };
  }
  return null;
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function loadProject(slug: string): { project: LcProjectFile | null; errors: string[] } {
  const filePath = path.join(ROOT, slug, 'project.json');
  if (!fs.existsSync(filePath)) return { project: null, errors: [`${slug}/project.json is missing.`] };
  let raw: unknown;
  try {
    raw = readJson(filePath);
  } catch {
    return { project: null, errors: [`${slug}/project.json is not valid JSON.`] };
  }
  if (!isRecord(raw)) return { project: null, errors: [`${slug}/project.json must be an object.`] };
  const errors: string[] = [];
  if (raw.id !== slug) errors.push(`project.json id must be "${slug}".`);
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) errors.push('project.json title is required.');
  if (typeof raw.description !== 'string' || raw.description.trim().length === 0) {
    errors.push('project.json description is required.');
  }
  if (!isOneOf(raw.market, LC_MARKETS)) errors.push(`project.json market must be one of ${LC_MARKETS.join(', ')}.`);
  if (errors.length > 0 || typeof raw.title !== 'string' || typeof raw.description !== 'string' || !isOneOf(raw.market, LC_MARKETS)) {
    return { project: null, errors };
  }
  return { project: { id: slug, title: raw.title, description: raw.description, market: raw.market }, errors: [] };
}

function parsePageRef(input: unknown, index: number, errors: string[]): LcPageRef | null {
  if (!isRecord(input)) {
    errors.push(`pages[${index}] must be an object.`);
    return null;
  }
  if (typeof input.template !== 'string' || !isTemplateId(input.template)) {
    errors.push(`pages[${index}].template is not a known low-content template.`);
    return null;
  }
  if (typeof input.repeat !== 'number' || !Number.isInteger(input.repeat) || input.repeat < 1) {
    errors.push(`pages[${index}].repeat must be an integer of at least 1.`);
    return null;
  }
  let config: LcPageConfig | undefined;
  if (input.config !== undefined) {
    if (!isRecord(input.config)) {
      errors.push(`pages[${index}].config must be an object.`);
      return null;
    }
    config = parseConfig(input.config, index, errors);
  }
  return { template: input.template, repeat: input.repeat, config };
}

function parseConfig(input: Record<string, unknown>, index: number, errors: string[]): LcPageConfig {
  const config: LcPageConfig = {};
  if (input.heading !== undefined) {
    if (typeof input.heading !== 'string') errors.push(`pages[${index}].config.heading must be a string.`);
    else config.heading = input.heading;
  }
  if (input.dated !== undefined) {
    if (typeof input.dated !== 'boolean') errors.push(`pages[${index}].config.dated must be a boolean.`);
    else config.dated = input.dated;
  }
  if (input.note !== undefined) {
    if (typeof input.note !== 'string') errors.push(`pages[${index}].config.note must be a string.`);
    else config.note = input.note;
  }
  if (input.rows !== undefined) {
    if (typeof input.rows !== 'number' || !Number.isInteger(input.rows) || input.rows < 1 || input.rows > 40) {
      errors.push(`pages[${index}].config.rows must be an integer from 1 to 40.`);
    } else config.rows = input.rows;
  }
  if (input.days !== undefined) {
    if (typeof input.days !== 'number' || !Number.isInteger(input.days) || input.days < 1 || input.days > 31) {
      errors.push(`pages[${index}].config.days must be an integer from 1 to 31.`);
    } else config.days = input.days;
  }
  config.columns = parseStringList(input.columns, `pages[${index}].config.columns`, errors);
  config.prompts = parseStringList(input.prompts, `pages[${index}].config.prompts`, errors);
  config.habits = parseStringList(input.habits, `pages[${index}].config.habits`, errors);
  if (input.fields !== undefined) {
    if (!Array.isArray(input.fields)) errors.push(`pages[${index}].config.fields must be an array.`);
    else {
      config.fields = [];
      input.fields.forEach((field, fieldIndex) => {
        if (!isRecord(field) || typeof field.label !== 'string' || field.label.trim().length === 0) {
          errors.push(`pages[${index}].config.fields[${fieldIndex}].label is required.`);
          return;
        }
        const lines = field.lines === undefined ? 1 : field.lines;
        if (typeof lines !== 'number' || !Number.isInteger(lines) || lines < 1 || lines > 12) {
          errors.push(`pages[${index}].config.fields[${fieldIndex}].lines must be 1–12.`);
          return;
        }
        config.fields?.push({ label: field.label, lines });
      });
    }
  }
  return config;
}

function parseStringList(input: unknown, label: string, errors: string[]): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input) || input.some((entry) => typeof entry !== 'string')) {
    errors.push(`${label} must be an array of strings.`);
    return undefined;
  }
  return input;
}

export function loadBook(id: string): LoadedLowContentBook | null {
  const located = findBookFile(id);
  if (!located) return null;
  const { project, errors: projectErrors } = loadProject(located.projectSlug);
  const errors = [...projectErrors];
  const warnings: string[] = [];
  let raw: unknown;
  try {
    raw = readJson(located.filePath);
  } catch {
    return empty(id, located.projectSlug, project, [`${id}.json is not valid JSON.`]);
  }
  if (!isRecord(raw)) return empty(id, located.projectSlug, project, ['Manifest must be an object.']);

  if (raw.id !== id) errors.push(`id must match the filename (${id}).`);
  if (raw.projectSlug !== located.projectSlug) errors.push(`projectSlug must be "${located.projectSlug}".`);
  if (project && raw.project !== project.title) errors.push(`project must match project.json title "${project.title}".`);
  if (!isOneOf(raw.market, LC_MARKETS)) errors.push(`market must be one of ${LC_MARKETS.join(', ')}.`);
  if (project && isOneOf(raw.market, LC_MARKETS) && raw.market !== project.market) {
    errors.push(`market must match project.json (${project.market}).`);
  }
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) errors.push('title is required.');
  if (typeof raw.subtitle !== 'string') errors.push('subtitle must be a string.');
  if (!isOneOf(raw.trim, LC_TRIMS)) errors.push(`trim must be one of ${LC_TRIMS.join(', ')}.`);
  if (!isOneOf(raw.paper, LC_PAPERS)) errors.push(`paper must be one of ${LC_PAPERS.join(', ')}.`);
  if (!isOneOf(raw.ink, LC_INKS)) errors.push(`ink must be one of ${LC_INKS.join(', ')}.`);
  if (typeof raw.bleed !== 'boolean') errors.push('bleed must be true or false.');
  if (raw.author !== null) errors.push('author must be null. This pipeline does not store a pen name.');
  if (typeof raw.pageCount !== 'number' || !Number.isInteger(raw.pageCount)) errors.push('pageCount must be an integer.');

  const themeRef = parseThemeRef(raw.theme, errors);
  const pageRefs: LcPageRef[] = [];
  if (!Array.isArray(raw.pages) || raw.pages.length === 0) errors.push('pages must be a non-empty array.');
  else {
    raw.pages.forEach((entry, index) => {
      const page = parsePageRef(entry, index, errors);
      if (page) pageRefs.push(page);
    });
  }

  const metadataReport = validateLcMetadata(raw.kdp);
  errors.push(...metadataReport.errors);
  warnings.push(...metadataReport.warnings);

  const market = isOneOf(raw.market, LC_MARKETS) ? raw.market : null;
  const trim = isOneOf(raw.trim, LC_TRIMS) ? raw.trim : null;
  const paper = isOneOf(raw.paper, LC_PAPERS) ? raw.paper : null;
  const ink = isOneOf(raw.ink, LC_INKS) ? raw.ink : null;
  const bleed = typeof raw.bleed === 'boolean' ? raw.bleed : null;
  const declaredCount = typeof raw.pageCount === 'number' && Number.isInteger(raw.pageCount) ? raw.pageCount : null;

  let pages: RenderedLcPage[] = [];
  if (pageRefs.length > 0 && errors.length === 0) {
    pages = expandPages(pageRefs);
  } else if (pageRefs.length > 0 && pageRefs.every((page) => page.repeat >= 1)) {
    pages = expandPages(pageRefs);
  }

  if (declaredCount !== null && pages.length > 0 && declaredCount !== pages.length) {
    errors.push(`pageCount is ${declaredCount}, but the templates expand to ${pages.length} pages.`);
  }
  const pageCount = pages.length;
  if (pageCount > 0 && pageCount % 2 !== 0) {
    warnings.push('Page count is odd. KDP rounds the printed count up to an even number, which can add a page.');
  }

  if (trim && paper && ink && pageCount > 0) {
    const limit = pageLimit(trim, ink, paper);
    if (!limit) {
      errors.push(`${ink} ink is not offered on ${paper} paper for ${trim}. Color interiors in the KDP table are white paper only.`);
    } else if (pageCount < limit.min || pageCount > limit.max) {
      errors.push(`Page count ${pageCount} is outside ${limit.min}–${limit.max} for ${trim}, ${ink}, ${paper} paper.`);
    }
    if (gutterInches(pageCount) === null) errors.push(`No gutter band for ${pageCount} pages.`);
    if (spineFactor(ink, paper) === null) errors.push(`No spine factor for ${ink} on ${paper} paper.`);
    if (ink === 'standard-color') warnings.push(STANDARD_COLOR_SPINE_CONFLICT);
  }

  let theme: ResolvedInteriorTheme | null = null;
  if (themeRef && market) {
    const displayIssue = fontIssue(themeRef.displayFont);
    const supportIssue = fontIssue(themeRef.supportingFont);
    if (displayIssue) errors.push(displayIssue);
    if (supportIssue) errors.push(supportIssue);
    if (!displayIssue && !supportIssue) {
      try {
        theme = resolveInteriorTheme(themeRef.palette, themeRef.displayFont, themeRef.supportingFont, market);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    const status = getMarket(market)?.status;
    if (status && status !== 'from_guide') {
      warnings.push(`Market "${market}" theme override is ${status}. Palette hexes are design picks, not sales data.`);
    }
    if (theme?.marketStatus && theme.marketStatus.includes('unverified')) {
      warnings.push(`Palette "${theme.paletteId}" is marked ${theme.marketStatus}.`);
    }
  }

  const copyText = [
    typeof raw.title === 'string' ? raw.title : '',
    typeof raw.subtitle === 'string' ? raw.subtitle : '',
    typeof raw.project === 'string' ? raw.project : '',
    metadataReport.metadata?.title ?? '',
    metadataReport.metadata?.subtitle ?? '',
    metadataReport.metadata?.description ?? '',
    ...(metadataReport.metadata?.keywords ?? []),
    ...(metadataReport.metadata?.categories ?? []).map((category) => category.label),
    ...pages.flatMap((page) => pageCopy(page)),
  ].join('\n');
  const guarded = copyGuard(copyText);
  errors.push(...guarded.errors);
  warnings.push(...guarded.warnings);

  if (bleed === false) {
    warnings.push('Interior bleed is off. A background that stops at the trim can leave a white edge after cutting.');
  }

  const geometry =
    trim && paper && ink && pageCount >= 24 && pageCount <= 828 && gutterInches(pageCount) !== null && bleed !== null
      ? buildInteriorGeometry(trim, bleed, pageCount, paper, ink)
      : null;
  const cover =
    trim && paper && ink && pageCount > 0 && spineFactor(ink, paper) !== null
      ? safeCover(trim, pageCount, paper, ink)
      : null;

  const manifest =
    errors.length === 0 &&
    metadataReport.metadata &&
    theme &&
    themeRef &&
    market &&
    trim &&
    paper &&
    ink &&
    bleed !== null &&
    declaredCount !== null &&
    typeof raw.title === 'string' &&
    typeof raw.subtitle === 'string' &&
    typeof raw.project === 'string'
      ? ({
          id,
          project: raw.project,
          projectSlug: located.projectSlug,
          market,
          title: raw.title,
          subtitle: raw.subtitle,
          trim,
          pageCount: declaredCount,
          paper,
          ink,
          bleed,
          theme: themeRef,
          author: null,
          pages: pageRefs,
          kdp: metadataReport.metadata,
        } satisfies LowContentManifest)
      : null;

  return {
    id,
    projectSlug: located.projectSlug,
    manifest,
    project,
    pages: manifest ? pages : pages,
    outline: buildOutline(pages),
    geometry: manifest ? geometry : geometry,
    cover: manifest ? cover : cover,
    theme,
    errors,
    warnings,
  };
}

function safeCover(trim: LcTrimId, pageCount: number, paper: LcPaper, ink: LcInk): CoverGeometry | null {
  try {
    return buildCoverGeometry(trim, pageCount, paper, ink);
  } catch {
    return null;
  }
}

function parseThemeRef(input: unknown, errors: string[]): LowContentManifest['theme'] | null {
  if (!isRecord(input)) {
    errors.push('theme must be an object with palette, displayFont, and supportingFont.');
    return null;
  }
  const palette = typeof input.palette === 'string' ? input.palette : null;
  const displayFont = typeof input.displayFont === 'string' ? input.displayFont : null;
  const supportingFont = typeof input.supportingFont === 'string' ? input.supportingFont : null;
  if (!palette) errors.push('theme.palette must be a palette name from the global theme.');
  if (!displayFont) errors.push('theme.displayFont must be a font family name.');
  if (!supportingFont) errors.push('theme.supportingFont must be a font family name.');
  if (!palette || !displayFont || !supportingFont) return null;
  return { palette, displayFont, supportingFont };
}

function empty(id: string, projectSlug: string, project: LcProjectFile | null, errors: string[]): LoadedLowContentBook {
  return {
    id,
    projectSlug,
    manifest: null,
    project,
    pages: [],
    outline: [],
    geometry: null,
    cover: null,
    theme: null,
    errors,
    warnings: [],
  };
}

export function loadBooks(): LoadedLowContentBook[] {
  return getBookIds().map((id) => loadBook(id)).filter((book): book is LoadedLowContentBook => book !== null);
}

export function loadProjects(): {
  slug: string;
  project: LcProjectFile | null;
  errors: string[];
  books: LoadedLowContentBook[];
}[] {
  return listProjectSlugs().map((slug) => {
    const { project, errors } = loadProject(slug);
    const books = getBookIds()
      .filter((id) => findBookFile(id)?.projectSlug === slug)
      .map((id) => loadBook(id))
      .filter((book): book is LoadedLowContentBook => book !== null);
    return { slug, project, errors, books };
  });
}

export function assertValidatorFixtures(): void {
  const banned = fontIssue("Keep on Truckin'");
  if (!banned) throw new Error("Banned font Keep on Truckin' should fail.");
  const comic = fontIssue('Comic Sans MS');
  if (!comic) throw new Error('Unlisted font should fail.');
  const allowed = fontIssue('Work Sans');
  if (allowed) throw new Error(`Work Sans should be allowed (${allowed}).`);
  const graduate = fontIssue('Graduate');
  if (graduate) throw new Error(`Graduate should be allowed (${graduate}).`);

  const badCopy = copyGuard('This NHL puzzle piece cures ADHD symptoms.');
  if (badCopy.errors.length < 2) throw new Error('Copy guard should flag marks and medical claims.');
  const okCopy = copyGuard('An ADHD-friendly planner for ADHDers. Write the week.');
  if (okCopy.errors.length > 0) throw new Error(`ADHD identity copy should pass (${okCopy.errors.join('; ')}).`);
}

// Re-export the isbn type so scripts can narrow without a second import cycle.
export type { LcIsbn, LcMarket, LcInk, LcPaper };
