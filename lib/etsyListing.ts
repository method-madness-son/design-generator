/**
 * The one check for a poster's `etsy` and `research` blocks, used by `npm run listing:check` (the
 * research agent's gate), the inventory page, and the Printify sync.
 *
 * Errors are Etsy's hard rules and the structure the upload needs: title ≤ 140, 1–13 tags of ≤ 20
 * letters, numbers, spaces, ' and - (unique ignoring case). Warnings are listing-quality advice;
 * `--strict` treats them as errors.
 */
import { POSTER_SIZES, type PosterSizeName } from '@/lib/posterSizes';
import type { PosterFile } from '@/types/poster';

const TITLE_LENGTH = 140;
const TAG_LIMIT = 13;
const TAG_LENGTH = 20;
const TAG_PATTERN = /^[0-9A-Za-z][0-9A-Za-z '-]*$/;
const ETSY_KEYS = ['title', 'description', 'tags', 'category'];
// Research older than this gets a warning so seasonal or trending phrases are revisited.
const STALE_DAYS = 180;

export type ListingReport = { errors: string[]; warnings: string[] };

function checkEtsy(etsy: PosterFile['etsy'], { errors, warnings }: ListingReport): void {
  if (!etsy) {
    errors.push('Missing "etsy" block { title, description, tags, category }.');
    return;
  }
  for (const key of Object.keys(etsy)) if (!ETSY_KEYS.includes(key)) errors.push(`etsy has unknown field "${key}".`);
  const { title, description, tags, category } = etsy;

  if (typeof title !== 'string' || !title.trim()) errors.push('etsy.title must be a non-empty string.');
  else {
    if (title.length > TITLE_LENGTH) errors.push(`etsy.title is ${title.length} characters; the limit is ${TITLE_LENGTH}.`);
    if (title !== title.trim() || /\s{2,}/.test(title)) errors.push('etsy.title has leading, trailing, or double spaces.');
    for (const symbol of ['%', ':', '&']) {
      if (title.split(symbol).length > 2) warnings.push(`etsy.title uses "${symbol}" more than once; Etsy may reject it.`);
    }
    const words = title.toLowerCase().match(/[a-z0-9']+/g) ?? [];
    const repeated = [...new Set(words.filter((word) => word.length > 3 && words.filter((other) => other === word).length > 2))];
    if (repeated.length > 0) warnings.push(`etsy.title repeats ${repeated.join(', ')} 3+ times; reads as keyword stuffing.`);
  }
  if (typeof description !== 'string' || !description.trim()) errors.push('etsy.description must be a non-empty string.');
  if (typeof category !== 'string' || !category.trim()) errors.push('etsy.category must be a non-empty string.');

  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
    errors.push('etsy.tags must be an array of strings.');
    return;
  }
  if (tags.length === 0 || tags.length > TAG_LIMIT) errors.push(`etsy.tags has ${tags.length}; Etsy allows 1–${TAG_LIMIT}.`);
  else if (tags.length < TAG_LIMIT) warnings.push(`Only ${tags.length}/${TAG_LIMIT} tags used.`);
  for (const tag of tags) {
    if (tag.length === 0 || tag.length > TAG_LENGTH) errors.push(`Tag "${tag}" is ${tag.length} characters; the limit is ${TAG_LENGTH}.`);
    else if (!TAG_PATTERN.test(tag) || tag !== tag.trim()) errors.push(`Tag "${tag}" has a character Etsy does not allow (letters, numbers, spaces, ' and - only).`);
  }
  if (new Set(tags.map((tag) => tag.toLowerCase())).size !== tags.length) errors.push('etsy.tags must be unique (ignoring case).');
}

// The research block is never uploaded; only what the agent's audit trail relies on is checked.
function checkResearch(poster: PosterFile, { errors, warnings }: ListingReport, today: Date): void {
  const research = poster.research;
  if (!research) {
    warnings.push('No "research" block; this listing has not been through the research agent.');
    return;
  }
  const age = (today.getTime() - Date.parse(research.researchedAt)) / 86_400_000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(research.researchedAt) || Number.isNaN(age)) errors.push('research.researchedAt must be a YYYY-MM-DD date.');
  else if (age > STALE_DAYS) warnings.push(`Research is ${Math.floor(age)} days old; consider refreshing.`);
  if (!research.primaryKeyword?.trim()) errors.push('research.primaryKeyword is empty.');
  if (!research.sources?.length || !research.sources.every((source) => /^https?:\/\/\S+$/.test(source))) {
    errors.push('research.sources must list at least one URL.');
  }
  // The primary keyword should lead the title, where Etsy and buyers weigh it most.
  const lead = poster.etsy?.title.slice(0, 60).toLowerCase() ?? '';
  if (research.primaryKeyword && !research.primaryKeyword.toLowerCase().split(/\s+/).every((word) => lead.includes(word))) {
    warnings.push(`Primary keyword "${research.primaryKeyword}" is not in the first 60 characters of the title.`);
  }
}

// savedSizes: the sizes saved in the studio. A saved poster must have a listing, and the listing
// should not promise a size that has not been saved.
export function checkListing(poster: PosterFile, savedSizes: PosterSizeName[] = [], today = new Date()): ListingReport {
  const report: ListingReport = { errors: [], warnings: [] };
  if (!poster.etsy && savedSizes.length > 0) {
    report.errors.push('Saved for listing but has no etsy block; run the etsy-listing-researcher agent.');
    return report;
  }
  checkEtsy(poster.etsy, report);
  checkResearch(poster, report, today);
  if (savedSizes.length > 0) {
    for (const [size, spec] of Object.entries(POSTER_SIZES)) {
      const label = `${spec.printWidthInches}×${spec.printHeightInches}`;
      if (!savedSizes.includes(size as PosterSizeName) && poster.etsy?.description.includes(label)) {
        report.warnings.push(`etsy.description mentions ${label}, which has not been saved for listing.`);
      }
    }
  }
  return report;
}
