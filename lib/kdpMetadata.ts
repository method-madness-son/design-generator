import type { KdpMetadata } from '@/types/kdp';

/**
 * KDP book-details limits, fetched 2026-10-30.
 *
 * Title and subtitle together must be fewer than 200 characters:
 * https://kdp.amazon.com/en_US/help/topic/G201097560
 * Description limit is 4,000 characters, and the description cannot carry a
 * URL, email address, or review request:
 * https://kdp.amazon.com/en_US/help/topic/G201189630
 * Up to seven keyword boxes:
 * https://kdp.amazon.com/en_US/help/topic/G201298500
 * That page says to watch "the character limit in the text field" and does not
 * restate the number. The 2020 KDP metadata companion still states it:
 * "Character limit is 50 characters per field with a 210 total byte limit."
 * https://m.media-amazon.com/images/G/01/kindle-publication/webinars/Companion_for_Discovering_Metadata_2020.pdf
 * Fifty characters per box is a hard error. The 210-byte combined cap is a
 * warning, because the live help page no longer repeats it.
 *
 * The bookshelf category picker accepts two categories. A third is a support
 * request, so a third category is a warning and a fourth is an error. BISAC
 * codes are optional catalog labels (Book Industry Study Group), not the
 * browse-path strings KDP shows in the picker.
 */

export const KDP_METADATA_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201097560';
export const KDP_DESCRIPTION_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201189630';
export const KDP_KEYWORD_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201298500';
export const KDP_KEYWORD_COMPANION_URL =
  'https://m.media-amazon.com/images/G/01/kindle-publication/webinars/Companion_for_Discovering_Metadata_2020.pdf';

export const TITLE_SUBTITLE_MAX_CHARS = 199;
export const TITLE_SKIM_WARN_CHARS = 60;
export const DESCRIPTION_MAX_CHARS = 4000;
export const KEYWORD_COUNT = 7;
export const KEYWORD_MAX_CHARS = 50;
export const KEYWORD_TOTAL_BYTE_WARN = 210;
export const CATEGORY_MIN = 1;
export const CATEGORY_PICKER_MAX = 2;
export const CATEGORY_HARD_MAX = 3;

const BISAC_PATTERN = /^[A-Z]{3}\d{6}$/;

/**
 * Rough licensing scan for this project's markets. Not legal advice.
 * Ideas file called out NHL, team marks, F1, NASCAR, iRacing, and RC brand
 * names as things to keep out of generic interiors.
 */
const LICENSING_WATCH = [
  'nhl',
  'traxxas',
  'axial',
  'iracing',
  'nascar',
  'formula 1',
  'f1',
  'leetcode',
  'neetcode',
  'github',
  'gitlab',
];

export type MetadataReport = {
  errors: string[];
  warnings: string[];
  metadata: KdpMetadata | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function licensingWarnings(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits = LICENSING_WATCH.filter((term) => {
    const pattern = new RegExp(`(?:^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z0-9]|$)`, 'i');
    return pattern.test(haystack);
  });
  if (hits.length === 0) return [];
  return [`Licensing watch list hit (${hits.join(', ')}). Confirm this is generic use before listing.`];
}

export function validateKdpMetadata(input: unknown): MetadataReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(input)) {
    return { errors: ['kdp metadata must be an object.'], warnings, metadata: null };
  }

  const title = asString(input.title);
  const subtitle = asString(input.subtitle);
  const description = asString(input.description);
  if (title === null) errors.push('kdp.title must be a string.');
  if (subtitle === null) errors.push('kdp.subtitle must be a string (use an empty string if there is no subtitle).');
  if (description === null) errors.push('kdp.description must be a string.');

  const titleText = title?.trim() ?? '';
  const subtitleText = subtitle?.trim() ?? '';
  if (title !== null && titleText.length === 0) errors.push('kdp.title is empty.');
  if (title && title !== title.trim()) errors.push('kdp.title has surrounding whitespace.');
  if (subtitle && subtitle !== subtitle.trim()) errors.push('kdp.subtitle has surrounding whitespace.');
  if (titleText.length + subtitleText.length > TITLE_SUBTITLE_MAX_CHARS) {
    errors.push(
      `Title and subtitle together must be fewer than 200 characters (now ${titleText.length + subtitleText.length}).`,
    );
  }
  if (titleText.length > TITLE_SKIM_WARN_CHARS) {
    warnings.push(`Title is over ${TITLE_SKIM_WARN_CHARS} characters. KDP notes that shoppers skim past long titles.`);
  }

  if (description !== null) {
    if (description !== description.trim()) errors.push('kdp.description has surrounding whitespace.');
    if (description.trim().length === 0) errors.push('kdp.description is empty.');
    if (description.length > DESCRIPTION_MAX_CHARS) {
      errors.push(`kdp.description is ${description.length} characters. The limit is ${DESCRIPTION_MAX_CHARS}.`);
    }
    if (/https?:\/\/|www\./i.test(description) || /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(description)) {
      errors.push('kdp.description cannot include a URL or email address.');
    }
  }

  const categories = parseCategories(input.categories, errors, warnings);
  const keywords = parseKeywords(input.keywords, errors, warnings);

  const scanned = [titleText, subtitleText, description?.trim() ?? '', ...keywords].join('\n');
  warnings.push(...licensingWarnings(scanned));
  for (const category of categories) warnings.push(...licensingWarnings(category.label));

  if (errors.length > 0 || title === null || subtitle === null || description === null) {
    return { errors, warnings, metadata: null };
  }

  return {
    errors,
    warnings,
    metadata: {
      title,
      subtitle,
      description,
      categories,
      keywords,
    },
  };
}

