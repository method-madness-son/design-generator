/**
 * Upload saved poster print files to Printify, create the products, and publish them to Etsy.
 *
 *   npm run printify:shops                                     # 1. find the Etsy shop_id
 *   npm run printify:catalog -- --search poster                #    pick a blueprint
 *   npm run printify:catalog -- --blueprint 282                #    pick a print provider
 *   npm run printify:catalog -- --blueprint 282 --provider 99  #    variant ids per size
 *   npm run printify:check -- dev-realities                    # offline: config, files, Etsy copy
 *   npm run printify:sync -- dev-realities vim-wq --dry-run    # print payloads, call nothing
 *   npm run printify:sync -- dev-realities vim-wq              # 2 + 3. upload images, create draft
 *   npm run printify:sync -- dev-realities --publish           # 2 + 3 + 4 for every saved poster
 *
 * Only posters saved with the studio's "Save for Etsy listing" are eligible.
 * The token lives in .env.local as PRINTIFY_API_TOKEN. See docs/PRINTIFY-PIPELINE.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { PrintifyClient } from '@/lib/printify/client';
import {
  BASE64_SOFT_LIMIT_BYTES,
  buildProductRequest,
  configErrors,
  jobsFor,
  loadConfig,
  loadState,
  placeholderErrors,
  posterState,
  resolveShopId,
  saveState,
  withAllCatalogVariants,
  type PosterJob,
} from '@/lib/printify/posters';
import type { PosterSizeName } from '@/lib/posterSizes';
import type { PrintifyConfig, PrintifyState } from '@/types/printify';

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
    'dry-run': { type: 'boolean', default: false },
    publish: { type: 'boolean', default: false },
    'image-base-url': { type: 'string' },
    search: { type: 'string' },
    blueprint: { type: 'string' },
    provider: { type: 'string' },
  },
});
const [command = 'help', ...args] = positionals;
const imageBaseUrl = flags['image-base-url']?.replace(/\/$/, '');

const USAGE = `Usage:
  npm run printify:shops
  npm run printify:catalog -- [--search poster] [--blueprint <id> [--provider <id>]]
  npm run printify:check -- <projectId> [posterId...]
  npm run printify:sync -- <projectId> [posterId...] [--publish] [--dry-run] [--image-base-url <url>]

Print files are saved by the studio to posters/<projectId>/<posterId>/exports/<posterId>-<size>.png.
With no poster ids, only posters that have a saved export are synced.`;

const client = () => new PrintifyClient(process.env.PRINTIFY_API_TOKEN ?? '');

async function shops(): Promise<void> {
  const list = await client().getShops();
  for (const shop of list) console.log(`${shop.id}\t${shop.sales_channel}\t${shop.title}`);
  const etsy = list.filter((shop) => shop.sales_channel === 'etsy');
  if (etsy.length === 1) console.log(`\nSet "shopId": ${etsy[0].id} in printify/config.json (or PRINTIFY_SHOP_ID).`);
  else if (etsy.length === 0) console.log('No Etsy shop is connected. Connect it in Printify → Manage my stores.');
}

async function catalog(): Promise<void> {
  const api = client();
  const blueprint = Number(flags.blueprint);
  const provider = Number(flags.provider);
  if (blueprint && provider) {
    for (const variant of await api.getVariants(blueprint, provider)) {
      const holders = variant.placeholders.map((holder) => `${holder.position} ${holder.width}×${holder.height}`).join(', ');
      console.log(`${variant.id}\t${variant.title}\t${holders}`);
    }
  } else if (blueprint) {
    for (const option of await api.getProviders(blueprint)) console.log(`${option.id}\t${option.title}`);
  } else {
    const search = flags.search?.toLowerCase() ?? '';
    for (const option of await api.getBlueprints()) {
      if (`${option.title} ${option.brand} ${option.model}`.toLowerCase().includes(search)) console.log(`${option.id}\t${option.title}\t${option.brand}`);
    }
  }
}

function report(job: PosterJob): boolean {
  const sizes = job.files.map((file) => `${file.size} ${(file.bytes / 1024 / 1024).toFixed(1)} MB`).join(', ') || 'no files';
  console.log(`\n${job.key}: ${job.poster.etsy?.title ?? job.poster.title} · ${sizes}`);
  for (const warning of job.warnings) console.log(`  warning: ${warning}`);
  for (const error of job.errors) console.log(`  error: ${error}`);
  return job.errors.length === 0;
}

function prepare(): { config: PrintifyConfig; shopId: number | null; jobs: PosterJob[]; ok: boolean } {
  const [projectId, ...posterIds] = args;
  if (!projectId) throw new Error('Pass a poster project id, e.g. dev-realities.');
  const config = loadConfig();
  const shopId = resolveShopId(config);
  const problems = configErrors(config, shopId);
  for (const problem of problems) console.log(`config error: ${problem}`);
  const { jobs, skipped } = jobsFor(config, projectId, posterIds);
  if (skipped.length > 0) console.log(`Not saved for listing yet (skipped): ${skipped.join(', ')}`);
  const jobsOk = jobs.map(report).every(Boolean);
  return { config, shopId, jobs, ok: problems.length === 0 && jobsOk };
}

async function uploadImages(api: PrintifyClient, job: PosterJob, saved: ReturnType<typeof posterState>, state: PrintifyState) {
  const ids: Partial<Record<PosterSizeName, string>> = {};
  for (const file of job.files) {
    const previous = saved.images[file.size];
    if (previous?.sha256 === file.sha256) {
      ids[file.size] = previous.imageId;
      console.log(`  ${file.size}: unchanged, reusing image ${previous.imageId}`);
      continue;
    }
    const fileName = path.basename(file.filePath);
    if (!imageBaseUrl && file.bytes > BASE64_SOFT_LIMIT_BYTES) {
      console.log(`  ${file.size}: warning: ${(file.bytes / 1024 / 1024).toFixed(1)} MB as base64. Printify suggests --image-base-url above 5 MB.`);
    }
    const image = await api.uploadImage(
      imageBaseUrl
        ? { file_name: fileName, url: `${imageBaseUrl}/${job.projectId}/${fileName}` }
        : { file_name: fileName, contents: fs.readFileSync(file.filePath).toString('base64') },
    );
    if (image.width !== file.width || image.height !== file.height) {
      throw new Error(`${file.size}: Printify stored ${image.width}×${image.height}, sent ${file.width}×${file.height}.`);
    }
    saved.images[file.size] = { sha256: file.sha256, imageId: image.id };
    saveState(state);
    ids[file.size] = image.id;
    console.log(`  ${file.size}: uploaded image ${image.id}`);
  }
  return ids;
}

function dryRun(config: PrintifyConfig, jobs: PosterJob[]): void {
  for (const job of jobs) {
    const placeholders = Object.fromEntries(job.files.map((file) => [file.size, `<image ${file.size}>`]));
    console.log(`\n${job.key}: would upload ${job.files.map((file) => file.size).join(', ')} and send:`);
    console.log(JSON.stringify(buildProductRequest(config, job, placeholders), null, 2).replace(/^/gm, '    '));
    if (flags.publish) console.log(`  would publish with ${JSON.stringify(config.publish)}`);
  }
}

async function sync(): Promise<boolean> {
  const { config, shopId, jobs, ok } = prepare();
  if (!ok || !shopId) {
    console.log('\nFix the errors above before syncing. Nothing was sent.');
    return false;
  }
  if (flags['dry-run']) {
    dryRun(config, jobs);
    return true;
  }
  const api = client();
  // Fail before uploading anything if the variants cannot hold this art.
  const variants = await api.getVariants(config.blueprintId!, config.printProviderId!);
  const problems = placeholderErrors(config, variants);
  for (const problem of problems) console.log(`catalog error: ${problem}`);
  if (problems.length > 0) return false;

  const state = loadState();
  let allOk = true;
  for (const job of jobs) {
    console.log(`\n${job.key}`);
    const saved = posterState(state, shopId, job.key);
    try {
      const product = buildProductRequest(config, job, await uploadImages(api, job, saved, state));
      if (saved.productId) await api.updateProduct(shopId, saved.productId, withAllCatalogVariants(product, variants));
      else saved.productId = (await api.createProduct(shopId, product)).id;
      saveState(state);
      console.log(`  product ${saved.productId} saved as a Printify draft`);
      if (flags.publish) {
        await api.publishProduct(shopId, saved.productId, config.publish);
        saved.publishedAt = new Date().toISOString();
        saveState(state);
        console.log('  publish requested; check Etsy Shop Manager');
      }
    } catch (error) {
      allOk = false;
      console.log(`  error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return allOk;
}

async function main(): Promise<void> {
  if (command === 'shops') await shops();
  else if (command === 'catalog') await catalog();
  else if (command === 'check') process.exitCode = prepare().ok ? 0 : 1;
  else if (command === 'sync') process.exitCode = (await sync()) ? 0 : 1;
  else {
    console.log(USAGE);
    if (command !== 'help') process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
