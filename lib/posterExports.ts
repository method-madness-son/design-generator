/**
 * Saved print exports, written by the studio's "Save for Etsy listing" and read by the listing
 * tools, the inventory, and the Printify sync. Node only. Each poster keeps its own:
 *
 *   posters/<projectId>/<posterId>/exports/<posterId>-<size>.png   one PNG per size (overwritten)
 *   posters/<projectId>/<posterId>/exports/manifest.json            metadata: hash, time, selection
 *
 * The PNGs on disk decide what is saved; a poster with at least one is eligible for listing. The
 * poster's Etsy copy is its etsy.json, the one listing for every saved size.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getPosterIds, posterDir } from '@/lib/posterResolver';
import { isPosterSizeName, printFileErrors, type PosterSizeName } from '@/lib/posterSizes';

const MANIFEST = 'manifest.json';

export type SavedExport = {
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  savedAt: string;
  // The studio query the art was rendered with (palette, fonts, sizes...), so it can be redone.
  selection: Record<string, string>;
};

type Manifest = { sizes: Partial<Record<PosterSizeName, SavedExport>> };

export type PrintFile = { size: PosterSizeName; filePath: string; width: number; height: number; bytes: number; sha256: string };

export function exportsDir(projectId: string, posterId: string): string {
  return path.join(posterDir(projectId, posterId), 'exports');
}

export function exportPath(projectId: string, posterId: string, size: PosterSizeName): string {
  return path.join(exportsDir(projectId, posterId), `${posterId}-${size}.png`);
}

function readManifest(projectId: string, posterId: string): Manifest {
  const file = path.join(exportsDir(projectId, posterId), MANIFEST);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest) : { sizes: {} };
}

export function savedSizes(projectId: string, posterId: string): PosterSizeName[] {
  const dir = exportsDir(projectId, posterId);
  if (!fs.existsSync(dir)) return [];
  const prefix = `${posterId}-`;
  return fs
    .readdirSync(dir)
    .filter((file) => file.startsWith(prefix) && file.endsWith('.png'))
    .map((file) => file.slice(prefix.length, -'.png'.length))
    .filter(isPosterSizeName)
    .sort();
}

// Saved sizes for every poster in a project that has any.
export function savedSizesByPoster(projectId: string): Map<string, PosterSizeName[]> {
  const result = new Map<string, PosterSizeName[]>();
  for (const posterId of getPosterIds(projectId)) {
    const sizes = savedSizes(projectId, posterId);
    if (sizes.length > 0) result.set(posterId, sizes);
  }
  return result;
}

export function pngDimensions(header: Buffer): { width: number; height: number } | null {
  if (header.length < 24 || header.readUInt32BE(0) !== 0x89504e47 || header.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

const sha256 = (data: Buffer) => crypto.createHash('sha256').update(data).digest('hex');

// A saved print file with its pixel size and hash. The hash comes from the manifest when the file
// is unchanged since the studio saved it, so large PNGs are not re-read.
export function readPrintFile(projectId: string, posterId: string, size: PosterSizeName): PrintFile {
  const filePath = exportPath(projectId, posterId, size);
  const bytes = fs.statSync(filePath).size;
  const known = readManifest(projectId, posterId).sizes[size];
  if (known && known.bytes === bytes) return { size, filePath, width: known.width, height: known.height, bytes, sha256: known.sha256 };
  const data = fs.readFileSync(filePath);
  const dims = pngDimensions(data);
  if (!dims) throw new Error(`${filePath} is not a PNG.`);
  return { size, filePath, ...dims, bytes, sha256: sha256(data) };
}

function writeAtomic(file: string, data: Buffer | string): void {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, data);
  fs.renameSync(temp, file);
}

// Validates and writes one size, records it in the manifest, and returns the poster's saved sizes.
export function saveExport(
  projectId: string,
  posterId: string,
  size: PosterSizeName,
  png: Buffer,
  selection: Record<string, string>,
): PosterSizeName[] {
  const dims = pngDimensions(png);
  if (!dims) throw new Error('Upload is not a PNG.');
  const errors = printFileErrors(size, { ...dims, bytes: png.length });
  if (errors.length > 0) throw new Error(errors.join(' '));
  const dir = exportsDir(projectId, posterId);
  fs.mkdirSync(dir, { recursive: true });
  writeAtomic(exportPath(projectId, posterId, size), png);
  const manifest = readManifest(projectId, posterId);
  manifest.sizes[size] = { ...dims, bytes: png.length, sha256: sha256(png), savedAt: new Date().toISOString(), selection };
  writeAtomic(path.join(dir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return savedSizes(projectId, posterId);
}
