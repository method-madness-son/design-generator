/**
 * Low-content KDP exporter.
 *
 *   npm run lc:check
 *   npm run lc:interior -- adhd-planner
 *   npm run lc:interior -- --all
 *   npm run lc:cover -- pace-notes
 *   npm run lc:preview -- --all
 *   npm run lc:interior -- adhd-planner --base-url http://127.0.0.1:4310
 */
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { chromium, type Page } from 'playwright';
import { assertValidatorFixtures, getBookIds, loadBook, type LoadedLowContentBook } from '../lib/lowcontent/books';
import { validateLcMetadata } from '../lib/lowcontent/metadata';
import { chromiumLaunchOptions, startNext, stopNext, waitForServer } from './shared/previewServer';
import {
  assertReferenceSpecs,
  coverPrintBoxes,
  inchesToPixels,
  printBoxes,
  type CoverGeometry,
  type InteriorGeometry,
} from '../lib/lowcontent/specs';

const OUTPUT_DIR = path.join(process.cwd(), 'exports', 'lowcontent');
const PREVIEW_DIR = path.join(OUTPUT_DIR, 'previews');
const NEXT_LOG = path.join(os.tmpdir(), 'lc-next-dev.log');

type Command = 'check' | 'interior' | 'cover' | 'preview';

type Cli = {
  command: Command;
  all: boolean;
  ids: string[];
  baseUrl?: string;
  port: number;
  variant: 'a' | 'b' | 'c';
};

