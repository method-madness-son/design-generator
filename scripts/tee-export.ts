/**
 * Export print-ready tee PNGs and wireframe previews.
 *
 *   npm run tee:check
 *   npm run tee-art -- brain-tabs
 *   npm run tee-art -- --all
 *   npm run tee-preview -- brain-tabs
 *   npm run tee-preview -- --all
 *   npm run tee-preview -- brain-tabs --shirt Black
 *   npm run tee-art -- --all --base-url http://127.0.0.1:4310
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';
import { chromium, type Page } from 'playwright';
import type { ChildProcess } from 'node:child_process';
import { getTeeDesignIds, inkHexes, loadAllResolvedTees, loadResolvedTee, shirtSlug } from '../lib/teeDesigns';
import { readPosterPaletteBridge, resolveShirt, validateGlobalTheme, DEV_REALITIES_PROJECT } from '../lib/theme';
import { chromiumLaunchOptions, startNext, stopNext, waitForServer } from './shared/previewServer';
import type { InkSetName } from '../types/theme';
import type { ResolvedTee } from '../types/tee';

const ART_DIR = path.join(process.cwd(), 'exports', 'tees');
const PREVIEW_DIR = path.join(ART_DIR, 'previews');
const NEXT_LOG = path.join(os.tmpdir(), 'tee-next-dev.log');
const PNG_LIMIT_BYTES = 100 * 1024 * 1024;
const PIXELS_PER_METER = Math.round(300 / 0.0254);

type Cli = {
  check: boolean;
  art: boolean;
  preview: boolean;
  all: boolean;
  ids: string[];
  shirt?: string;
  baseUrl?: string;
  port: number;
};

function parseArgs(argv: string[]): Cli {
  const cli: Cli = { check: false, art: false, preview: false, all: false, ids: [], port: 4313 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') cli.check = true;
    else if (arg === '--art') cli.art = true;
    else if (arg === '--preview') cli.preview = true;
    else if (arg === '--all') cli.all = true;
    else if (arg === '--shirt') {
      const value = argv[index + 1];
      if (!value) throw new Error('--shirt needs a color name.');
      cli.shirt = value;
      index += 1;
    } else if (arg === '--base-url') {
      const value = argv[index + 1];
      if (!value) throw new Error('--base-url needs a value.');
      cli.baseUrl = value;
      index += 1;
    } else if (arg === '--port') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1) throw new Error('--port needs an integer.');
      cli.port = value;
      index += 1;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag ${arg}`);
    } else {
      cli.ids.push(arg);
    }
  }
  return cli;
}

function printUsage(): void {
  console.log(`Usage:
  npm run tee:check
  npm run tee-art -- <design-id> [--all] [--shirt "Black"]
  npm run tee-preview -- <design-id> [--all] [--shirt White]

Designs: ${getTeeDesignIds().join(', ') || '(none)'}`);
}

function reportTee(tee: ResolvedTee): boolean {
  console.log(`\n${tee.id}: ${tee.lines.map((line) => line.text).join(' / ')} · ${tee.paletteLabel}`);
  if (tee.marketStatus) console.log(`  market ${tee.market} · ${tee.marketStatus}`);
  for (const warning of tee.warnings) console.log(`  warning: ${warning}`);
  for (const error of tee.errors) console.log(`  error: ${error}`);
  return tee.errors.length === 0;
}

function runChecks(): boolean {
  const theme = validateGlobalTheme();
  console.log('Global theme');
  for (const warning of theme.warnings) console.log(`  warning: ${warning}`);
  for (const error of theme.errors) console.log(`  error: ${error}`);

  const bridge = readPosterPaletteBridge(DEV_REALITIES_PROJECT);
  if (!bridge) {
    theme.errors.push(`Could not read ${DEV_REALITIES_PROJECT}.`);
  } else {
    console.log(`\nPoster bridge posters/${DEV_REALITIES_PROJECT} (file not modified):`);
    for (const role of bridge.roles) console.log(`  ${role.role} ${role.hex}`);
    console.log(`  fontFamily ${bridge.fontFamily}`);
    console.log('  Tee dev market uses per_market_overrides.dev, not this poster palette.');
  }

  const ids = getTeeDesignIds();
  if (new Set(ids).size !== ids.length) theme.errors.push('Tee design ids must be unique.');
  const tees = loadAllResolvedTees();
  const teeOk = tees.every((tee) => reportTee(tee));
  if (tees.length === 0) theme.errors.push('No tee designs found.');
  return theme.errors.length === 0 && teeOk;
}

function crc32(data: Buffer): number {
  let crc = ~0;
  for (let index = 0; index < data.length; index += 1) {
    crc ^= data[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return ~crc >>> 0;
}

function withDpi(png: Buffer): Buffer {
  const signature = png.subarray(0, 8);
  const chunkType = Buffer.from('pHYs');
  const data = Buffer.alloc(9);
  data.writeUInt32BE(PIXELS_PER_METER, 0);
  data.writeUInt32BE(PIXELS_PER_METER, 4);
  data.writeUInt8(1, 8);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([chunkType, data])), 0);
  const chunk = Buffer.concat([length, chunkType, data, crc]);
  const ihdrLength = png.readUInt32BE(8) + 12;
  return Buffer.concat([signature, png.subarray(8, 8 + ihdrLength), chunk, png.subarray(8 + ihdrLength)]);
}

function hardenPng(source: Buffer, allowedHex: string[]): Buffer {
  const png = PNG.sync.read(source);
  const palette = allowedHex.map((hex) => {
    const value = hex.replace('#', '');
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)] as const;
  });
  if (palette.length === 0) throw new Error('No ink colors to snap to.');
  const data = png.data;
  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 128) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
      continue;
    }
    let best = palette[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const color of palette) {
      const distance =
        (color[0] - data[index]) ** 2 + (color[1] - data[index + 1]) ** 2 + (color[2] - data[index + 2]) ** 2;
      if (distance < bestDistance) {
        best = color;
        bestDistance = distance;
      }
    }
    data[index] = best[0];
    data[index + 1] = best[1];
    data[index + 2] = best[2];
    data[index + 3] = 255;
  }
  return withDpi(PNG.sync.write(png));
}

function assertBinaryAlpha(buffer: Buffer, label: string) {
  const png = PNG.sync.read(buffer);
  for (let index = 3; index < png.data.length; index += 4) {
    const alpha = png.data[index];
    if (alpha !== 0 && alpha !== 255) throw new Error(`${label} still has a semi-transparent pixel.`);
  }
  return png;
}

async function assertFonts(page: Page, tee: ResolvedTee): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate((families) => {
    return families.filter((family) => !document.fonts.check(`400 64px "${family}"`));
  }, [tee.fonts.display, tee.fonts.supporting]);
  if (missing.length > 0) {
    throw new Error(`${tee.id} did not load ${missing.join(', ')}.`);
  }
}

async function renderArt(page: Page, baseUrl: string, tee: ResolvedTee, inkSet: InkSetName): Promise<string> {
  const ink = tee.inkBySet[inkSet];
  if (!ink) throw new Error(`${tee.id} has no ${inkSet} ink.`);
  const query = inkSet === 'on_dark_shirt' ? 'on-dark' : 'on-light';
  const url = `${baseUrl.replace(/\/$/, '')}/tees/${tee.id}/art?ink=${query}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  if ((await page.locator('[data-tee-error]').count()) > 0) {
    throw new Error(`Print route failed for ${tee.id}: ${await page.locator('[data-tee-error]').innerText()}`);
  }
  const canvas = page.locator('[data-tee-art]');
  await canvas.waitFor({ timeout: 30_000 });
  await assertFonts(page, tee);
  const box = await canvas.boundingBox();
  if (!box) throw new Error(`${tee.id} print canvas has no box.`);
  if (Math.abs(box.width - tee.print.widthPx) > 2 || Math.abs(box.height - tee.print.heightPx) > 2) {
    throw new Error(`${tee.id} canvas is ${box.width}×${box.height}, expected ${tee.print.widthPx}×${tee.print.heightPx}.`);
  }
  const shot = await canvas.screenshot({ type: 'png', omitBackground: true });
  const hardened = hardenPng(shot, inkHexes(ink));
  const decoded = assertBinaryAlpha(hardened, tee.id);
  if (decoded.width !== tee.print.widthPx || decoded.height !== tee.print.heightPx) {
    throw new Error(`${tee.id} PNG is ${decoded.width}×${decoded.height}.`);
  }
  if (hardened.length > PNG_LIMIT_BYTES) {
    throw new Error(`${tee.id} PNG is over Printify's 100 MB limit.`);
  }
  fs.mkdirSync(ART_DIR, { recursive: true });
  const suffix = inkSet === 'on_dark_shirt' ? 'on-dark' : 'on-light';
  const outputPath = path.join(ART_DIR, `${tee.id}-${suffix}.png`);
  fs.writeFileSync(outputPath, hardened);
  return outputPath;
}

async function renderPreview(page: Page, baseUrl: string, tee: ResolvedTee, shirtName: string): Promise<string> {
  const resolved = resolveShirt(shirtName);
  if (!resolved.shirt) throw new Error(resolved.warning ?? `Unknown shirt ${shirtName}.`);
  const url = `${baseUrl.replace(/\/$/, '')}/tees/${tee.id}/preview?shirt=${encodeURIComponent(resolved.shirt.name)}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  if ((await page.locator('[data-tee-error]').count()) > 0) {
    throw new Error(`Preview route failed for ${tee.id}: ${await page.locator('[data-tee-error]').innerText()}`);
  }
  const card = page.locator('[data-tee-preview]');
  await card.waitFor({ timeout: 30_000 });
  await assertFonts(page, tee);
  const shot = await card.screenshot({ type: 'png' });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const outputPath = path.join(PREVIEW_DIR, `${tee.id}-${shirtSlug(resolved.shirt.name)}.png`);
  fs.writeFileSync(outputPath, shot);
  return outputPath;
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  if (!runChecks()) {
    process.exitCode = 1;
    if (cli.check || (!cli.art && !cli.preview)) return;
    throw new Error('Theme or tee designs did not validate.');
  }
  if (cli.check && !cli.art && !cli.preview) return;
  if (!cli.art && !cli.preview) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const ids = cli.all ? getTeeDesignIds() : cli.ids;
  if (ids.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }
  const tees = ids.map((id) => {
    const tee = loadResolvedTee(id);
    if (!tee) throw new Error(`No tee design ${id}.`);
    if (!reportTee(tee)) throw new Error(`${id} did not validate.`);
    return tee;
  });

  let child: ChildProcess | null = null;
  const baseUrl = cli.baseUrl ?? `http://127.0.0.1:${cli.port}`;
  const browser = await chromium.launch(chromiumLaunchOptions);
  try {
    if (!cli.baseUrl) {
      console.log(`Starting next dev at ${baseUrl}`);
      child = startNext(cli.port, NEXT_LOG);
    }
    const first = tees[0];
    const probe = cli.art
      ? `${baseUrl}/tees/${first.id}/art?ink=on-light`
      : `${baseUrl}/tees/${first.id}/preview?shirt=White`;
    await waitForServer(probe, child, NEXT_LOG);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    for (const tee of tees) {
      if (cli.art) {
        let sets: InkSetName[] = ['on_light_shirt', 'on_dark_shirt'];
        if (cli.shirt) {
          const shirt = resolveShirt(cli.shirt);
          if (!shirt.shirt) throw new Error(shirt.warning ?? `Unknown shirt ${cli.shirt}.`);
          sets = [shirt.shirt.is_dark ? 'on_dark_shirt' : 'on_light_shirt'];
        }
        for (const inkSet of sets) {
          const outputPath = await renderArt(page, baseUrl, tee, inkSet);
          console.log(`Wrote ${outputPath} (${Math.round(fs.statSync(outputPath).size / 1024)} KB)`);
        }
      }
      if (cli.preview) {
        const shirtName = cli.shirt ?? 'White';
        const outputPath = await renderPreview(page, baseUrl, tee, shirtName);
        console.log(`Wrote ${outputPath} (${Math.round(fs.statSync(outputPath).size / 1024)} KB)`);
      }
    }
  } finally {
    await browser.close();
    stopNext(child);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
