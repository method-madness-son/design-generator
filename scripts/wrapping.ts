/**
 * Build wrapping paper print files and send them to Printify as draft products.
 *
 *   npm run wrap:check                                # offline: designs, files, Etsy copy
 *   npm run wrap:catalog                              # shortcut: search for wrapping paper blueprints
 *   npm run wrap:catalog -- --blueprint <id>          # list print providers
 *   npm run wrap:catalog -- --blueprint <id> --provider <id>  # variant ids + placeholder px
 *   npm run wrap-art -- <designId> [--all]            # render print-ready tile PNG (needs studio running)
 *   npm run wrap:sync -- <designId> [--dry-run]       # upload + create/update draft
 *   npm run wrap:sync -- <designId> [--publish]       # ...and push to Etsy
 *
 * All variants (3 sizes × 2 finishes) share one 9075×10800 px tile. Printify repeats it.
 * See docs/WRAPPING-PIPELINE.md.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { checkListing } from '@/lib/etsyListing';
import { pngDimensions } from '@/lib/posterExports';
import { PrintifyClient } from '@/lib/printify/client';
import { loadConfig, loadState, posterState, resolveShopId, saveState, withAllCatalogVariants } from '@/lib/printify/posters';
import { getWrapDesignIds, resolveWrap, wrapExportPath, wrapListing } from '@/lib/wrapDesigns';
import { WRAP_DPI, WRAP_PIXELS_PER_METER, WRAP_PNG_LIMIT_BYTES, WRAP_TILE_HEIGHT_PX, WRAP_TILE_WIDTH_PX } from '@/lib/wrapSizes';
import { chromiumLaunchOptions, startNext, stopNext, waitForServer } from './shared/previewServer';
import type { PrintifyProductRequest, PrintifyVariant } from '@/types/printify';
import type { ResolvedWrap } from '@/types/wrap';

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
    blueprint: { type: 'string' },
    provider: { type: 'string' },
  },
});
const [command = 'help', ...idArgs] = positionals;

const NEXT_LOG = path.join(os.tmpdir(), 'wrap-next-dev.log');

type WrapVariant = { variantId: number; priceCents: number; sizeId: string; finish: string };
type WrapConfig = {
  blueprintId: number | null;
  printProviderId: number | null;
  placeholderPosition: string;
  placeholderWidth: number | null;
  placeholderHeight: number | null;
  variants: Record<string, WrapVariant>;
};

const wrapConfig = () =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'printify', 'wrapping.json'), 'utf8')) as WrapConfig;

type Target = { id: string; key: string };

function targets(): Target[] {
  const known = getWrapDesignIds();
  if (idArgs.length > 0) {
    for (const id of idArgs) {
      if (!known.includes(id)) throw new Error(`No wrapping paper design "${id}" under wrapping/.`);
    }
    return idArgs.map((id) => ({ id, key: `wrapping/${id}` }));
  }
  return known.map((id) => ({ id, key: `wrapping/${id}` }));
}

function fileErrors(target: Target): string[] {
  const file = wrapExportPath(target.id);
  if (!fs.existsSync(file)) return ['No print file: run `npm run wrap-art`.'];
  const dim = pngDimensions(fs.readFileSync(file).subarray(0, 24));
  return dim?.width === WRAP_TILE_WIDTH_PX && dim.height === WRAP_TILE_HEIGHT_PX
    ? []
    : [`Print file is ${dim?.width}×${dim?.height}; must be ${WRAP_TILE_WIDTH_PX}×${WRAP_TILE_HEIGHT_PX}.`];
}

function listingErrors(target: Target): { errors: string[]; warnings: string[] } {
  const { etsy } = wrapListing(target.id);
  if (!etsy) return { errors: ['No Etsy listing yet: write wrapping/.../etsy.json.'], warnings: [] };
  return checkListing({ id: target.id, title: target.id, subtitle: '', etsy });
}

function check(): boolean {
  const list = targets();
  let ready = 0;
  for (const target of list) {
    const wrap = resolveWrap(target.id);
    if (!wrap) {
      console.log(`\n${target.id}: could not load wrap.json`);
      continue;
    }
    const fErrors = fileErrors(target);
    const { errors: copyErrors, warnings } = listingErrors(target);
    const problems = [...wrap.errors, ...fErrors, ...copyErrors];
    if (problems.length === 0) ready += 1;
    console.log(`\n${target.id}: ${wrap.title}`);
    for (const warning of [...wrap.warnings, ...warnings]) console.log(`  warning: ${warning}`);
    for (const problem of problems) console.log(`  not ready: ${problem}`);
  }
  console.log(`\n${ready}/${list.length} wrapping paper designs ready to upload.`);
  return ready === list.length;
}

async function catalog(): Promise<void> {
  const api = new PrintifyClient(process.env.PRINTIFY_API_TOKEN ?? '');
  const blueprint = Number(flags.blueprint);
  const provider = Number(flags.provider);
  if (blueprint && provider) {
    const variants = await api.getVariants(blueprint, provider);
    for (const variant of variants) {
      const holders = variant.placeholders
        .map((h) => `${h.position} ${h.width}×${h.height}`)
        .join(', ');
      console.log(`${variant.id}\t${variant.title}\t${holders}`);
    }
  } else if (blueprint) {
    for (const option of await api.getProviders(blueprint)) {
      console.log(`${option.id}\t${option.title}`);
    }
  } else {
    const all = await api.getBlueprints();
    for (const option of all) {
      if (`${option.title} ${option.brand} ${option.model}`.toLowerCase().includes('wrapping'))
        console.log(`${option.id}\t${option.title}\t${option.brand}`);
    }
    console.log('\nUse --blueprint <id> to list providers, then --blueprint <id> --provider <id> for variants.');
  }
}

function crc32(data: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return ~crc >>> 0;
}

function withDpi(png: Buffer): Buffer {
  const signature = png.subarray(0, 8);
  const chunkType = Buffer.from('pHYs');
  const data = Buffer.alloc(9);
  data.writeUInt32BE(WRAP_PIXELS_PER_METER, 0);
  data.writeUInt32BE(WRAP_PIXELS_PER_METER, 4);
  data.writeUInt8(1, 8);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([chunkType, data])), 0);
  const chunk = Buffer.concat([length, chunkType, data, crcBuf]);
  const ihdrLength = png.readUInt32BE(8) + 12;
  return Buffer.concat([signature, png.subarray(8, 8 + ihdrLength), chunk, png.subarray(8 + ihdrLength)]);
}

async function art(): Promise<boolean> {
  const list = targets();
  if (!flags.all && idArgs.length === 0) throw new Error('Pass design ids, or --all.');
  const wraps = list.map((target) => {
    const wrap = resolveWrap(target.id);
    if (!wrap) throw new Error(`No wrapping paper design "${target.id}".`);
    if (wrap.errors.length > 0) throw new Error(`${target.id} did not validate: ${wrap.errors.join('; ')}`);
    return { target, wrap };
  });

  let child: import('node:child_process').ChildProcess | null = null;
  const useOwnServer = flags['base-url'] === 'http://localhost:4310';
  const port = 4318;
  const baseUrl = useOwnServer ? `http://127.0.0.1:${port}` : flags['base-url']!;
  const browser = await chromium.launch(chromiumLaunchOptions);
  let ok = true;
  try {
    if (useOwnServer) {
      console.log(`Starting next dev at ${baseUrl}`);
      child = startNext(port, NEXT_LOG);
    }
    await waitForServer(`${baseUrl}/wrapping/${wraps[0].wrap.id}/art`, child, NEXT_LOG);

    for (const { target, wrap } of wraps) {
      const page = await browser.newPage({
        viewport: { width: Math.min(WRAP_TILE_WIDTH_PX, 4000), height: Math.min(WRAP_TILE_HEIGHT_PX + 40, 4000) },
        deviceScaleFactor: 1,
      });
      const url = `${baseUrl.replace(/\/$/, '')}/wrapping/${wrap.id}/art`;
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 }).catch((error: Error) => {
        throw new Error(`Could not reach ${url}. Is the studio running? ${error.message}`);
      });
      if (!response?.ok()) throw new Error(`${url} answered ${response?.status()}.`);
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content: 'nextjs-portal { display: none !important; } html, body { background: transparent !important; }',
      });
      const artNode = page.locator('[data-wrap-art]');
      await artNode.waitFor({ timeout: 30_000 });
      const shot = await artNode.screenshot({ type: 'png' });
      const dim = PNG.sync.read(shot);
      await page.close();
      if (dim.width !== WRAP_TILE_WIDTH_PX || dim.height !== WRAP_TILE_HEIGHT_PX) {
        console.log(`  error: ${wrap.id} captured ${dim.width}×${dim.height}, expected ${WRAP_TILE_WIDTH_PX}×${WRAP_TILE_HEIGHT_PX}.`);
        ok = false;
        continue;
      }
      if (shot.length > WRAP_PNG_LIMIT_BYTES) {
        console.log(`  error: ${wrap.id} PNG is over Printify's 100 MB limit.`);
        ok = false;
        continue;
      }
      const output = wrapExportPath(wrap.id);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, withDpi(shot));
      console.log(`  wrote ${output} (${Math.round(fs.statSync(output).size / 1024)} KB)`);
    }
  } finally {
    await browser.close();
    stopNext(child);
  }
  return ok;
}

function enabledVariants(config: WrapConfig, wrap: ResolvedWrap): WrapVariant[] {
  return Object.values(config.variants).filter((v) => wrap.sizes.includes(v.sizeId as any));
}

function buildRequest(config: WrapConfig, target: Target, wrap: ResolvedWrap, imageId: string): PrintifyProductRequest {
  const { etsy } = wrapListing(target.id);
  const variants = enabledVariants(config, wrap);
  return {
    title: etsy!.title,
    description: etsy!.description,
    tags: etsy!.tags,
    blueprint_id: config.blueprintId!,
    print_provider_id: config.printProviderId!,
    variants: variants.map((v) => ({ id: v.variantId, price: v.priceCents, is_enabled: true })),
    print_areas: [
      {
        variant_ids: variants.map((v) => v.variantId),
        placeholders: [
          {
            position: config.placeholderPosition,
            images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
          },
        ],
      },
    ],
  };
}

function catalogErrors(config: WrapConfig, apiVariants: PrintifyVariant[]): string[] {
  return Object.entries(config.variants).flatMap(([name, v]) => {
    if (!v.variantId) return [`${name}: variantId is not set.`];
    if (!v.priceCents) return [`${name}: priceCents is not set.`];
    const holder = apiVariants.find((av) => av.id === v.variantId)?.placeholders
      .find((p) => p.position === config.placeholderPosition);
    if (!holder) return [`${name}: variant ${v.variantId} has no "${config.placeholderPosition}" print area.`];
    if (config.placeholderWidth && holder.width !== config.placeholderWidth) {
      return [`${name}: print area width is ${holder.width}, expected ${config.placeholderWidth}.`];
    }
    if (config.placeholderHeight && holder.height !== config.placeholderHeight) {
      return [`${name}: print area height is ${holder.height}, expected ${config.placeholderHeight}.`];
    }
    return [];
  });
}

function configErrors(config: WrapConfig): string[] {
  const errors: string[] = [];
  if (!config.blueprintId) errors.push('blueprintId is not set. Run `npm run wrap:catalog`.');
  if (!config.printProviderId) errors.push('printProviderId is not set. Run `npm run wrap:catalog -- --blueprint <id>`.');
  const variants = Object.entries(config.variants);
  if (variants.length === 0) errors.push('variants is empty.');
  for (const [name, v] of variants) {
    if (!v.variantId) errors.push(`variants.${name}.variantId is not set.`);
    if (!v.priceCents || v.priceCents <= 0) errors.push(`variants.${name}.priceCents must be a positive integer.`);
  }
  return errors;
}

async function sync(): Promise<boolean> {
  const config = wrapConfig();
  const errors = configErrors(config);
  for (const error of errors) console.log(`config error: ${error}`);
  if (errors.length > 0) {
    console.log('\nFix the config errors above. Nothing was sent.');
    return false;
  }

  const list = targets();
  const blocked = list.flatMap((target) => {
    const wrap = resolveWrap(target.id);
    if (!wrap) return [`${target.id}: could not load wrap.json`];
    return [
      ...wrap.errors,
      ...fileErrors(target),
      ...listingErrors(target).errors,
    ].map((problem) => `${target.id}: ${problem}`);
  });
  for (const problem of blocked) console.log(problem);
  if (blocked.length > 0) {
    console.log('\nFix the problems above before syncing. Nothing was sent.');
    return false;
  }

  if (flags['dry-run']) {
    for (const target of list) {
      const wrap = resolveWrap(target.id)!;
      console.log(`\n${target.key} would send:\n${JSON.stringify(buildRequest(config, target, wrap, '<image>'), null, 2)}`);
    }
    return true;
  }

  const posterConfig = loadConfig();
  const shopId = resolveShopId(posterConfig);
  if (!shopId) throw new Error('shopId is not set in printify/config.json.');
  const api = new PrintifyClient(process.env.PRINTIFY_API_TOKEN ?? '');
  const apiVariants = await api.getVariants(config.blueprintId!, config.printProviderId!);
  const catErrors = catalogErrors(config, apiVariants);
  for (const problem of catErrors) console.log(`catalog error: ${problem}`);
  if (catErrors.length > 0) return false;

  const state = loadState();
  let allOk = true;
  for (const target of list) {
    console.log(`\n${target.key}`);
    const saved = posterState(state, shopId, target.key);
    const wrap = resolveWrap(target.id)!;
    try {
      const filePath = wrapExportPath(wrap.id);
      const png = fs.readFileSync(filePath);
      const sha256 = crypto.createHash('sha256').update(png).digest('hex');
      let imageId: string;
      if (saved.images.master?.sha256 === sha256) {
        imageId = saved.images.master.imageId;
        console.log(`  tile: unchanged, reusing image ${imageId}`);
      } else {
        const image = await api.uploadImage({
          file_name: path.basename(filePath),
          contents: png.toString('base64'),
        });
        saved.images.master = { sha256, imageId: image.id };
        saveState(state);
        imageId = image.id;
        console.log(`  tile: uploaded image ${imageId}`);
      }

      const product = buildRequest(config, target, wrap, imageId);
      if (saved.productId) {
        await api.updateProduct(shopId, saved.productId, withAllCatalogVariants(product, apiVariants));
      } else {
        saved.productId = (await api.createProduct(shopId, product)).id;
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

function printUsage(): void {
  console.log(`Usage:
  npm run wrap:check                                    # validate designs, files, listings
  npm run wrap:catalog                                  # search for wrapping paper blueprints
  npm run wrap:catalog -- --blueprint <id>              # list print providers
  npm run wrap:catalog -- --blueprint <id> --provider <id>  # variant ids + placeholder px
  npm run wrap-art -- <designId> [--all]                # render print-ready tile PNG
  npm run wrap:sync -- <designId> [--dry-run]           # upload + create draft
  npm run wrap:sync -- <designId> [--publish]           # upload + create + push to Etsy

Tile: ${WRAP_TILE_WIDTH_PX}×${WRAP_TILE_HEIGHT_PX} px at ${WRAP_DPI} DPI (one image, tiled by Printify)
Designs: ${getWrapDesignIds().join(', ') || '(none)'}`);
}

async function main(): Promise<void> {
  if (command === 'check') process.exitCode = check() ? 0 : 1;
  else if (command === 'catalog') await catalog();
  else if (command === 'art') process.exitCode = (await art()) ? 0 : 1;
  else if (command === 'sync') process.exitCode = (await sync()) ? 0 : 1;
  else {
    printUsage();
    if (command !== 'help') process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
