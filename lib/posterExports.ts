/**
 * Saved print exports: the studio's "Save for Etsy listing" button writes them, and the Printify
 * sync reads them. Node only.
 *
 *   posters/<projectId>/exports/<posterId>-<size>.png   one PNG per poster per size (overwritten)
 *   posters/<projectId>/exports/manifest.json            what was saved, when, with which selection
 *
 * A poster is eligible for listing once it has at least one saved size. Its Etsy copy stays in
 * posters/<projectId>/<posterId>.json, which holds the one listing for every size; exports never
 * carry a copy of it.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isPosterSizeName, posterSizePixels, type PosterSizeName } from '@/lib/posterSizes';

const POSTERS_DIR = path.join(process.cwd(), 'posters');
const MANIFEST = 'manifest.json';
export const PNG_LIMIT_BYTES = 100 * 1024 * 1024;

export type SavedExport = {
  file: string; // relative to the exports folder
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  savedAt: string;
  // The studio query the art was rendered with (palette, fonts, sizes...), so it can be reproduced.
  selection: Record<string, string>;
};

export type ExportManifest = { posters: Record<string, Partial<Record<PosterSizeName, SavedExport>>> };

const isSlug = (value: string) => /^[a-z0-9][a-z0-9-_]*$/i.test(value);

export function exportsDir(projectId: string): string {
  if (!isSlug(projectId)) throw new Error(`Bad project id "${projectId}".`);
  return path.join(POSTERS_DIR, projectId, 'exports');
}

export function exportFileName(posterId: string, size: PosterSizeName): string {
  if (!isSlug(posterId)) throw new Error(`Bad poster id "${posterId}".`);
  return `${posterId}-${size}.png`;
}

export function readManifest(projectId: string): ExportManifest {
  const file = path.join(exportsDir(projectId), MANIFEST);
  if (!fs.existsSync(file)) return { posters: {} };
  return JSON.parse(fs.readFileSync(file, 'utf8')) as ExportManifest;
}

function writeAtomic(file: string, data: Buffer | string): void {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, data);
  fs.renameSync(temp, file);
}

function writeManifest(projectId: string, manifest: ExportManifest): void {
  const sorted: ExportManifest = { posters: {} };
  for (const id of Object.keys(manifest.posters).sort()) {
    if (Object.keys(manifest.posters[id]).length > 0) sorted.posters[id] = manifest.posters[id];
  }
  writeAtomic(path.join(exportsDir(projectId), MANIFEST), `${JSON.stringify(sorted, null, 2)}\n`);
}

export function readPngSize(png: Buffer): { width: number; height: number } | null {
  if (png.length < 24 || png.readUInt32BE(0) !== 0x89504e47 || png.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

// Sizes with a saved PNG on disk. A manifest entry whose file was deleted does not count.
export function savedSizes(projectId: string, posterId: string): PosterSizeName[] {
  const dir = exportsDir(projectId);
  const manifest = readManifest(projectId);
  const fromManifest = Object.keys(manifest.posters[posterId] ?? {}).filter(isPosterSizeName);
  // Hand-placed files (no manifest entry) are honored too, so older exports still list.
  const onDisk = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .map((file) => file.match(new RegExp(`^${posterId}-(.+)\\.png$`))?.[1])
        .filter((size): size is PosterSizeName => !!size && isPosterSizeName(size))
    : [];
  return [...new Set([...fromManifest, ...onDisk])]
    .filter((size) => fs.existsSync(path.join(dir, exportFileName(posterId, size))))
    .sort();
}

export function isListingEligible(projectId: string, posterId: string): boolean {
  return savedSizes(projectId, posterId).length > 0;
}

export function saveExport(
  projectId: string,
  posterId: string,
  size: PosterSizeName,
  png: Buffer,
  selection: Record<string, string>,
): SavedExport {
  const dims = readPngSize(png);
  if (!dims) throw new Error('Upload is not a PNG.');
  const expected = posterSizePixels(size);
  if (dims.width !== expected.width || dims.height !== expected.height) {
    throw new Error(`${size} must be ${expected.width}×${expected.height}px at 300 DPI; got ${dims.width}×${dims.height}.`);
  }
  if (png.length > PNG_LIMIT_BYTES) throw new Error("PNG is over Printify's 100 MB limit.");
  const dir = exportsDir(projectId);
  fs.mkdirSync(dir, { recursive: true });
  const file = exportFileName(posterId, size);
  writeAtomic(path.join(dir, file), png);
  const entry: SavedExport = {
    file,
    ...dims,
    bytes: png.length,
    sha256: crypto.createHash('sha256').update(png).digest('hex'),
    savedAt: new Date().toISOString(),
    selection: Object.fromEntries(Object.entries(selection).filter(([, value]) => value)),
  };
  const manifest = readManifest(projectId);
  manifest.posters[posterId] = { ...manifest.posters[posterId], [size]: entry };
  writeManifest(projectId, manifest);
  return entry;
}

export function removeExport(projectId: string, posterId: string, size: PosterSizeName): void {
  const file = path.join(exportsDir(projectId), exportFileName(posterId, size));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  const manifest = readManifest(projectId);
  if (manifest.posters[posterId]?.[size]) {
    delete manifest.posters[posterId][size];
    writeManifest(projectId, manifest);
  }
}
