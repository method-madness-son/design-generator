/**
 * Upload poster print files to Printify, create the products, and publish them to Etsy.
 *
 *   npm run printify:shops                                   # 1. find the Etsy shop_id
 *   npm run printify:catalog -- --search poster              #    pick a blueprint
 *   npm run printify:catalog -- --blueprint 282              #    pick a print provider
 *   npm run printify:catalog -- --blueprint 282 --provider 99  # variant ids per size
 *   npm run printify:check -- dev-realities                  # offline: config, files, Etsy copy
 *   npm run printify:sync -- dev-realities vim-wq --dry-run  # print payloads, call nothing
 *   npm run printify:sync -- dev-realities vim-wq            # 2 + 3. upload images, create draft
 *   npm run printify:sync -- dev-realities --publish         # 2 + 3 + 4 for every poster
 *
 * Only posters saved with the studio's "Save for Etsy listing" are eligible.
 * The token lives in .env.local as PRINTIFY_API_TOKEN. See docs/PRINTIFY-PIPELINE.md.
 */
import fs from 'node:fs';
import path from 'node:path';
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
  sha256,
  type PosterJob,
} from '@/lib/printify/posters';
import type { PosterSizeName } from '@/lib/posterSizes';
import type { PrintifyConfig, PrintifyState } from '@/types/printify';

type Cli = {
  command: string;
  args: string[];
  dryRun: boolean;
  publish: boolean;
  imageBaseUrl?: string;
  exportDir?: string;
  search?: string;
  blueprint?: number;
  provider?: number;
};

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(path.join(process.cwd(), file));
  } catch {
    // optional
  }
}

function parseArgs(argv: string[]): Cli {
  const [command = 'help', ...rest] = argv;
  const cli: Cli = { command, args: [], dryRun: false, publish: false };
  const value = (index: number, flag: string) => {
    const next = rest[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`${flag} needs a value.`);
    return next;
  };
  const integer = (raw: string, flag: string) => {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) throw new Error(`${flag} needs an integer.`);
    return parsed;
  };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === '--dry-run') cli.dryRun = true;
    else if (arg === '--publish') cli.publish = true;
    else if (arg === '--image-base-url') cli.imageBaseUrl = value(index++, arg).replace(/\/$/, '');
    else if (arg === '--dir') cli.exportDir = path.resolve(value(index++, arg));
    else if (arg === '--search') cli.search = value(index++, arg).toLowerCase();
    else if (arg === '--blueprint') cli.blueprint = integer(value(index++, arg), arg);
    else if (arg === '--provider') cli.provider = integer(value(index++, arg), arg);
    else if (arg.startsWith('-')) throw new Error(`Unknown flag ${arg}`);
    else cli.args.push(arg);
  }
  return cli;
}

function usage(): void {
  console.log(`Usage:
  npm run printify:shops
  npm run printify:catalog -- [--search poster] [--blueprint <id> [--provider <id>]]
  npm run printify:check -- <projectId> [posterId...]
  npm run printify:sync -- <projectId> [posterId...] [--publish] [--dry-run] [--image-base-url <url>] [--dir <path>]

Print files are saved by the studio to posters/<projectId>/exports/<posterId>-<size>.png (sizes: 8x10, 11x17).
With no poster ids, only posters that have a saved export are synced.`);
}

function client(): PrintifyClient {
  return new PrintifyClient(process.env.PRINTIFY_API_TOKEN ?? '');
}

async function shops(): Promise<void> {
  const list = await client().getShops();
  if (list.length === 0) {
    console.log('No shops. Connect Etsy in Printify → Manage my stores first.');
    return;
  }
  for (const shop of list) console.log(`${shop.id}\t${shop.sales_channel}\t${shop.title}`);
  const etsy = list.filter((shop) => shop.sales_channel === 'etsy');
  if (etsy.length === 1) console.log(`\nSet "shopId": ${etsy[0].id} in printify/config.json (or PRINTIFY_SHOP_ID).`);
  else if (etsy.length === 0) console.log('\nNo Etsy shop is connected.');
}

async function catalog(cli: Cli): Promise<void> {
  const api = client();
  if (cli.blueprint && cli.provider) {
    for (const variant of await api.getVariants(cli.blueprint, cli.provider)) {
      const holders = variant.placeholders.map((holder) => `${holder.position} ${holder.width}×${holder.height}`).join(', ');
      console.log(`${variant.id}\t${variant.title}\t${holders}`);
    }
    return;
  }
  if (cli.blueprint) {
    for (const provider of await api.getProviders(cli.blueprint)) console.log(`${provider.id}\t${provider.title}`);
    return;
  }
  const blueprints = await api.getBlueprints();
  for (const blueprint of blueprints) {
    const text = `${blueprint.title} ${blueprint.brand} ${blueprint.model}`.toLowerCase();
    if (!cli.search || text.includes(cli.search)) console.log(`${blueprint.id}\t${blueprint.title}\t${blueprint.brand}`);
  }
}

function report(job: PosterJob): boolean {
  const sizes = job.files.map((file) => `${file.size} ${(file.bytes / 1024 / 1024).toFixed(1)} MB`).join(', ') || 'no files';
  console.log(`\n${job.key}: ${job.poster.etsy?.title ?? job.poster.title} · ${sizes}`);
  for (const warning of job.warnings) console.log(`  warning: ${warning}`);
  for (const error of job.errors) console.log(`  error: ${error}`);
  return job.errors.length === 0;
}

