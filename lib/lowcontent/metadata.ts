import type { LcMetadata } from '@/types/lowcontent';

/**
 * Metadata limits, fetched 2026-10-31.
 *
 * Title and subtitle together must be fewer than 200 characters:
 * https://kdp.amazon.com/en_US/help/topic/G201097560
 * Description limit is 4,000 characters, and the description cannot carry a
 * URL, email, phone, review, quote, or price:
 * https://kdp.amazon.com/en_US/help/topic/G201189630
 * Up to seven keyword boxes. The live page says to watch "the character limit
 * in the text field" and does not restate the number:
 * https://kdp.amazon.com/en_US/help/topic/G201298500
 * The 2020 metadata companion still states "50 characters per field with a
 * 210 total byte limit":
 * https://m.media-amazon.com/images/G/01/kindle-publication/webinars/Companion_for_Discovering_Metadata_2020.pdf
 * Fifty characters is enforced. The 210-byte total is a warning.
 * Titles over 60 characters are a skim warning (same keyword page).
 * Categories: the details form allows up to three (G201097560). This pipeline
 * stores two, which is the metadata block the project asked for.
 * Paperback list price on Amazon.com cannot exceed 250 USD. The minimum is
 * printing cost divided by the royalty rate, which this repo does not calculate:
 * https://kdp.amazon.com/en_US/help/topic/G201834340
 * Reading age is optional. The old 18+ maximum was removed:
 * https://kdp.amazon.com/en_US/help/topic/G201506310
 * https://kdp.amazon.com/en_US/help/topic/G200652170
 */

export const KDP_METADATA_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201097560';
export const KDP_DESCRIPTION_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201189630';
export const KDP_KEYWORD_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201298500';
export const KDP_KEYWORD_COMPANION_URL =
  'https://m.media-amazon.com/images/G/01/kindle-publication/webinars/Companion_for_Discovering_Metadata_2020.pdf';
export const KDP_PRICE_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201834340';
export const KDP_READING_AGE_HELP_URL = 'https://kdp.amazon.com/en_US/help/topic/G201506310';

export const TITLE_SUBTITLE_MAX_CHARS = 199;
export const TITLE_SKIM_WARN_CHARS = 60;
export const DESCRIPTION_MAX_CHARS = 4000;
export const KEYWORD_COUNT = 7;
export const KEYWORD_MAX_CHARS = 50;
export const KEYWORD_TOTAL_BYTE_WARN = 210;
export const CATEGORY_COUNT = 2;
export const PRICE_MAX_USD = 250;

const BISAC_PATTERN = /^[A-Z]{3}\d{6}$/;

export type MetadataReport = {
  errors: string[];
  warnings: string[];
  metadata: LcMetadata | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function validateLcMetadata(input: unknown): MetadataReport {
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
  if (/\b(bestseller|bestselling|best-selling)\b/i.test(`${titleText} ${subtitleText}`)) {
    errors.push('Title and subtitle cannot claim bestseller status.');
  }
  if (/<|>/.test(`${titleText} ${subtitleText}`)) {
    errors.push('Title and subtitle cannot contain HTML.');
  }

  if (description !== null) {
    checkDescription(description, errors);
  }

  const categories = parseCategories(input.categories, errors, warnings);
  const keywords = parseKeywords(input.keywords, errors, warnings);
  const priceUsd = parsePrice(input.priceUsd, errors, warnings);
  const readingAge = parseReadingAge(input.readingAge, errors, warnings);

  if (input.lowContent !== true) errors.push('kdp.lowContent must be true. This pipeline only builds low-content books.');
  if (input.sexuallyExplicit !== false) errors.push('kdp.sexuallyExplicit must be false for these samples.');
  const isbn = input.isbn === 'none' || input.isbn === 'own' ? input.isbn : null;
  if (isbn === null) errors.push('kdp.isbn must be "none" (publish without an ISBN) or "own". A free KDP ISBN is not eligible.');

  if (
    errors.length > 0 ||
    title === null ||
    subtitle === null ||
    description === null ||
    priceUsd === null ||
    isbn === null ||
    readingAge === undefined
  ) {
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
      priceUsd,
      readingAge,
      lowContent: true,
      isbn,
      sexuallyExplicit: false,
    },
  };
}