function parseCategories(input: unknown, errors: string[], warnings: string[]): KdpMetadata['categories'] {
  if (!Array.isArray(input)) {
    errors.push('kdp.categories must be an array.');
    return [];
  }
  if (input.length < CATEGORY_MIN) errors.push('Add at least one category.');
  if (input.length > CATEGORY_HARD_MAX) {
    errors.push(`kdp.categories has ${input.length} entries. Keep it to ${CATEGORY_HARD_MAX} or fewer.`);
  } else if (input.length > CATEGORY_PICKER_MAX) {
    warnings.push(
      `kdp.categories has ${input.length} entries. The bookshelf picker allows ${CATEGORY_PICKER_MAX}; a third category is a support request.`,
    );
  }

  const categories: KdpMetadata['categories'] = [];
  input.forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`kdp.categories[${index}] must be an object with a label.`);
      return;
    }
    const label = asString(entry.label);
    if (label === null || label.trim().length === 0) {
      errors.push(`kdp.categories[${index}].label must be a non-empty string.`);
      return;
    }
    if (label !== label.trim()) errors.push(`kdp.categories[${index}].label has surrounding whitespace.`);
    const category: KdpMetadata['categories'][number] = { label };
    if (entry.bisac !== undefined) {
      const bisac = asString(entry.bisac);
      if (bisac === null || !BISAC_PATTERN.test(bisac)) {
        errors.push(`kdp.categories[${index}].bisac must look like SPO020000.`);
      } else {
        category.bisac = bisac;
      }
    }
    categories.push(category);
  });
  return categories;
}

function parseKeywords(input: unknown, errors: string[], warnings: string[]): string[] {
  if (!Array.isArray(input)) {
    errors.push(`kdp.keywords must be an array of ${KEYWORD_COUNT} strings.`);
    return [];
  }
  if (input.length !== KEYWORD_COUNT) {
    errors.push(`kdp.keywords must contain exactly ${KEYWORD_COUNT} entries (found ${input.length}).`);
  }
  const keywords: string[] = [];
  input.forEach((entry, index) => {
    if (typeof entry !== 'string') {
      errors.push(`kdp.keywords[${index}] must be a string.`);
      return;
    }
    if (entry.trim().length === 0) errors.push(`kdp.keywords[${index}] is empty.`);
    if (entry !== entry.trim()) errors.push(`kdp.keywords[${index}] has surrounding whitespace.`);
    if (entry.length > KEYWORD_MAX_CHARS) {
      errors.push(`kdp.keywords[${index}] is ${entry.length} characters. The limit is ${KEYWORD_MAX_CHARS}.`);
    }
    if (/["“”]/.test(entry)) warnings.push(`kdp.keywords[${index}] contains quotation marks. KDP says to leave those out.`);
    if (/[<>]/.test(entry)) errors.push(`kdp.keywords[${index}] contains angle brackets.`);
    keywords.push(entry);
  });

  const unique = new Set(keywords.map((keyword) => keyword.toLowerCase()));
  if (unique.size !== keywords.length) warnings.push('Duplicate keywords. Each box should say something different.');

  const totalBytes = keywords.reduce((sum, keyword) => sum + utf8Bytes(keyword), 0);
  if (totalBytes > KEYWORD_TOTAL_BYTE_WARN) {
    warnings.push(
      `Keywords are ${totalBytes} UTF-8 bytes combined. The 2020 metadata companion capped the seven boxes at ${KEYWORD_TOTAL_BYTE_WARN} bytes. Current help no longer states that cap.`,
    );
  }
  return keywords;
}