function prepare(cli: Cli): { config: PrintifyConfig; shopId: number | null; jobs: PosterJob[]; ok: boolean } {
  const [projectId, ...posterIds] = cli.args;
  if (!projectId) throw new Error('Pass a poster project id, e.g. dev-realities.');
  const config = loadConfig();
  const shopId = resolveShopId(config);
  const problems = configErrors(config, shopId);
  for (const problem of problems) console.log(`config error: ${problem}`);
  const { jobs, skipped } = jobsFor(config, projectId, posterIds, cli.exportDir);
  if (skipped.length > 0) console.log(`Not saved for listing yet (skipped): ${skipped.join(', ')}`);
  if (jobs.length === 0) console.log(`No posters in ${projectId} are saved for listing yet.`);
  const jobsOk = jobs.map(report).every(Boolean);
  return { config, shopId, jobs, ok: problems.length === 0 && jobsOk };
}

async function uploadImages(
  api: PrintifyClient | null,
  cli: Cli,
  job: PosterJob,
  state: PrintifyState,
  shopId: number,
): Promise<Partial<Record<PosterSizeName, string>>> {
  const saved = posterState(state, shopId, job.key);
  const ids: Partial<Record<PosterSizeName, string>> = {};
  for (const file of job.files) {
    const hash = sha256(file.filePath);
    const previous = saved.images[file.size];
    if (previous?.sha256 === hash) {
      ids[file.size] = previous.imageId;
      console.log(`  ${file.size}: unchanged, reusing image ${previous.imageId}`);
      continue;
    }
    const fileName = path.basename(file.filePath);
    const upload = cli.imageBaseUrl
      ? { file_name: fileName, url: `${cli.imageBaseUrl}/${job.projectId}/${fileName}` }
      : { file_name: fileName, contents: fs.readFileSync(file.filePath).toString('base64') };
    if (!cli.imageBaseUrl && file.bytes > BASE64_SOFT_LIMIT_BYTES) {
      console.log(`  ${file.size}: warning: ${(file.bytes / 1024 / 1024).toFixed(1)} MB as base64. Printify suggests --image-base-url above 5 MB.`);
    }
    if (!api) {
      ids[file.size] = `<image ${file.size}>`;
      console.log(`  ${file.size}: would upload ${'url' in upload ? upload.url : `${fileName} as base64`}`);
      continue;
    }
    const image = await api.uploadImage(upload);
    if (image.width !== file.width || image.height !== file.height) {
      throw new Error(`${job.key} ${file.size}: Printify stored ${image.width}×${image.height}, sent ${file.width}×${file.height}.`);
    }
    saved.images[file.size] = { sha256: hash, imageId: image.id, uploadedAt: new Date().toISOString() };
    saveState(state);
    ids[file.size] = image.id;
    console.log(`  ${file.size}: uploaded image ${image.id}`);
  }
  return ids;
}

async function sync(cli: Cli): Promise<boolean> {
  const { config, shopId, jobs, ok } = prepare(cli);
  if (!ok || !shopId) {
    console.log('\nFix the errors above before syncing. Nothing was sent.');
    return false;
  }
  const api = cli.dryRun ? null : client();
  if (api) {
    // Fail before uploading anything if the variants cannot hold this art.
    const problems = placeholderErrors(config, await api.getVariants(config.blueprintId!, config.printProviderId!));
    for (const problem of problems) console.log(`catalog error: ${problem}`);
    if (problems.length > 0) return false;
  }
  const state = loadState();
  let allOk = true;
  for (const job of jobs) {
    console.log(`\n${job.key}`);
    try {
      const imageIds = await uploadImages(api, cli, job, state, shopId);
      const product = buildProductRequest(config, job, imageIds);
      const saved = posterState(state, shopId, job.key);
      if (!api) {
        console.log(`  would ${saved.productId ? `update product ${saved.productId}` : 'create product'}:`);
        console.log(JSON.stringify(product, null, 2).replace(/^/gm, '    '));
        if (cli.publish) console.log(`  would publish with ${JSON.stringify(config.publish)}`);
        continue;
      }
      if (saved.productId) {
        await api.updateProduct(shopId, saved.productId, product);
        console.log(`  updated product ${saved.productId}`);
      } else {
        const created = await api.createProduct(shopId, product);
        saved.productId = created.id;
        console.log(`  created draft product ${created.id}`);
      }
      saved.productUpdatedAt = new Date().toISOString();
      saveState(state);
      if (cli.publish) {
        await api.publishProduct(shopId, saved.productId, config.publish);
        saved.publishedAt = new Date().toISOString();
        saveState(state);
        console.log(`  publish requested; check Etsy Shop Manager`);
      }
    } catch (error) {
      allOk = false;
      console.log(`  error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return allOk;
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  if (cli.command === 'shops') await shops();
  else if (cli.command === 'catalog') await catalog(cli);
  else if (cli.command === 'check') {
    if (!prepare(cli).ok) process.exitCode = 1;
  } else if (cli.command === 'sync') {
    if (!(await sync(cli))) process.exitCode = 1;
  } else {
    usage();
    if (cli.command !== 'help') process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
