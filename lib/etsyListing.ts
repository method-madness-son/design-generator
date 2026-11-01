/**
 * The one check for a poster's `etsy` and `research` blocks. Used by `npm run listing:check` (the
 * research agent's gate) and by the Printify sync, so an approved listing is an uploadable one.
 *
 * Etsy limits match lib/mugDesigns.ts: title ≤ 140, 1–13 tags, tags ≤ 20 characters of letters,
 * numbers, spaces, ' and -, not starting with punctuation, unique ignoring case.
 */
import type { PosterFile, PosterResearch } from '@/types/poster';

export const ETSY_TITLE_LENGTH = 140;
export const ETSY_TAG_LIMIT = 13;
export const ETSY_TAG_LENGTH = 20;
const TAG_PATTERN = /^[0-9A-Za-z][0-9A-Za-z '-]*$/;
const ETSY_KEYS = ['title', 'description', 'tags', 'category'] as const;
const RESEARCH_KEYS = ['researchedAt', 'method', 'primaryKeyword', 'etsy', 'amazon', 'sources', 'notes'] as const;
const MARKET_KEYS = ['searchPhrases', 'competitorNotes', 'priceRange'] as const;
// Research older than this gets a warning so seasonal or trending phrases are revisited.
const STALE_DAYS = 180;

export type ListingReport = { errors: string[]; warnings: string[] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function unknownKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): string[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${label} has unknown field "${key}" (allowed: ${allowed.join(', ')}).`);
}

export function checkEtsy(etsy: unknown, report: ListingReport): void {
  if (!isObject(etsy)) {
    report.errors.push('Missing "etsy" block { title, description, tags, category }.');
    return;
  }
  report.errors.push(...unknownKeys(etsy, ETSY_KEYS, 'etsy'));
  const { title, description, tags, category } = etsy;

  if (typeof title !== 'string' || !title.trim()) report.errors.push('etsy.title must be a non-empty string.');
  else {
    if (title.length > ETSY_TITLE_LENGTH) report.errors.push(`etsy.title is ${title.length} characters; the limit is ${ETSY_TITLE_LENGTH}.`);
    if (title !== title.trim() || /\s{2,}/.test(title)) report.errors.push('etsy.title has leading, trailing, or double spaces.');
    for (const symbol of ['%', ':', '&']) {
      if (title.split(symbol).length - 1 > 1) report.warnings.push(`etsy.title uses "${symbol}" more than once; Etsy may reject it.`);
    }
    const shouting = title.split(/\s+/).filter((word) => word.length > 1 && /^[A-Z0-9]+$/.test(word) && /[A-Z]/.test(word));
    if (shouting.length > 3) report.warnings.push(`etsy.title has ${shouting.length} all-caps words; Etsy limits these.`);
    const words = title.toLowerCase().match(/[a-z0-9']+/g) ?? [];
    const repeated = [...new Set(words.filter((word) => word.length > 3 && words.filter((other) => other === word).length > 2))];
    if (repeated.length > 0) report.warnings.push(`etsy.title repeats ${repeated.join(', ')} 3+ times; reads as keyword stuffing.`);
  }

  if (typeof description !== 'string' || !description.trim()) report.errors.push('etsy.description must be a non-empty string.');
  if (typeof category !== 'string' || !category.trim()) report.errors.push('etsy.category must be a non-empty string.');

  if (!isStringArray(tags)) {
    report.errors.push('etsy.tags must be an array of strings.');
    return;
  }
  if (tags.length === 0 || tags.length > ETSY_TAG_LIMIT) report.errors.push(`etsy.tags has ${tags.length}; Etsy allows 1–${ETSY_TAG_LIMIT}.`);
  else if (tags.length < ETSY_TAG_LIMIT) report.warnings.push(`Only ${tags.length}/${ETSY_TAG_LIMIT} tags used.`);
  for (const tag of tags) {
    if (tag.length === 0 || tag.length > ETSY_TAG_LENGTH) report.errors.push(`Tag "${tag}" is ${tag.length} characters; the limit is ${ETSY_TAG_LENGTH}.`);
    else if (!TAG_PATTERN.test(tag)) report.errors.push(`Tag "${tag}" has a character Etsy does not allow (letters, numbers, spaces, ' and - only).`);
    if (tag !== tag.trim()) report.errors.push(`Tag "${tag}" has leading or trailing spaces.`);
  }
  if (new Set(tags.map((tag) => tag.toLowerCase())).size !== tags.length) report.errors.push('etsy.tags must be unique (ignoring case).');
}

function checkMarket(value: unknown, label: string, report: ListingReport): void {
  if (!isObject(value)) {
    report.errors.push(`research.${label} must be { searchPhrases, competitorNotes, priceRange? }.`);
    return;
  }
  report.errors.push(...unknownKeys(value, MARKET_KEYS, `research.${label}`));
  if (!isStringArray(value.searchPhrases) || value.searchPhrases.length === 0) {
    report.errors.push(`research.${label}.searchPhrases must list at least one phrase.`);
  }
  if (!isStringArray(value.competitorNotes)) report.errors.push(`research.${label}.competitorNotes must be an array of strings.`);
  if (value.priceRange !== undefined) {
    const range = value.priceRange;
    const ok =
      isObject(range) &&
      typeof range.min === 'number' &&
      typeof range.max === 'number' &&
      range.min >= 0 &&
      range.min <= range.max &&
      typeof range.currency === 'string' &&
      /^[A-Z]{3}$/.test(range.currency);
    if (!ok) report.errors.push(`research.${label}.priceRange must be { min, max, currency: "USD" } with min ≤ max.`);
  }
}

export function checkResearch(research: unknown, report: ListingReport, today = new Date()): void {
  if (research === undefined) {
    report.warnings.push('No "research" block; this listing has not been through the research agent.');
    return;
  }
  if (!isObject(research)) {
    report.errors.push('"research" must be an object.');
    return;
  }
  report.errors.push(...unknownKeys(research, RESEARCH_KEYS, 'research'));
  const r = research as Partial<PosterResearch> & Record<string, unknown>;
  if (typeof r.researchedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.researchedAt) || Number.isNaN(Date.parse(r.researchedAt))) {
    report.errors.push('research.researchedAt must be a YYYY-MM-DD date.');
  } else {
    const age = (today.getTime() - Date.parse(r.researchedAt)) / 86_400_000;
    if (age > STALE_DAYS) report.warnings.push(`Research is ${Math.floor(age)} days old; consider refreshing.`);
  }
  if (r.method !== 'pages' && r.method !== 'search-results') report.errors.push('research.method must be "pages" or "search-results".');
  if (typeof r.primaryKeyword !== 'string' || !r.primaryKeyword.trim()) report.errors.push('research.primaryKeyword must be a non-empty string.');
  checkMarket(r.etsy, 'etsy', report);
  checkMarket(r.amazon, 'amazon', report);
  if (!isStringArray(r.sources) || r.sources.length === 0) report.errors.push('research.sources must list at least one URL.');
  else for (const source of r.sources) if (!/^https?:\/\/\S+$/.test(source)) report.errors.push(`research.sources entry "${source}" is not a URL.`);
  if (r.notes !== undefined && typeof r.notes !== 'string') report.errors.push('research.notes must be a string.');
}

export function checkListing(poster: PosterFile, today?: Date): ListingReport {
  const report: ListingReport = { errors: [], warnings: [] };
  checkEtsy(poster.etsy, report);
  checkResearch(poster.research, report, today);
  // The primary keyword should lead the title, where Etsy and buyers weigh it most.
  if (poster.research?.primaryKeyword && poster.etsy?.title) {
    const lead = poster.etsy.title.slice(0, 60).toLowerCase();
    const words = poster.research.primaryKeyword.toLowerCase().split(/\s+/);
    if (!words.every((word) => lead.includes(word))) {
      report.warnings.push(`Primary keyword "${poster.research.primaryKeyword}" is not in the first 60 characters of the title.`);
    }
  }
  return report;
}
