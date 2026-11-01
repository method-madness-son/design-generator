/**
 * Pure helpers for the Printify poster sync: config/state files, print-file discovery, listing
 * validation, and the product payload. No network here; see lib/printify/client.ts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { checkEtsy } from '@/lib/etsyListing';
import { exportsDir } from '@/lib/posterExports';
import { getPosterIds, getProject } from '@/lib/posterResolver';
import { POSTER_SIZES, PRINT_DPI, type PosterSizeName } from '@/lib/posterSizes';
import type { PosterFile } from '@/types/poster';
import type { PrintifyConfig, PrintifyProductRequest, PrintifyState, PrintifyVariant } from '@/types/printify';

export const CONFIG_PATH = path.join(process.cwd(), 'printify', 'config.json');
export const STATE_PATH = path.join(process.cwd(), 'printify', 'state.json');
// Print files are saved by the studio to posters/<projectId>/exports/<posterId>-<size>.png
// (lib/posterExports.ts). --dir <root> reads <root>/<projectId>/<posterId>-<size>.png instead.
function printFileDir(projectId: string, root?: string): string {
  return root ? path.join(root, projectId) : exportsDir(projectId);
}

// Printify suggests uploading by URL rather than base64 above roughly this size.
export const BASE64_SOFT_LIMIT_BYTES = 5 * 1024 * 1024;
export const PRINTIFY_PNG_LIMIT_BYTES = 100 * 1024 * 1024;

export function loadConfig(): PrintifyConfig {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as PrintifyConfig;
}

export function loadState(): PrintifyState {
  if (!fs.existsSync(STATE_PATH)) return { shops: {} };
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) as PrintifyState;
}

// Written after every API call that changes something, so a crash mid-run never loses ids.
export function saveState(state: PrintifyState): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

export function posterState(state: PrintifyState, shopId: number, key: string) {
  const shop = (state.shops[String(shopId)] ??= { posters: {} });
  return (shop.posters[key] ??= { images: {} });
}

export function resolveShopId(config: PrintifyConfig): number | null {
  const fromEnv = process.env.PRINTIFY_SHOP_ID;
  if (fromEnv) {
    const id = Number(fromEnv);
    if (!Number.isInteger(id)) throw new Error(`PRINTIFY_SHOP_ID "${fromEnv}" is not an integer.`);
    return id;
  }
  return config.shopId;
}

export function configErrors(config: PrintifyConfig, shopId: number | null): string[] {
  const errors: string[] = [];
  if (!shopId) errors.push('shopId is not set. Run `npm run printify:shops` and copy the Etsy shop id.');
  if (!config.blueprintId) errors.push('blueprintId is not set. Run `npm run printify:catalog -- --search poster`.');
  if (!config.printProviderId) errors.push('printProviderId is not set. Run `npm run printify:catalog -- --blueprint <id>`.');
  const sizes = Object.entries(config.sizes) as [PosterSizeName, PrintifyConfig['sizes'][PosterSizeName]][];
  if (sizes.length === 0) errors.push('sizes is empty.');
  for (const [size, entry] of sizes) {
    if (!(size in POSTER_SIZES)) errors.push(`sizes.${size} is not a poster size (${Object.keys(POSTER_SIZES).join(', ')}).`);
    if (!entry?.variantId) errors.push(`sizes.${size}.variantId is not set.`);
    if (!entry?.priceCents || !Number.isInteger(entry.priceCents) || entry.priceCents <= 0) {
      errors.push(`sizes.${size}.priceCents must be a positive integer (cents).`);
    }
  }
  return errors;
}

export type PrintFile = { size: PosterSizeName; filePath: string; bytes: number; width: number; height: number };

export type PosterJob = {
  key: string;
  projectId: string;
  poster: PosterFile;
  files: PrintFile[];
  errors: string[];
  warnings: string[];
};

// Reads width/height from the PNG IHDR chunk without decoding the whole 300 DPI image.
export function pngSize(filePath: string): { width: number; height: number } {
  const fd = fs.openSync(filePath, 'r');
  try {
    const header = Buffer.alloc(24);
    fs.readSync(fd, header, 0, 24, 0);
    if (header.readUInt32BE(0) !== 0x89504e47 || header.toString('ascii', 12, 16) !== 'IHDR') {
      throw new Error(`${filePath} is not a PNG.`);
    }
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
  } finally {
    fs.closeSync(fd);
  }
}

export function sha256(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function listingErrors(poster: PosterFile): string[] {
  const report = { errors: [] as string[], warnings: [] as string[] };
  checkEtsy(poster.etsy, report);
  return report.errors;
}

function displayPath(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  return relative.startsWith('..') ? filePath : relative;
}

export function buildJob(config: PrintifyConfig, projectId: string, posterId: string, root?: string): PosterJob {
  const posterPath = path.join(process.cwd(), 'posters', projectId, `${posterId}.json`);
  const poster = JSON.parse(fs.readFileSync(posterPath, 'utf8')) as PosterFile;
  const job: PosterJob = { key: `${projectId}/${posterId}`, projectId, poster, files: [], errors: listingErrors(poster), warnings: [] };
  for (const size of Object.keys(config.sizes) as PosterSizeName[]) {
    const spec = POSTER_SIZES[size];
    if (!spec) continue;
    const filePath = path.join(printFileDir(projectId, root), `${posterId}-${size}.png`);
    if (!fs.existsSync(filePath)) {
      job.warnings.push(`No ${size} saved at ${displayPath(filePath)}; that size is left off.`);
      // The listing should not promise a size that will not be offered.
      const label = `${spec.printWidthInches}×${spec.printHeightInches}`;
      if (poster.etsy?.description.includes(label)) {
        job.warnings.push(`etsy.description mentions ${label} but only saved sizes are listed.`);
      }
      continue;
    }
    const { width, height } = pngSize(filePath);
    const expected = { width: spec.printWidthInches * PRINT_DPI, height: spec.printHeightInches * PRINT_DPI };
    if (width !== expected.width || height !== expected.height) {
      job.errors.push(`${size} file is ${width}×${height}px; expected ${expected.width}×${expected.height}px (300 DPI).`);
    }
    const bytes = fs.statSync(filePath).size;
    if (bytes > PRINTIFY_PNG_LIMIT_BYTES) job.errors.push(`${size} file is over Printify's 100 MB PNG limit.`);
    job.files.push({ size, filePath, bytes, width, height });
  }
  if (job.files.length === 0) job.errors.push('Not saved for listing yet: use "Save for Etsy listing" in the studio.');
  return job;
}

// Named posters are always checked. With no names, only posters that have a saved export for a
// configured size are eligible; the rest are returned in `skipped` and are not an error.
export function jobsFor(
  config: PrintifyConfig,
  projectId: string,
  posterIds: string[],
  root?: string,
): { jobs: PosterJob[]; skipped: string[] } {
  if (!getProject(projectId)) throw new Error(`No poster project "${projectId}" under posters/.`);
  const known = getPosterIds(projectId);
  for (const id of posterIds) if (!known.includes(id)) throw new Error(`No poster "${id}" in ${projectId}.`);
  if (posterIds.length > 0) return { jobs: posterIds.map((id) => buildJob(config, projectId, id, root)), skipped: [] };
  const dir = printFileDir(projectId, root);
  const sizes = Object.keys(config.sizes);
  const eligible = (id: string) => sizes.some((size) => fs.existsSync(path.join(dir, `${id}-${size}.png`)));
  return {
    jobs: known.filter(eligible).map((id) => buildJob(config, projectId, id, root)),
    skipped: known.filter((id) => !eligible(id)),
  };
}

// Each catalog variant has its own placeholder size; the art must match its aspect ratio or
// Printify will crop or letterbox it.
export function placeholderErrors(config: PrintifyConfig, variants: PrintifyVariant[]): string[] {
  const errors: string[] = [];
  for (const [size, entry] of Object.entries(config.sizes) as [PosterSizeName, { variantId: number | null }][]) {
    const variant = variants.find((candidate) => candidate.id === entry.variantId);
    if (!variant) {
      errors.push(`sizes.${size}.variantId ${entry.variantId} is not offered by this blueprint/provider.`);
      continue;
    }
    const placeholder = variant.placeholders.find((candidate) => candidate.position === config.placeholderPosition);
    if (!placeholder) {
      errors.push(`Variant ${variant.id} (${variant.title}) has no "${config.placeholderPosition}" placeholder.`);
      continue;
    }
    const spec = POSTER_SIZES[size];
    const want = spec.printWidthInches / spec.printHeightInches;
    const have = placeholder.width / placeholder.height;
    if (Math.abs(want - have) > 0.01) {
      errors.push(
        `Variant ${variant.id} (${variant.title}) placeholder is ${placeholder.width}×${placeholder.height}, ` +
          `which does not match the ${size} aspect ratio.`,
      );
    }
  }
  return errors;
}

export function buildProductRequest(
  config: PrintifyConfig,
  job: PosterJob,
  imageIds: Partial<Record<PosterSizeName, string>>,
): PrintifyProductRequest {
  const etsy = job.poster.etsy!;
  // research and category stay local: Printify's product API has no field for them.
  const sized = job.files.map((file) => {
    const entry = config.sizes[file.size]!;
    const imageId = imageIds[file.size];
    if (!imageId) throw new Error(`${job.key}: no uploaded image for ${file.size}.`);
    return { variantId: entry.variantId!, priceCents: entry.priceCents!, imageId };
  });
  return {
    title: etsy.title,
    description: etsy.description,
    tags: etsy.tags,
    blueprint_id: config.blueprintId!,
    print_provider_id: config.printProviderId!,
    // Only sizes with art are listed; Printify rejects variants that have no print area.
    variants: sized.map((entry) => ({ id: entry.variantId, price: entry.priceCents, is_enabled: true })),
    // One print area per size so each variant gets the file rendered at its own aspect ratio.
    print_areas: sized.map((entry) => ({
      variant_ids: [entry.variantId],
      placeholders: [
        {
          position: config.placeholderPosition,
          images: [{ id: entry.imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        },
      ],
    })),
  };
}
