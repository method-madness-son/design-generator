/**
 * Build sticker print files and send them to Printify as draft products.
 *
 *   npm run sticker:check                               # offline: designs, files, Etsy copy
 *   npm run sticker-art -- --all                        # needs the studio running (npm run dev)
 *   npm run sticker-art -- dev-realities vim-wq
 *   npm run sticker:fit -- --all                        # sizes for the rectangular layouts; needs the studio
 *   npm run sticker:sync -- dev-realities vim-wq --dry-run
 *   npm run sticker:sync -- dev-realities vim-wq        # upload the image, create or update a draft
 *   npm run sticker:sync -- dev-realities --publish     # and push to Etsy
 *
 * See docs/STICKER-PIPELINE.md.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { checkListing } from '@/lib/etsyListing';
import { pngDimensions } from '@/lib/posterExports';
import { getPosterFile } from '@/lib/posterResolver';
import { PrintifyClient } from '@/lib/printify/client';
import { loadConfig, loadState, posterState, resolveShopId, saveState, withAllCatalogVariants } from '@/lib/printify/posters';
import { hasStickerLayout, loadSticker, saveStickerLayout, stickerExportPath, stickerIds, stickerListing, stickerProjects, stickerType } from '@/lib/stickerDesigns';
import type { StickerLayoutReport } from '@/lib/stickerLayout';
import { STICKER_BANNED_CLAIM, STICKER_CANVAS_PX, STICKER_TYPES, WIDE_STICKER_TYPES, type StickerType } from '@/lib/stickerSizes';
import { chromiumLaunchOptions } from './shared/previewServer';
import type { PrintifyProductRequest, PrintifyVariant } from '@/types/printify';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(path.join(process.cwd(), file));
  } catch {
    // optional
  }
}

const { positionals, values: flags } = parseArgs({
  allowPositionals: true,
  options: {
    all: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    publish: { type: 'boolean', default: false },
    'base-url': { type: 'string', default: 'http://localhost:4310' },
  },
});
const [command = 'help', projectArg, ...idArgs] = positionals;

type StickerConfig = {
  blueprintId: number;
  printProviderId: number;
  placeholderPosition: string;
  sizes: Record<string, { variantId: number; priceCents: number; placeholderWidth: number; placeholderHeight: number }>;
};
type Target = { projectId: string; id: string; key: string };

const stickerConfigs = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'printify', 'stickers.json'), 'utf8')) as Record<StickerType, StickerConfig>;

function targets(): Target[] {
  const projects = projectArg ? [projectArg] : stickerProjects();
  if (projectArg && !stickerProjects().includes(projectArg)) throw new Error(`No sticker project "${projectArg}" under stickers/.`);
  return projects.flatMap((projectId) => {
    const known = stickerIds(projectId);
    for (const id of idArgs) if (!known.includes(id)) throw new Error(`No sticker "${id}" in ${projectId}.`);
    return (idArgs.length > 0 ? idArgs : known).map((id) => ({ projectId, id, key: `stickers/${projectId}/${id}` }));
  });
}

function fileErrors({ projectId, id }: Target): string[] {
  const type = stickerType(projectId, id);
  const file = stickerExportPath(projectId, id, type);
  if (!fs.existsSync(file)) return ['No print file: run `npm run sticker-art`.'];
  const { widthPx, heightPx } = STICKER_TYPES[type];
  const size = pngDimensions(fs.readFileSync(file).subarray(0, 24));
  return size?.width === widthPx && size.height === heightPx ? [] : [`Print file is ${size?.width}×${size?.height}; it must be ${widthPx}×${heightPx}.`];
}

function listingErrors({ projectId, id }: Target): { errors: string[]; warnings: string[] } {
  const poster = getPosterFile(projectId, id);
  if (!poster) return { errors: [`No poster "${projectId}/${id}" to build from.`], warnings: [] };
  const { etsy, research } = stickerListing(projectId, id);
  if (!etsy) return { errors: ['No Etsy listing yet: write stickers/.../etsy.json.'], warnings: [] };
  const { errors, warnings } = checkListing({ ...poster, etsy, research: research ?? undefined });
  const copy = `${etsy.title} ${etsy.description} ${etsy.tags.join(' ')}`;
  if (STICKER_BANNED_CLAIM.test(copy)) errors.push("Listing says waterproof, which Printify doesn't promise for this sticker's vinyl.");
  return { errors, warnings };
}

function check(): boolean {
  const list = targets();
  let ready = 0;
  for (const target of list) {
    const { errors, warnings } = listingErrors(target);
    const problems = [...fileErrors(target), ...errors];
    if (problems.length === 0) ready += 1;
    console.log(`\n${target.projectId}/${target.id}`);
    for (const warning of warnings) console.log(`  warning: ${warning}`);
    for (const problem of problems) console.log(`  not ready: ${problem}`);
  }
  console.log(`\n${ready}/${list.length} stickers ready to upload.`);
  return ready === list.length;
}

// A rectangle's canvas has a fractional height, which the capture rounds up by under one canvas px.
// Those extra rows are past the canvas's edge. Anything else stays as it is for the size check to report.
function cropToHeight(shot: Buffer, widthPx: number, heightPx: number): Buffer {
  const png = PNG.sync.read(shot);
  if (png.height <= heightPx || png.height > heightPx + Math.ceil(widthPx / STICKER_CANVAS_PX)) return shot;
  const cropped = new PNG({ width: png.width, height: heightPx });
  PNG.bitblt(png, cropped, 0, 0, png.width, heightPx, 0, 0);
  return PNG.sync.write(cropped);
}

async function art(): Promise<boolean> {
  const list = targets();
  if (!flags.all && !projectArg) throw new Error('Pass a project and optional sticker ids, or --all.');
  const browser = await chromium.launch(chromiumLaunchOptions);
  let ok = true;
  try {
    for (const target of list) {
      // The canvas is laid out at its usual width and captured at the print file's exact size.
      const type = stickerType(target.projectId, target.id);
      const { widthPx, heightPx } = STICKER_TYPES[type];
      const page = await browser.newPage({
        viewport: { width: STICKER_CANVAS_PX + 40, height: STICKER_CANVAS_PX + 40 },
        deviceScaleFactor: widthPx / STICKER_CANVAS_PX,
      });
      const url = `${flags['base-url']}/stickers/${target.projectId}/${target.id}/art`;
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 }).catch((error: Error) => {
        throw new Error(`Could not reach ${url}. Is the studio running (npm run dev)? ${error.message}`);
      });
      if (!response?.ok()) throw new Error(`${url} answered ${response?.status()}.`);
      await page.evaluate(() => document.fonts.ready);
      // Next's dev-mode badge floats over the page and would otherwise print on the sticker.
      // The page's own background also has to go, or a transparent canvas would capture it.
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; } html, body { background: transparent !important; }' });
      // Computed by the print route, with the same check the studio's preview runs.
      const report = page.locator('[data-sticker-report]');
      await report.waitFor({ state: 'attached', timeout: 30_000 });
      const { errors, warnings } = JSON.parse((await report.getAttribute('data-sticker-report'))!) as StickerLayoutReport;
      const shot = cropToHeight(await page.locator('#sticker-art').screenshot({ type: 'png', omitBackground: true }), widthPx, heightPx);
      const size = pngDimensions(shot);
      await page.close();
      if (size?.width !== widthPx || size.height !== heightPx) errors.push(`Captured ${size?.width}×${size?.height}.`);
      console.log(`\n${target.projectId}/${target.id}`);
      for (const warning of warnings) console.log(`  warning: ${warning}`);
      for (const error of errors) console.log(`  error: ${error}`);
      if (errors.length > 0) {
        ok = false;
        continue;
      }
      const output = stickerExportPath(target.projectId, target.id, type);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, shot);
      console.log('  wrote print file');
    }
  } finally {
    await browser.close();
  }
  return ok;
}

// Finds the largest sizes that keep each design's proportions and pass the layout check, for every
// rectangular type without saved sizes. Those sizes then show as the studio's defaults.
async function fitLayouts(): Promise<boolean> {
  if (!flags.all && !projectArg) throw new Error('Pass a project and optional sticker ids, or --all.');
  const browser = await chromium.launch(chromiumLaunchOptions);
  const page = await browser.newPage({ viewport: { width: STICKER_CANVAS_PX + 40, height: STICKER_CANVAS_PX + 40 } });
  let ok = true;
  try {
    for (const target of targets()) {
      for (const type of WIDE_STICKER_TYPES) {
        if (hasStickerLayout(target.projectId, target.id, type)) continue;
        const { poster } = loadSticker(target.projectId, target.id, { type })!;
        const sizesAt = (scale: number) =>
          Object.fromEntries(
            ([['titleRem', poster.titleDefaultRem, 20], ['subtitleRem', poster.subtitleDefaultRem, 20], ['bodyRem', poster.bodyDefaultRem, 20], ['iconRem', poster.iconDefaultRem, 30]] as const).map(([key, rem, max]) => [
              key,
              Math.min(max, Math.max(0.25, Math.round(rem * scale * 4) / 4)),
            ]),
          ) as Record<'titleRem' | 'subtitleRem' | 'bodyRem' | 'iconRem', number>;
        let best: ReturnType<typeof sizesAt> | null = null;
        let warnings: string[] = [];
        // An overlay is drawn around the text, so the text can't outgrow the largest graphic on offer.
        const overlay = poster.graphic?.className?.includes('absolute');
        let [low, high] = [0.15, overlay ? Math.min(3, 30 / poster.iconDefaultRem) : 3];
        for (let step = 0; step < 7; step += 1) {
          const scale = (low + high) / 2;
          const sizes = sizesAt(scale);
          const query = new URLSearchParams({ type, ...Object.fromEntries(Object.entries(sizes).map(([key, rem]) => [key, String(rem)])) });
          await page.goto(`${flags['base-url']}/stickers/${target.projectId}/${target.id}/art?${query}`, { waitUntil: 'networkidle', timeout: 120_000 });
          const report = page.locator('[data-sticker-report]');
          await report.waitFor({ state: 'attached', timeout: 30_000 });
          const result = JSON.parse((await report.getAttribute('data-sticker-report'))!) as StickerLayoutReport;
          if (result.errors.length === 0 && !result.warnings.some((warning) => warning.includes('breaks across'))) {
            best = sizes;
            warnings = result.warnings;
            low = scale;
          } else high = scale;
        }
        console.log(`${target.projectId}/${target.id} ${type}: ${best ? JSON.stringify(best) : 'nothing fits'}`);
        for (const warning of warnings) console.log(`  warning: ${warning}`);
        if (best) saveStickerLayout(target.projectId, target.id, type, best);
        else ok = false;
      }
    }
  } finally {
    await browser.close();
  }
  return ok;
}

function buildRequest(config: StickerConfig, target: Target, imageId: string): PrintifyProductRequest {
  const { etsy } = stickerListing(target.projectId, target.id);
  const sizes = Object.values(config.sizes);
  return {
    title: etsy!.title,
    description: etsy!.description,
    tags: etsy!.tags,
    blueprint_id: config.blueprintId,
    print_provider_id: config.printProviderId,
    variants: sizes.map((size) => ({ id: size.variantId, price: size.priceCents, is_enabled: true })),
    print_areas: [
      {
        variant_ids: sizes.map((size) => size.variantId),
        placeholders: [{ position: config.placeholderPosition, images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }],
      },
    ],
  };
}

// The catalog must still offer each variant, with the print area this file was built for.
function catalogErrors(type: StickerType, config: StickerConfig, variants: PrintifyVariant[]): string[] {
  return Object.entries(config.sizes).flatMap(([name, size]) => {
    const holder = variants.find((variant) => variant.id === size.variantId)?.placeholders.find((candidate) => candidate.position === config.placeholderPosition);
    if (!holder) return [`${name}: variant ${size.variantId} has no "${config.placeholderPosition}" print area.`];
    if (holder.width !== size.placeholderWidth || holder.height !== size.placeholderHeight) return [`${name}: print area is ${holder.width}×${holder.height}, expected ${size.placeholderWidth}×${size.placeholderHeight}.`];
    return size.placeholderWidth > STICKER_TYPES[type].widthPx ? [`${name}: print area is larger than the ${STICKER_TYPES[type].widthPx} px file.`] : [];
  });
}

async function sync(): Promise<boolean> {
  const list = targets();
  const blocked = list.flatMap((target) => [...fileErrors(target), ...listingErrors(target).errors].map((problem) => `${target.projectId}/${target.id}: ${problem}`));
  for (const problem of blocked) console.log(problem);
  if (blocked.length > 0) {
    console.log('\nFix the problems above before syncing. Nothing was sent.');
    return false;
  }
  const configs = stickerConfigs();
  if (flags['dry-run']) {
    for (const target of list) {
      const type = stickerType(target.projectId, target.id);
      console.log(`\n${target.key} (${type}) would send:\n${JSON.stringify(buildRequest(configs[type], target, '<image>'), null, 2)}`);
    }
    return true;
  }
  const posterConfig = loadConfig();
  const shopId = resolveShopId(posterConfig);
  if (!shopId) throw new Error('shopId is not set in printify/config.json.');
  const api = new PrintifyClient(process.env.PRINTIFY_API_TOKEN ?? '');
  const types = [...new Set(list.map((target) => stickerType(target.projectId, target.id)))];
  const catalogs = new Map(await Promise.all(types.map(async (type) => [type, await api.getVariants(configs[type].blueprintId, configs[type].printProviderId)] as const)));
  const problems = types.flatMap((type) => catalogErrors(type, configs[type], catalogs.get(type)!).map((problem) => `${type} ${problem}`));
  for (const problem of problems) console.log(`catalog error: ${problem}`);
  if (problems.length > 0) return false;

  const state = loadState();
  let allOk = true;
  for (const target of list) {
    console.log(`\n${target.key}`);
    const saved = posterState(state, shopId, target.key);
    const type = stickerType(target.projectId, target.id);
    try {
      if (saved.productId && saved.stickerType !== type) {
        throw new Error(`Its product ${saved.productId} is ${saved.stickerType}, but the sticker is now ${type}. A product can't change type: delete it in Printify, then clear this entry from printify/state.json.`);
      }
      const filePath = stickerExportPath(target.projectId, target.id, type);
      const png = fs.readFileSync(filePath);
      const sha256 = crypto.createHash('sha256').update(png).digest('hex');
      if (saved.images.master?.sha256 !== sha256) {
        const image = await api.uploadImage({ file_name: path.basename(filePath), contents: png.toString('base64') });
        saved.images.master = { sha256, imageId: image.id };
        saveState(state);
      }
      const product = buildRequest(configs[type], target, saved.images.master!.imageId);
      if (saved.productId) await api.updateProduct(shopId, saved.productId, withAllCatalogVariants(product, catalogs.get(type)!));
      else {
        saved.productId = (await api.createProduct(shopId, product)).id;
        saved.stickerType = type;
      }
      saveState(state);
      console.log(`  product ${saved.productId} saved as a Printify draft`);
      if (flags.publish) {
        await api.publishProduct(shopId, saved.productId, posterConfig.publish);
        saved.publishedAt = new Date().toISOString();
        const published = await api.getProduct(shopId, saved.productId);
        if (published.external?.handle) saved.etsyUrl = published.external.handle;
        saveState(state);
        console.log(`  publish requested${saved.etsyUrl ? ` → ${saved.etsyUrl}` : '; check Etsy Shop Manager'}`);
      }
    } catch (error) {
      allOk = false;
      console.log(`  error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return allOk;
}

async function main(): Promise<void> {
  if (command === 'check') process.exitCode = check() ? 0 : 1;
  else if (command === 'art') process.exitCode = (await art()) ? 0 : 1;
  else if (command === 'fit') process.exitCode = (await fitLayouts()) ? 0 : 1;
  else if (command === 'sync') process.exitCode = (await sync()) ? 0 : 1;
  else {
    console.log('Usage: npm run sticker:check | sticker-art -- [projectId [id...]] [--all] [--base-url <url>] | sticker:fit -- [projectId [id...]] [--all] [--base-url <url>] | sticker:sync -- <projectId> [id...] [--dry-run] [--publish]');
    if (command !== 'help') process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