function checkDescription(description: string, errors: string[]): void {
  if (description !== description.trim()) errors.push('kdp.description has surrounding whitespace.');
  if (description.trim().length === 0) errors.push('kdp.description is empty.');
  if (description.length > DESCRIPTION_MAX_CHARS) {
    errors.push(`kdp.description is ${description.length} characters. The limit is ${DESCRIPTION_MAX_CHARS}.`);
  }
  if (/https?:\/\/|www\./i.test(description) || /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(description)) {
    errors.push('kdp.description cannot include a URL or email address.');
  }
  if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(description)) {
    errors.push('kdp.description cannot include a phone number.');
  }
  if (/\b(review|testimonial|as seen in)\b/i.test(description)) {
    errors.push('kdp.description cannot include a review, quote, testimonial, or review request.');
  }
  if (/\$\s?\d/.test(description)) {
    errors.push('kdp.description cannot include a price.');
  }
}

function parseCategories(input: unknown, errors: string[], warnings: string[]): LcMetadata['categories'] {
  if (!Array.isArray(input)) {
    errors.push('kdp.categories must be an array.');
    return [];
  }
  if (input.length !== CATEGORY_COUNT) {
    errors.push(
      `kdp.categories must contain ${CATEGORY_COUNT} entries (found ${input.length}). KDP's picker allows up to three; this pipeline stores two.`,
    );
  } else {
    warnings.push('Category labels are not checked against the live KDP category picker.');
  }
  const categories: LcMetadata['categories'] = [];
  input.forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`kdp.categories[${index}] must be an object with a label.`);
      return;
    }
    const label = asString(entry.label);
    if (!label || label.trim().length === 0) {
      errors.push(`kdp.categories[${index}].label must be a non-empty string.`);
      return;
    }
    if (label !== label.trim()) errors.push(`kdp.categories[${index}].label has surrounding whitespace.`);
    const category: LcMetadata['categories'][number] = { label };
    if (entry.bisac !== undefined) {
      const bisac = asString(entry.bisac);
      if (!bisac || !BISAC_PATTERN.test(bisac)) {
        errors.push(`kdp.categories[${index}].bisac must look like SEL045000.`);
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
    if (entry !== entry.trim()) errors.push(`kdp.keywords[${index}] has surrounding whitespace.`);
    if (entry.trim().length === 0) errors.push(`kdp.keywords[${index}] is empty.`);
    if (entry.length > KEYWORD_MAX_CHARS) {
      errors.push(`kdp.keywords[${index}] is ${entry.length} characters. The companion cap is ${KEYWORD_MAX_CHARS}.`);
    }
    keywords.push(entry);
  });
  const bytes = utf8Bytes(keywords.join(''));
  if (bytes > KEYWORD_TOTAL_BYTE_WARN) {
    warnings.push(
      `Keywords are ${bytes} UTF-8 bytes combined. The 2020 companion warns at ${KEYWORD_TOTAL_BYTE_WARN}. The live keyword page does not restate that number.`,
    );
  }
  return keywords;
}

function parsePrice(input: unknown, errors: string[], warnings: string[]): number | null {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    errors.push('kdp.priceUsd must be a finite number.');
    return null;
  }
  if (input <= 0) errors.push('kdp.priceUsd must be greater than 0.');
  if (input > PRICE_MAX_USD) errors.push(`kdp.priceUsd exceeds the Amazon.com paperback maximum of ${PRICE_MAX_USD} USD.`);
  const cents = Math.round(input * 100);
  if (Math.abs(input * 100 - cents) > 1e-6) errors.push('kdp.priceUsd must be a whole number of cents.');
  warnings.push(
    'List price is not checked against printing cost. KDP rejects a price below printing cost divided by the royalty rate (50% or 60%).',
  );
  return input;
}

function parseReadingAge(input: unknown, errors: string[], warnings: string[]): LcMetadata['readingAge'] | undefined {
  if (input === null) {
    warnings.push(
      'Reading age is unset. The field is optional. KDP removed the old 18+ maximum, so an adult book should not rely on an 18+ bucket.',
    );
    return null;
  }
  if (!isRecord(input)) {
    errors.push('kdp.readingAge must be null or an object with min and max.');
    return undefined;
  }
  const min = input.min;
  const max = input.max;
  if (typeof min !== 'number' || typeof max !== 'number' || !Number.isInteger(min) || !Number.isInteger(max)) {
    errors.push('kdp.readingAge min and max must be integers.');
    return undefined;
  }
  if (min < 0 || max < min) errors.push('kdp.readingAge min must be >= 0 and max must be >= min.');
  if (max >= 18) {
    warnings.push(
      'Reading age reaches 18 or above. KDP removed the 18+ maximum option. Confirm the form still accepts this range. UNVERIFIED upper bound.',
    );
  }
  return { min, max };
}
