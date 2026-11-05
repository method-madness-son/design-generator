/**
 * Wrapping paper designs live under wrapping/<designId>/:
 *
 *   wrapping/<designId>/wrap.json    design config: source, tile, colors, sizes
 *   wrapping/<designId>/etsy.json    Etsy listing: { etsy, research }
 *   wrapping/<designId>/exports/     <designId>.png (one tile, 9075×10800 px; Printify repeats it)
 *
 * All variants (3 sizes × 2 finishes) share one print file. Printify tiles the uploaded image
 * across the roll. Node only — see docs/WRAPPING-PIPELINE.md.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedWrap, WrapDesignFile, WrapEtsy, WrapSizeId } from '@/types/wrap';
import { isWrapSize, WRAP_SIZES } from '@/lib/wrapSizes';

const WRAPPING_DIR = path.join(process.cwd(), 'wrapping');
const DESIGN_FILE = 'wrap.json';
const LISTING_FILE = 'etsy.json';
const EXPORTS_DIR = 'exports';

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

const isSlug = (value: string) => /^[a-z0-9][a-z0-9-_]*$/i.test(value);

function folders(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isSlug(entry.name))
    .map((entry) => entry.name)
    .sort();
}

const designDir = (id: string) => path.join(WRAPPING_DIR, id);

export function getWrapDesignIds(): string[] {
  return folders(WRAPPING_DIR).filter((id) =>
    fs.existsSync(path.join(designDir(id), DESIGN_FILE)),
  );
}

export function loadWrapDesign(id: string): WrapDesignFile | null {
  if (!isSlug(id)) return null;
  return readJson<WrapDesignFile>(path.join(designDir(id), DESIGN_FILE));
}

export function wrapListing(id: string): { etsy: WrapEtsy | null; research: unknown } {
  const listing = readJson<{ etsy?: WrapEtsy; research?: unknown }>(
    path.join(designDir(id), LISTING_FILE),
  );
  return { etsy: listing?.etsy ?? null, research: listing?.research ?? null };
}

export function wrapExportPath(id: string): string {
  return path.join(designDir(id), EXPORTS_DIR, `${id}.png`);
}

export function wrapExportExists(id: string): boolean {
  return fs.existsSync(wrapExportPath(id));
}

export function wrapExportHash(id: string): string | null {
  const filePath = wrapExportPath(id);
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function resolveWrap(id: string): ResolvedWrap | null {
  const design = loadWrapDesign(id);
  if (!design) return null;
  const { etsy } = wrapListing(id);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!design.title?.trim()) errors.push('title is empty.');
  if (!design.source) errors.push('source is required (kind: "poster" or "standalone").');
  if (design.source?.kind === 'poster') {
    if (!design.source.projectId || !design.source.posterId) {
      errors.push('Poster source must have projectId and posterId.');
    }
  }

  if (!design.tile) {
    errors.push('tile config is required (widthIn, heightIn).');
  } else {
    if (!design.tile.widthIn || design.tile.widthIn <= 0) errors.push('tile.widthIn must be positive.');
    if (!design.tile.heightIn || design.tile.heightIn <= 0) errors.push('tile.heightIn must be positive.');
  }

  const sizes = (design.sizes ?? []).filter((size): size is WrapSizeId => {
    if (!isWrapSize(size)) {
      errors.push(`Unknown size "${size}". Valid: ${Object.keys(WRAP_SIZES).join(', ')}.`);
      return false;
    }
    return true;
  });
  if (sizes.length === 0) warnings.push('No sizes configured; no variants will be listed.');

  return {
    id: design.id ?? id,
    title: design.title ?? id,
    source: design.source ?? { kind: 'standalone' },
    sizes,
    tile: design.tile ?? { widthIn: 6, heightIn: 6 },
    colors: {
      background: design.colors?.background ?? '#FFFFFF',
      foreground: design.colors?.foreground ?? '#000000',
      accent: design.colors?.accent ?? '#666666',
    },
    etsy,
    warnings,
    errors,
  };
}

export function loadAllResolvedWraps(): ResolvedWrap[] {
  return getWrapDesignIds().map((id) => resolveWrap(id)!);
}
