/**
 * Build a KDP print-ready interior PDF from a manifest in kdp/.
 *
 * This follows the shape described for usefulcheatsheets-web `npm run book-pdf`:
 * launch a browser, screenshot the book preview route, and assemble a PDF with
 * media / bleed / trim boxes. That repo was not readable from this environment
 * (GitHub API 404), so launchBrowser / createPdf / setPrintBoxes were rewritten
 * from the KDP help pages and from the published 8.5x11 page size (621×810 pt).
 * See lib/kdpSizes.ts and docs/KDP-WIREFRAME.md.
 *
 * Usage:
 *   npm run kdp:check
 *   npm run book-pdf -- generic-log-book
 *   npm run book-pdf -- --all
 *   npm run book-pdf -- track-day-logbook --base-url http://127.0.0.1:4310
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { chromium } from 'playwright';
import { assertLowContentPipeline, getBookIds, loadBook, type LoadedBook } from '../lib/kdpBooks';
import { assertReferenceGeometry, printBoxes, type BookGeometry } from '../lib/kdpSizes';

const OUTPUT_DIR = path.join(process.cwd(), 'exports', 'kdp');
const NEXT_LOG = path.join(os.tmpdir(), 'kdp-next-dev.log');

type Cli = {
  check: boolean;
  all: boolean;
  ids: string[];
  baseUrl?: string;
  port: number;
};

function parseArgs(argv: string[]): Cli {
  const cli: Cli = { check: false, all: false, ids: [], port: 4312 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') cli.check = true;
    else if (arg === '--all') cli.all = true;
    else if (arg === '--base-url') {
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
  npm run kdp:check
  npm run book-pdf -- <book-id> [more ids]
  npm run book-pdf -- --all

Books: ${getBookIds().join(', ') || '(none)'}`);
}

function reportBook(book: LoadedBook): boolean {
  const pages = book.geometry?.pageCount ?? book.pages.length;
  const content = book.manifest?.content ?? book.content ?? 'invalid';
  const isbn = book.manifest?.content === 'low-content' ? ` · isbn ${book.manifest.isbn}` : '';
  console.log(`\n${book.id}: ${book.manifest ? book.manifest.kdp.title : 'invalid'} · ${pages} pages · ${content}${isbn}`);
  for (const warning of book.warnings) console.log(`  warning: ${warning}`);
  for (const error of book.errors) console.log(`  error: ${error}`);
  if (book.geometry) {
    const geometry = book.geometry;
    console.log(
      `  trim ${geometry.trim.label} · page ${geometry.pageWidthPt}×${geometry.pageHeightPt} pt · gutter ${geometry.gutterIn}"`,
    );
  }
  return book.errors.length === 0 && book.manifest !== null && book.geometry !== null;
}

function requireBook(id: string): LoadedBook & { manifest: NonNullable<LoadedBook['manifest']>; geometry: BookGeometry } {
  const book = loadBook(id);
  if (!book) throw new Error(`No manifest at kdp/${id}.json.`);
  if (!reportBook(book) || !book.manifest || !book.geometry) {
    throw new Error(`${id} did not validate.`);
  }
  return { ...book, manifest: book.manifest, geometry: book.geometry };
}

async function waitForServer(url: string, child: ChildProcess | null): Promise<void> {
  const deadline = Date.now() + 180_000;
  let lastStatus = 'not up';
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) {
      throw new Error(`next dev exited with ${child.exitCode}. See ${NEXT_LOG}`);
    }
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
      lastStatus = `HTTP ${response.status}`;
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url} (${lastStatus}).`);
}

function startNext(port: number): ChildProcess {
  const logFd = fs.openSync(NEXT_LOG, 'w');
  const nextBin = path.join(process.cwd(), 'node_modules', '.bin', 'next');
  const child = spawn(nextBin, ['dev', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  child.unref();
  return child;
}

function stopNext(child: ChildProcess | null): void {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
}

async function renderBook(baseUrl: string, book: LoadedBook & { geometry: BookGeometry; manifest: NonNullable<LoadedBook['manifest']> }): Promise<string> {
  const geometry = book.geometry;
  const url = `${baseUrl.replace(/\/$/, '')}/kdp/${book.id}/print`;
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: Math.min(geometry.pageWidthPx, 1600), height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
    if ((await page.locator('[data-kdp-error]').count()) > 0) {
      const text = await page.locator('[data-kdp-error]').innerText();
      throw new Error(`Print route failed for ${book.id}: ${text}`);
    }
    await page.locator('[data-kdp-ready]').waitFor({ timeout: 30_000 });
    const sheets = page.locator('[data-kdp-page]');
    const count = await sheets.count();
    if (count !== geometry.pageCount) {
      throw new Error(`${book.id} rendered ${count} sheets, expected ${geometry.pageCount}.`);
    }

    const pdf = await PDFDocument.create();
    pdf.setTitle(book.manifest.kdp.title);
    pdf.setSubject('Unbranded KDP interior wireframe');
    pdf.setCreator('design-generator KDP wireframe');
    pdf.setKeywords(book.manifest.kdp.keywords);
    pdf.setCreationDate(new Date('2026-10-30T00:00:00Z'));
    pdf.setModificationDate(new Date('2026-10-30T00:00:00Z'));

    for (let index = 0; index < count; index += 1) {
      const sheet = sheets.nth(index);
      const box = await sheet.boundingBox();
      if (!box) throw new Error(`Sheet ${index + 1} has no layout box.`);
      if (Math.abs(box.width - geometry.pageWidthPx) > 2 || Math.abs(box.height - geometry.pageHeightPx) > 2) {
        throw new Error(
          `Sheet ${index + 1} is ${box.width}×${box.height} px, expected ${geometry.pageWidthPx}×${geometry.pageHeightPx}.`,
        );
      }
      const png = await sheet.screenshot({ type: 'png' });
      const image = await pdf.embedPng(png);
      if (Math.abs(image.width - geometry.pageWidthPx) > 2 || Math.abs(image.height - geometry.pageHeightPx) > 2) {
        throw new Error(`Sheet ${index + 1} screenshot is ${image.width}×${image.height} px.`);
      }
      const pdfPage = pdf.addPage([geometry.pageWidthPt, geometry.pageHeightPt]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: geometry.pageWidthPt,
        height: geometry.pageHeightPt,
      });
      const odd = (index + 1) % 2 === 1;
      const boxes = printBoxes(geometry, odd);
      pdfPage.setMediaBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
      pdfPage.setCropBox(boxes.media.x, boxes.media.y, boxes.media.width, boxes.media.height);
      pdfPage.setBleedBox(boxes.bleed.x, boxes.bleed.y, boxes.bleed.width, boxes.bleed.height);
      pdfPage.setTrimBox(boxes.trim.x, boxes.trim.y, boxes.trim.width, boxes.trim.height);
      pdfPage.setArtBox(boxes.art.x, boxes.art.y, boxes.art.width, boxes.art.height);
    }

    const bytes = await pdf.save();
    const loaded = await PDFDocument.load(bytes);
    if (loaded.getPageCount() !== geometry.pageCount) {
      throw new Error(`Wrote ${loaded.getPageCount()} pages, expected ${geometry.pageCount}.`);
    }
    const first = loaded.getPage(0);
    const size = first.getSize();
    if (size.width !== geometry.pageWidthPt || size.height !== geometry.pageHeightPt) {
      throw new Error(`Media box is ${size.width}×${size.height} pt, expected ${geometry.pageWidthPt}×${geometry.pageHeightPt}.`);
    }
    const oddTrim = first.getTrimBox();
    const expectedOdd = printBoxes(geometry, true).trim;
    if (
      oddTrim.x !== expectedOdd.x ||
      oddTrim.y !== expectedOdd.y ||
      oddTrim.width !== expectedOdd.width ||
      oddTrim.height !== expectedOdd.height
    ) {
      throw new Error(`Odd-page trim box does not match the ${geometry.trim.id} spec.`);
    }
    if (geometry.pageCount > 1) {
      const evenTrim = loaded.getPage(1).getTrimBox();
      const expectedEven = printBoxes(geometry, false).trim;
      if (evenTrim.x !== expectedEven.x || evenTrim.width !== expectedEven.width) {
        throw new Error('Even-page trim box is not mirrored to the binding edge.');
      }
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, `${book.id}-interior.pdf`);
    fs.writeFileSync(outputPath, bytes);
    return outputPath;
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  assertReferenceGeometry();
  assertLowContentPipeline();
  console.log('KDP reference sizes, gutter bands, and low-content templates match.');

  if (cli.check && cli.ids.length === 0 && !cli.all) {
    const ids = getBookIds();
    const ok = ids.every((id) => {
      const book = loadBook(id);
      if (!book) return false;
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
      child = startNext(cli.port);
    }
    await waitForServer(`${baseUrl}/kdp/${books[0].id}/print`, child);
    for (const book of books) {
      const outputPath = await renderBook(baseUrl, book);
      const stat = fs.statSync(outputPath);
      console.log(`Wrote ${outputPath} (${Math.round(stat.size / 1024)} KB)`);
    }
  } finally {
    stopNext(child);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
