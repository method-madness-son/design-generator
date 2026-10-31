/**
 * Export print-ready mug PNGs and wireframe previews.
 *
 *   npm run mug:check
 *   npm run mug-art -- works-on-my-machine
 *   npm run mug-art -- --all
 *   npm run mug-preview -- works-on-my-machine
 *   npm run mug-preview -- --all
 *   npm run mug-art -- --all --base-url http://127.0.0.1:4310
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ChildProcess } from "node:child_process";
import { PNG } from "pngjs";
import { chromium, type Page } from "playwright";
import { contrastRatio, getMugDesignIds, loadAllResolvedMugs, loadResolvedMug, mugInkHexes } from "../lib/mugDesigns";
import { assertMugCanvases, MUG_CANVASES, MUG_PIXELS_PER_METER, MUG_PNG_LIMIT_BYTES } from "../lib/mugSizes";
import { chromiumLaunchOptions, startNext, stopNext, waitForServer } from "./shared/previewServer";
import type { MugSizeId, ResolvedMug } from "../types/mug";

const ART_DIR = path.join(process.cwd(), "exports", "mugs");
const PREVIEW_DIR = path.join(ART_DIR, "previews");
const NEXT_LOG = path.join(os.tmpdir(), "mug-next-dev.log");

type Cli = {
  check: boolean;
  art: boolean;
  preview: boolean;
  all: boolean;
  ids: string[];
  baseUrl?: string;
  port: number;
};

function parseArgs(argv: string[]): Cli {
  const cli: Cli = { check: false, art: false, preview: false, all: false, ids: [], port: 4316 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") cli.check = true;
    else if (arg === "--art") cli.art = true;
    else if (arg === "--preview") cli.preview = true;
    else if (arg === "--all") cli.all = true;
    else if (arg === "--base-url") {
      const value = argv[index + 1];
      if (!value) throw new Error("--base-url needs a value.");
      cli.baseUrl = value;
      index += 1;
    } else if (arg === "--port") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1) throw new Error("--port needs an integer.");
      cli.port = value;
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown flag ${arg}`);
    } else {
      cli.ids.push(arg);
    }
  }
  return cli;
}

function printUsage(): void {
  console.log(`Usage:
  npm run mug:check
  npm run mug-art -- <id> [--all]
  npm run mug-preview -- <id> [--all]

Designs: ${getMugDesignIds().join(", ") || "(none)"}`);
}

function reportMug(mug: ResolvedMug): boolean {
  console.log(`\n${mug.id}: ${mug.lines.map((line) => line.text).join(" / ")} · ${mug.paletteLabel}`);
  if (mug.marketStatus) console.log(`  market ${mug.market} · ${mug.marketStatus}`);
  if (mug.textInk) console.log(`  text ${mug.textInk.name} ${mug.textInk.hex} · ${mug.textInk.contrastOnWhite}:1 on white`);
  for (const warning of mug.warnings) console.log(`  warning: ${warning}`);
  for (const error of mug.errors) console.log(`  error: ${error}`);
  return mug.errors.length === 0;
}

function runChecks(): boolean {
  const canvasErrors = assertMugCanvases();
  for (const error of canvasErrors) console.log(`error: ${error}`);
  const blackOnWhite = contrastRatio("#000000", "#FFFFFF");
  if (Math.abs(blackOnWhite - 21) > 0.05) canvasErrors.push(`Contrast of black on white was ${blackOnWhite}, expected 21.`);
  const ids = getMugDesignIds();
  if (new Set(ids).size !== ids.length) canvasErrors.push("Mug design ids must be unique.");
  const mugs = loadAllResolvedMugs();
  const mugOk = mugs.every((mug) => reportMug(mug));
  if (mugs.length === 0) canvasErrors.push("No mug designs found.");
  return canvasErrors.length === 0 && mugOk;
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
  const chunkType = Buffer.from("pHYs");
  const data = Buffer.alloc(9);
  data.writeUInt32BE(MUG_PIXELS_PER_METER, 0);
  data.writeUInt32BE(MUG_PIXELS_PER_METER, 4);
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
    const value = hex.replace("#", "");
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)] as const;
  });
  if (palette.length === 0) throw new Error("No ink colors to snap to.");
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
      const distance = (color[0] - data[index]) ** 2 + (color[1] - data[index + 1]) ** 2 + (color[2] - data[index + 2]) ** 2;
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

async function assertFonts(page: Page, mug: ResolvedMug): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate((families) => {
    return families.filter((family) => !document.fonts.check(`400 64px "${family}"`));
  }, [mug.fonts.display, mug.fonts.supporting]);
  if (missing.length > 0) throw new Error(`${mug.id} did not load ${missing.join(", ")}.`);
}

async function renderArt(page: Page, baseUrl: string, mug: ResolvedMug, size: MugSizeId): Promise<string> {
  const canvas = MUG_CANVASES[size];
  const url = `${baseUrl.replace(/\/$/, "")}/mugs/${mug.id}/art?size=${size}`;
  await page.setViewportSize({ width: Math.min(canvas.widthPx, 4000), height: Math.min(canvas.heightPx + 40, 4000) });
  await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  if ((await page.locator("[data-mug-error]").count()) > 0) {
    throw new Error(`Print route failed for ${mug.id}: ${await page.locator("[data-mug-error]").innerText()}`);
  }
  const node = page.locator("[data-mug-art]");
  await node.waitFor({ timeout: 30_000 });
  await assertFonts(page, mug);
  const overflow = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-mug-slot]")].flatMap((slot) => {
      return [...slot.querySelectorAll("[data-mug-line]")]
        .filter((line) => line.scrollWidth > slot.clientWidth + 1)
        .map((line) => line.textContent ?? "");
    });
  });
  if (overflow.length > 0) throw new Error(`${mug.id} ${size} overflows: ${overflow.join(", ")}`);
  const shot = await node.screenshot({ type: "png", omitBackground: true });
  const hardened = hardenPng(shot, mugInkHexes(mug));
  const decoded = PNG.sync.read(hardened);
  if (decoded.width !== canvas.widthPx || decoded.height !== canvas.heightPx) {
    throw new Error(`${mug.id} ${size} PNG is ${decoded.width}×${decoded.height}.`);
  }
  if (hardened.length > MUG_PNG_LIMIT_BYTES) throw new Error(`${mug.id} PNG is over Printify's 100 MB limit.`);
  fs.mkdirSync(ART_DIR, { recursive: true });
  const output = path.join(ART_DIR, `${mug.id}-${size}.png`);
  fs.writeFileSync(output, hardened);
  if (!canvas.verified) console.log(`  warning: ${output} is UNVERIFIED and must not be uploaded yet.`);
  return output;
}

async function renderPreview(page: Page, baseUrl: string, mug: ResolvedMug): Promise<string> {
  const size = mug.sizes.includes("11oz") ? "11oz" : mug.sizes[0];
  const url = `${baseUrl.replace(/\/$/, "")}/mugs/${mug.id}/preview?size=${size}`;
  await page.setViewportSize({ width: 1200, height: 1400 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
  if ((await page.locator("[data-mug-error]").count()) > 0) {
    throw new Error(`Preview route failed for ${mug.id}: ${await page.locator("[data-mug-error]").innerText()}`);
  }
  const node = page.locator("[data-mug-preview]");
  await node.waitFor({ timeout: 30_000 });
  await assertFonts(page, mug);
  const shot = await node.screenshot({ type: "png" });
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const output = path.join(PREVIEW_DIR, `${mug.id}.png`);
  fs.writeFileSync(output, shot);
  return output;
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  if (cli.check && !cli.art && !cli.preview) {
    if (!runChecks()) process.exitCode = 1;
    return;
  }
  if (!cli.art && !cli.preview) {
    printUsage();
    process.exitCode = 1;
    return;
  }
  if (!runChecks()) {
    process.exitCode = 1;
    return;
  }
  const ids = cli.all ? getMugDesignIds() : cli.ids;
  if (ids.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }
  const mugs = ids.map((id) => {
    const mug = loadResolvedMug(id);
    if (!mug) throw new Error(`No mug ${id}.`);
    if (mug.errors.length > 0) throw new Error(`${id} did not validate.`);
    return mug;
  });
  let child: ChildProcess | null = null;
  const baseUrl = cli.baseUrl ?? `http://127.0.0.1:${cli.port}`;
  const browser = await (async () => {
    if (!cli.baseUrl) {
      console.log(`Starting next dev at ${baseUrl}`);
      child = startNext(cli.port, NEXT_LOG);
    }
    await waitForServer(`${baseUrl}/mugs/${mugs[0].id}/art?size=11oz`, child, NEXT_LOG);
    return chromium.launch(chromiumLaunchOptions);
  })();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const mug of mugs) {
      if (cli.art) {
        for (const size of mug.sizes) {
          const output = await renderArt(page, baseUrl, mug, size);
          console.log(`Wrote ${output}`);
        }
      }
      if (cli.preview) {
        const output = await renderPreview(page, baseUrl, mug);
        console.log(`Wrote ${output}`);
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
