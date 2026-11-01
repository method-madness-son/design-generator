/**
 * Pure helpers for the Printify poster sync: config/state files, eligible posters, and the product
 * payload. No network here; see lib/printify/client.ts. Print files come from lib/posterExports.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkListing } from '@/lib/etsyListing';
import { readPrintFile, savedSizesByPoster, type PrintFile } from '@/lib/posterExports';
import { getPosterFile, resolvePosterIds } from '@/lib/posterResolver';
import { POSTER_SIZES, isPosterSizeName, printFileErrors, type PosterSizeName } from '@/lib/posterSizes';
import type { PosterFile } from '@/types/poster';
import type { PrintifyConfig, PrintifyProductRequest, PrintifyState, PrintifyVariant } from '@/types/printify';

const CONFIG_PATH = path.join(process.cwd(), 'printify', 'config.json');
const STATE_PATH = path.join(process.cwd(), 'printify', 'state.json');
// Printify suggests uploading by URL rather than base64 above roughly this size.
export const BASE64_SOFT_LIMIT_BYTES = 5 * 1024 * 1024;

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
    if (!isPosterSizeName(size)) errors.push(`sizes.${size} is not a poster size (${Object.keys(POSTER_SIZES).join(', ')}).`);
    if (!entry?.variantId) errors.push(`sizes.${size}.variantId is not set.`);
    if (!entry?.priceCents || !Number.isInteger(entry.priceCents) || entry.priceCents <= 0) {
      errors.push(`sizes.${size}.priceCents must be a positive integer (cents).`);
    }
  }
  return errors;
}

export type PosterJob = {
  key: string;
  projectId: string;
  poster: PosterFile;
  files: PrintFile[];
  errors: string[];
  warnings: string[];
};

function buildJob(config: PrintifyConfig, projectId: string, posterId: string, saved: PosterSizeName[]): PosterJob {
  const poster = getPosterFile(projectId, posterId)!;
  const sizes = saved.filter((size) => size in config.sizes);
  const files = sizes.map((size) => readPrintFile(projectId, posterId, size));
  const { errors, warnings } = checkListing(poster, saved);
  for (const file of files) errors.push(...printFileErrors(file.size, file));
  if (files.length === 0) errors.push('Not saved for listing yet: use "Save for Etsy listing" in the studio.');
  for (const size of Object.keys(config.sizes)) if (!sizes.includes(size as PosterSizeName)) warnings.push(`${size} not saved; that size is left off.`);
  return { key: `${projectId}/${posterId}`, projectId, poster, files, errors, warnings };
}

// Named posters are always checked. With no names, only posters with a saved export are eligible;
// the rest are returned in `skipped` and are not an error.
export function jobsFor(config: PrintifyConfig, projectId: string, posterIds: string[]): { jobs: PosterJob[]; skipped: string[] } {
  const saved = savedSizesByPoster(projectId);
  const ids = resolvePosterIds(projectId, posterIds);
  const eligible = posterIds.length > 0 ? ids : ids.filter((id) => saved.has(id));
  return {
    jobs: eligible.map((id) => buildJob(config, projectId, id, saved.get(id) ?? [])),
    skipped: ids.filter((id) => !eligible.includes(id)),
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