function parseArgs(argv: string[]): Cli {
  const command = argv[0];
  if (command !== 'check' && command !== 'interior' && command !== 'cover' && command !== 'preview') {
    throw new Error('First argument must be check, interior, cover, or preview.');
  }
  const cli: Cli = { command, all: false, ids: [], port: 4314, variant: 'a' };
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--all') cli.all = true;
    else if (arg === '--base-url') {
      const value = argv[index + 1];
      if (!value) throw new Error('--base-url needs a value.');
      cli.baseUrl = value;
      index += 1;
    } else if (arg === '--variant') {
      const value = argv[index + 1];
      if (value !== 'a' && value !== 'b' && value !== 'c') throw new Error('--variant must be a, b, or c.');
      cli.variant = value;
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
  npm run lc:check
  npm run lc:interior -- <id> [--all]
  npm run lc:cover -- <id> [--variant a|b|c] [--all]
  npm run lc:preview -- <id> [--all]

Books: ${getBookIds().join(', ') || '(none)'}`);
}

function reportBook(book: LoadedLowContentBook): boolean {
  const pages = book.geometry?.pageCount ?? book.pages.length;
  console.log(`\n${book.id}: ${book.manifest ? book.manifest.title : 'invalid'} · ${pages} pages`);
  for (const warning of book.warnings) console.log(`  warning: ${warning}`);
  for (const error of book.errors) console.log(`  error: ${error}`);
  if (book.geometry && book.cover) {
    console.log(
      `  trim ${book.geometry.trim.label} · page ${book.geometry.pageWidthPt}×${book.geometry.pageHeightPt} pt · gutter ${book.geometry.gutterIn}" · spine ${book.cover.spineIn.toFixed(4)}"`,
    );
  }
  return book.errors.length === 0 && book.manifest !== null && book.geometry !== null && book.cover !== null && book.theme !== null;
}

function requireBook(id: string): LoadedLowContentBook & {
  manifest: NonNullable<LoadedLowContentBook['manifest']>;
  geometry: InteriorGeometry;
  cover: CoverGeometry;
  theme: NonNullable<LoadedLowContentBook['theme']>;
} {
  const book = loadBook(id);
  if (!book) throw new Error(`No manifest for ${id} under lowcontent/.`);
  if (!reportBook(book) || !book.manifest || !book.geometry || !book.cover || !book.theme) {
    throw new Error(`${id} did not validate.`);
  }
  return { ...book, manifest: book.manifest, geometry: book.geometry, cover: book.cover, theme: book.theme };
}

function assertMetadataFixtures(): void {
  const tooMany = validateLcMetadata({
    title: 'T',
    subtitle: '',
    description: 'A fill-in notebook.',
    keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    categories: [{ label: 'One' }],
    priceUsd: 9.99,
    readingAge: null,
    lowContent: true,
    isbn: 'kdp',
    sexuallyExplicit: false,
  });
  if (!tooMany.errors.some((error) => error.includes('exactly 7'))) {
    throw new Error('Keyword count fixture should fail.');
  }
  if (!tooMany.errors.some((error) => error.includes('isbn'))) {
    throw new Error('Free KDP ISBN fixture should fail.');
  }
  const longKeyword = validateLcMetadata({
    title: 'T',
    subtitle: '',
    description: 'A fill-in notebook.',
    keywords: ['x'.repeat(51), 'b', 'c', 'd', 'e', 'f', 'g'],
    categories: [{ label: 'One' }, { label: 'Two' }],
    priceUsd: 9.99,
    readingAge: null,
    lowContent: true,
    isbn: 'none',
    sexuallyExplicit: false,
  });
  if (!longKeyword.errors.some((error) => error.includes('50'))) {
    throw new Error('Keyword length fixture should fail.');
  }
}

async function openPage(browser: Awaited<ReturnType<typeof chromium.launch>>, url: string, viewport: { width: number; height: number }): Promise<Page> {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
  });
  return page;
}

async function renderInterior(baseUrl: string, book: LoadedLowContentBook & { geometry: InteriorGeometry; manifest: NonNullable<LoadedLowContentBook['manifest']> }): Promise<string> {
  const geometry = book.geometry;
  const url = `${baseUrl.replace(/\/$/, '')}/lowcontent/${book.id}/print`;
  const browser = await chromium.launch(chromiumLaunchOptions);
  try {
    const page = await openPage(browser, url, { width: Math.min(geometry.pageWidthPx, 1600), height: 900 });
    if ((await page.locator('[data-lc-error]').count()) > 0) {
      throw new Error(`Print route failed for ${book.id}: ${await page.locator('[data-lc-error]').innerText()}`);
    }
    await page.locator('[data-lc-ready]').waitFor({ timeout: 30_000 });
    const sheets = page.locator('[data-lc-page]');
    const count = await sheets.count();
    if (count !== geometry.pageCount) throw new Error(`${book.id} rendered ${count} sheets, expected ${geometry.pageCount}.`);

    const pdf = await PDFDocument.create();
    pdf.setTitle(book.manifest.kdp.title);
    pdf.setSubject('KDP low-content interior');
    pdf.setCreator('design-generator low-content pipeline');
    pdf.setCreationDate(new Date('2026-10-31T00:00:00Z'));
    pdf.setModificationDate(new Date('2026-10-31T00:00:00Z'));

    for (let index = 0; index < count; index += 1) {
      const sheet = sheets.nth(index);
      const box = await sheet.boundingBox();
      if (!box) throw new Error(`Sheet ${index + 1} has no layout box.`);
      if (Math.abs(box.width - geometry.pageWidthPx) > 2 || Math.abs(box.height - geometry.pageHeightPx) > 2) {
        throw new Error(`Sheet ${index + 1} is ${box.width}×${box.height} px, expected ${geometry.pageWidthPx}×${geometry.pageHeightPx}.`);
      }
      const png = await sheet.screenshot({ type: 'png' });
      const image = await pdf.embedPng(png);
      const pdfPage = pdf.addPage([geometry.pageWidthPt, geometry.pageHeightPt]);
      pdfPage.drawImage(image, { x: 0, y: 0, width: geometry.pageWidthPt, height: geometry.pageHeightPt });
      const boxes = printBoxes(geometry, (index + 1) % 2 === 1);
      pdfPage.setMediaBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
      pdfPage.setCropBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
      pdfPage.setBleedBox(boxes.bleed.x, boxes.bleed.y, boxes.bleed.width, boxes.bleed.height);
      pdfPage.setTrimBox(boxes.trim.x, boxes.trim.y, boxes.trim.width, boxes.trim.height);
      pdfPage.setArtBox(boxes.art.x, boxes.art.y, boxes.art.width, boxes.art.height);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, `${book.id}-interior.pdf`);
    fs.writeFileSync(outputPath, await pdf.save());
    return outputPath;
  } finally {
    await browser.close();
  }
}

async function renderCover(
  baseUrl: string,
  book: LoadedLowContentBook & { cover: CoverGeometry; manifest: NonNullable<LoadedLowContentBook['manifest']> },
  variant: 'a' | 'b' | 'c',
): Promise<{ pdf: string; png: string }> {
  const cover = book.cover;
  const root = baseUrl.replace(/\/$/, '');
  const browser = await chromium.launch(chromiumLaunchOptions);
  try {
    const query = variant === 'a' ? '' : `?variant=${variant}`;
    const suffix = variant === 'a' ? '' : `-${variant}`;
    const coverPage = await openPage(browser, `${root}/lowcontent/${book.id}/cover${query}`, {
      width: Math.min(cover.fullWidthPx, 1400),
      height: 900,
    });
    if ((await coverPage.locator('[data-lc-error]').count()) > 0) {
      throw new Error(`Cover route failed for ${book.id}: ${await coverPage.locator('[data-lc-error]').innerText()}`);
    }
    await coverPage.locator('[data-lc-cover-ready]').waitFor({ timeout: 30_000 });
    const sheet = coverPage.locator('[data-lc-cover]');
    const box = await sheet.boundingBox();
    if (!box) throw new Error('Cover sheet has no layout box.');
    if (Math.abs(box.width - cover.fullWidthPx) > 2 || Math.abs(box.height - cover.fullHeightPx) > 2) {
      throw new Error(`Cover is ${box.width}×${box.height} px, expected ${cover.fullWidthPx}×${cover.fullHeightPx}.`);
    }
    const png = await sheet.screenshot({ type: 'png' });
    const pdf = await PDFDocument.create();
    pdf.setTitle(`${book.manifest.kdp.title} cover`);
    pdf.setSubject('KDP low-content wrap cover');
    pdf.setCreator('design-generator low-content pipeline');
    pdf.setCreationDate(new Date('2026-10-31T00:00:00Z'));
    pdf.setModificationDate(new Date('2026-10-31T00:00:00Z'));
    const image = await pdf.embedPng(png);
    const pdfPage = pdf.addPage([cover.fullWidthPt, cover.fullHeightPt]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: cover.fullWidthPt, height: cover.fullHeightPt });
    const boxes = coverPrintBoxes(cover);
    pdfPage.setMediaBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
    pdfPage.setCropBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
    pdfPage.setBleedBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
    pdfPage.setTrimBox(boxes.trim.x, boxes.trim.y, boxes.trim.width, boxes.trim.height);

    const frontPage = await openPage(browser, `${root}/lowcontent/${book.id}/front${query}`, {
      width: Math.min(inchesToPixels(cover.trimWidthIn), 1200),
      height: 900,
    });
    await frontPage.locator('[data-lc-front-ready]').waitFor({ timeout: 30_000 });
    const front = frontPage.locator('[data-lc-front]');
    const frontBox = await front.boundingBox();
    const expectedW = inchesToPixels(cover.trimWidthIn);
    const expectedH = inchesToPixels(cover.trimHeightIn);
    if (!frontBox || Math.abs(frontBox.width - expectedW) > 2 || Math.abs(frontBox.height - expectedH) > 2) {
      throw new Error(`Front cover is ${frontBox?.width}×${frontBox?.height} px, expected ${expectedW}×${expectedH}.`);
    }
    const frontPng = await front.screenshot({ type: 'png' });

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const pdfPath = path.join(OUTPUT_DIR, `${book.id}-cover${suffix}.pdf`);
    const pngPath = path.join(OUTPUT_DIR, `${book.id}-front${suffix}.png`);
    fs.writeFileSync(pdfPath, await pdf.save());
    fs.writeFileSync(pngPath, frontPng);
    return { pdf: pdfPath, png: pngPath };
  } finally {
    await browser.close();
  }
}

async function renderPreview(baseUrl: string, ids: string[]): Promise<string[]> {
  const root = baseUrl.replace(/\/$/, '');
  const browser = await chromium.launch(chromiumLaunchOptions);
  const written: string[] = [];
  try {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    const index = await openPage(browser, `${root}/lowcontent`, { width: 1280, height: 900 });
    const indexPath = path.join(PREVIEW_DIR, 'index.png');
    await index.screenshot({ path: indexPath, fullPage: true });
    written.push(indexPath);
    await index.close();
    for (const id of ids) {
      const page = await openPage(browser, `${root}/lowcontent/${id}`, { width: 1280, height: 900 });
      const output = path.join(PREVIEW_DIR, `${id}.png`);
      await page.screenshot({ path: output, fullPage: true });
      written.push(output);
      await page.close();
    }
    return written;
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  assertReferenceSpecs();
  assertValidatorFixtures();
  assertMetadataFixtures();
  console.log('Theme: theme/global.json');
  console.log('Reference trim sizes, gutter bands, spine formula, font rules, and metadata fixtures match.');

  if (cli.command === 'check') {
    const ids = cli.ids.length > 0 ? cli.ids : getBookIds();
    const ok = ids.every((id) => {
      const book = loadBook(id);
      if (!book) {
        console.log(`\n${id}: missing`);
        return false;
      }
      return reportBook(book);
    });
    if (!ok) process.exitCode = 1;
    return;
  }

  const ids = cli.all ? getBookIds() : cli.ids;
  if (ids.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }
  const books = ids.map((id) => requireBook(id));
  let child: ChildProcess | null = null;
  const baseUrl = cli.baseUrl ?? `http://127.0.0.1:${cli.port}`;
  try {
    if (!cli.baseUrl) {
      console.log(`Starting next dev at ${baseUrl}`);
      child = startNext(cli.port, NEXT_LOG);
    }
    const first = books[0];
    const probe =
      cli.command === 'interior'
        ? `${baseUrl}/lowcontent/${first.id}/print`
        : cli.command === 'cover'
          ? `${baseUrl}/lowcontent/${first.id}/cover`
          : `${baseUrl}/lowcontent`;
    await waitForServer(probe, child, NEXT_LOG);
    if (cli.command === 'preview') {
      const written = await renderPreview(baseUrl, books.map((book) => book.id));
      for (const file of written) console.log(`Wrote ${file}`);
      return;
    }
    for (const book of books) {
      if (cli.command === 'interior') {
        const output = await renderInterior(baseUrl, book);
        console.log(`Wrote ${output} (${Math.round(fs.statSync(output).size / 1024)} KB)`);
      } else {
        const output = await renderCover(baseUrl, book, cli.variant);
        console.log(`Wrote ${output.pdf} (${Math.round(fs.statSync(output.pdf).size / 1024)} KB)`);
        console.log(`Wrote ${output.png} (${Math.round(fs.statSync(output.png).size / 1024)} KB)`);
      }
    }
  } finally {
    stopNext(child);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
