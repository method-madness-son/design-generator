import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { findBookFile } from '@/lib/lowcontent/books';

const MANIFEST = 'manifest.json';

export type LcSavedElement = {
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  savedAt: string;
  selection: Record<string, string>;
};

type LcExportManifest = { elements: Record<string, LcSavedElement> };

export function lcExportsDir(bookId: string): string | null {
  const located = findBookFile(bookId);
  if (!located) return null;
  return path.join(process.cwd(), 'lowcontent', located.projectSlug, 'exports', bookId);
}

export function lcExportPath(bookId: string, elementId: string): string | null {
  const dir = lcExportsDir(bookId);
  if (!dir) return null;
  return path.join(dir, `${bookId}-${elementId}.png`);
}

function readManifest(dir: string): LcExportManifest {
  const file = path.join(dir, MANIFEST);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as LcExportManifest) : { elements: {} };
}

function writeAtomic(file: string, data: Buffer | string): void {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, data);
  fs.renameSync(temp, file);
}

const sha256 = (data: Buffer) => crypto.createHash('sha256').update(data).digest('hex');

function pngDimensions(header: Buffer): { width: number; height: number } | null {
  if (header.length < 24 || header.readUInt32BE(0) !== 0x89504e47 || header.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

export function savedElements(bookId: string): string[] {
  const dir = lcExportsDir(bookId);
  if (!dir || !fs.existsSync(dir)) return [];
  const prefix = `${bookId}-`;
  const result: string[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith(prefix) || !file.endsWith('.png')) continue;
    result.push(file.slice(prefix.length, -'.png'.length));
  }
  return result.sort();
}

export function savedLcSelection(bookId: string, elementId: string): Record<string, string> {
  const dir = lcExportsDir(bookId);
  if (!dir) return {};
  const manifest = readManifest(dir);
  return manifest.elements[elementId]?.selection ?? {};
}

export function saveLcExport(
  bookId: string,
  elementId: string,
  png: Buffer,
  selection: Record<string, string>,
): string[] {
  const dims = pngDimensions(png);
  if (!dims) throw new Error('Upload is not a PNG.');
  const dir = lcExportsDir(bookId);
  if (!dir) throw new Error(`Book "${bookId}" not found.`);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${bookId}-${elementId}.png`);
  writeAtomic(filePath, png);
  const manifest = readManifest(dir);
  manifest.elements[elementId] = {
    ...dims,
    bytes: png.length,
    sha256: sha256(png),
    savedAt: new Date().toISOString(),
    selection: Object.fromEntries(Object.entries(selection).filter(([, v]) => v)),
  };
  writeAtomic(path.join(dir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return savedElements(bookId);
}

export function lcExportFiles(bookId: string): { elementId: string; filePath: string; bytes: number }[] {
  const dir = lcExportsDir(bookId);
  if (!dir || !fs.existsSync(dir)) return [];
  const prefix = `${bookId}-`;
  const files: { elementId: string; filePath: string; bytes: number }[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.startsWith(prefix) || !file.endsWith('.png')) continue;
    const elementId = file.slice(prefix.length, -'.png'.length);
    const filePath = path.join(dir, file);
    const bytes = fs.statSync(filePath).size;
    files.push({ elementId, filePath, bytes });
  }
  return files.sort((a, b) => a.elementId.localeCompare(b.elementId));
}
