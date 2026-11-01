/**
 * Saved print exports, written by the studio's "Save for Etsy listing" and read by the listing
 * tools, the inventory, and the Printify sync. Node only.
 *
 *   posters/<projectId>/exports/<posterId>-<size>.png   one PNG per poster per size (overwritten)
 *   posters/<projectId>/exports/manifest.json            metadata: hash, time, studio selection
 *
 * The PNGs on disk decide what is saved; a poster with at least one is eligible for listing. The
 * Etsy copy stays in posters/<projectId>/<posterId>.json, the one listing for every saved size.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isSlug } from '@/lib/posterResolver';
import { isPosterSizeName, printFileErrors, type PosterSizeName } from '@/lib/posterSizes';

const MANIFEST = 'manifest.json';
const EXPORT_FILE = /^(.+)-([^-]+)\.png$/;

export type SavedExport = {
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  savedAt: string;
  // The studio query the art was rendered with (palette, fonts, sizes...), so it can be redone.
  selection: Record<string, string>;
};

type Manifest = { posters: Record<string, Partial<Record<PosterSizeName, SavedExport>>> };

export type PrintFile = { size: PosterSizeName; filePath: string; width: number; height: number; bytes: number; sha256: string };

export function exportsDir(projectId: string): string {
  if (!isSlug(projectId)) throw new Error(`Bad project id "${projectId}".`);
  return path.join(process.cwd(), 'posters', projectId, 'exports');
}

export function exportPath(projectId: string, posterId: string, size: PosterSizeName): string {
  if (!isSlug(posterId)) throw new Error(`Bad poster id "${posterId}".`);
  return path.join(exportsDir(projectId), `${posterId}-${size}.png`);
}

function readManifest(projectId: string): Manifest {
  const file = path.join(exportsDir(projectId), MANIFEST);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest) : { posters: {} };
}

// Saved sizes for every poster in a project, from one directory listing.
export function savedSizesByPoster(projectId: string): Map<string, PosterSizeName[]> {
  const dir = exportsDir(projectId);
  const result = new Map<string, PosterSizeName[]>();
  if (!fs.existsSync(dir)) return result;
  for (const file of fs.readdirSync(dir).sort()) {
    const [, posterId, size] = file.match(EXPORT_FILE) ?? [];
    if (posterId && isPosterSizeName(size)) result.set(posterId, [...(result.get(posterId) ?? []), size]);
  }
  return result;
}

export function savedSizes(projectId: string, posterId: string): PosterSizeName[] {
  return savedSizesByPoster(projectId).get(posterId) ?? [];
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
  const known = readManifest(projectId).posters[posterId]?.[size];
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
  fs.mkdirSync(exportsDir(projectId), { recursive: true });
  writeAtomic(exportPath(projectId, posterId, size), png);
  const manifest = readManifest(projectId);
  manifest.posters[posterId] = {
    ...manifest.posters[posterId],
    [size]: { ...dims, bytes: png.length, sha256: sha256(png), savedAt: new Date().toISOString(), selection },
  };
  writeAtomic(path.join(exportsDir(projectId), MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return savedSizes(projectId, posterId);
}
