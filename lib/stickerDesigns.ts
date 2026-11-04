/**
 * Stickers are poster designs reflowed onto a square or rectangle. Each one is a folder named after its poster:
 *
 *   stickers/<projectId>/<posterId>/sticker.json   its type and studio choices, {} for all defaults
 *   stickers/<projectId>/<posterId>/etsy.json      its own Etsy listing: { etsy, research }
 *   stickers/<projectId>/<posterId>/exports/       <posterId>-<type>.png
 *
 * Text and graphics come from the poster. A look is chosen in this order: the studio's URL, then
 * sticker.json, then what the poster was saved for listing with, then the poster's own defaults.
 * Sizes depend on the shape: square types share sticker.json's top level, and each rectangular type
 * has its own entry under `layouts`.
 * Node only. See docs/STICKER-PIPELINE.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pngDimensions, savedSelection } from '@/lib/posterExports';
import { cn } from '@/lib/utils';
import { applyAlign, getProject, getResolvedPoster, getValidSelection, isSlug, type PosterListing, type VariantSelection } from '@/lib/posterResolver';
import { DEFAULT_STICKER_TYPE, isStickerType, isWideSticker, STICKER_TYPES, type StickerType } from '@/lib/stickerSizes';
import type { ResolvedPoster } from '@/types/poster';

const STICKERS_DIR = path.join(process.cwd(), 'stickers');
const STICKER_FILE = 'sticker.json';
const LISTING_FILE = 'etsy.json';
// relative: some graphics are positioned against the canvas.
const SQUARE_LAYOUT = 'relative items-center justify-center gap-5 text-center';
const WIDE_STACKED_LAYOUT = 'relative items-center justify-center gap-1 text-center';
// The graphic on the left, spanning the text on the right. PosterCanvas renders them as siblings.
const WIDE_SIDE_LAYOUT =
  'relative grid grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-6 gap-y-0 text-left [&>h1]:col-start-2 [&>p]:col-start-2 [&>ul]:col-start-2 [&>svg]:col-start-1 [&>svg]:row-span-3 [&>svg]:row-start-1';
const LOOK_KEYS = ['palette', 'titleFont', 'subtitleFont', 'bodyFont', 'titleColor', 'subtitleColor', 'iconColor', 'bodyColor', 'backgroundColor'] as const;
const REM_KEYS = ['titleRem', 'subtitleRem', 'bodyRem', 'iconRem'] as const;

export type StickerSizes = Partial<Record<(typeof REM_KEYS)[number], number>> & { align?: string };
export type StickerFile = Partial<Record<(typeof LOOK_KEYS)[number], string>> &
  StickerSizes & { type?: StickerType; cut?: 'panel'; panelClass?: string; layouts?: Partial<Record<StickerType, StickerSizes>> };

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function folders(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isSlug(entry.name))
    .map((entry) => entry.name)
    .sort();
}

const stickerDir = (projectId: string, id: string) => path.join(STICKERS_DIR, projectId, id);
const readStickerFile = (projectId: string, id: string) => readJson<StickerFile>(path.join(stickerDir(projectId, id), STICKER_FILE));

export const stickerProjects = () => folders(STICKERS_DIR);

export function stickerIds(projectId: string): string[] {
  if (!isSlug(projectId)) return [];
  return folders(path.join(STICKERS_DIR, projectId)).filter((id) => fs.existsSync(path.join(stickerDir(projectId, id), STICKER_FILE)));
}

export const stickerExportPath = (projectId: string, id: string, type: StickerType) => path.join(stickerDir(projectId, id), 'exports', `${id}-${type}.png`);

export function stickerListing(projectId: string, id: string): PosterListing {
  return readJson<PosterListing>(path.join(stickerDir(projectId, id), LISTING_FILE)) ?? { etsy: null, research: null };
}

export function stickerType(projectId: string, id: string): StickerType {
  const type = readStickerFile(projectId, id)?.type;
  return isStickerType(type) ? type : DEFAULT_STICKER_TYPE;
}

export type LoadedSticker = {
  poster: ResolvedPoster;
  type: StickerType;
  // Kiss-cut around the design's window or panel: the print file's background is transparent, which
  // is what sets Printify's cut line. `cut: "panel"` in sticker.json is for art with separate pieces,
  // which a cut can't trace. `panelClass` makes room for a graphic that floats over the panel, since
  // it doesn't add to the panel's height.
  cutAroundArt: boolean;
  // What the controls show. Sizes are set only when the URL chose them: a sticker's saved size
  // is its "Default", so the steppers stay in range for graphics larger than the project's scale.
  query: ReturnType<typeof getValidSelection>;
};

// A size for a rectangle that has no saved one: its square size, scaled to the shorter canvas.
const scaledRem = (rem: number, type: StickerType) => Math.max(0.25, Math.round(((rem * STICKER_TYPES[type].heightPx) / STICKER_TYPES[type].widthPx) * 4) / 4);

// A title drawn as a fixed-size sign (jump-sign) would outgrow a short canvas, so a rectangle sizes it
// from the title's own text instead.
const WIDE_SIGN_CLASSES = 'my-[1em] size-[3.7em] before:rounded-[0.35em] before:border-[0.16em] before:shadow-[0_0_0_0.11em_#F5C400]';

function wideLayout(poster: ResolvedPoster, align: string): string {
  const visualClass = poster.graphic?.className ?? poster.icon?.className ?? '';
  // Overlays and full-width graphics are designed to sit in the text's column.
  const beside = (poster.graphic || poster.icon) && !poster.window && !/\b(?:absolute|w-full)\b/.test(visualClass);
  if (beside) return align === 'left' || align === 'center' || align === 'right' ? cn(WIDE_SIDE_LAYOUT, `text-${align}`) : WIDE_SIDE_LAYOUT;
  return align === 'left' || align === 'center' || align === 'right' ? applyAlign(WIDE_STACKED_LAYOUT, align) : WIDE_STACKED_LAYOUT;
}

// The poster, reshaped into the sticker's canvas. Null if either file is missing.
export function loadSticker(projectId: string, id: string, requested: VariantSelection & { type?: string } = {}): LoadedSticker | null {
  if (!isSlug(projectId) || !isSlug(id)) return null;
  const project = getProject(projectId);
  const file = readStickerFile(projectId, id);
  if (!project || !file) return null;

  const url = getValidSelection(project, requested);
  const saved = savedSelection(projectId, id);
  const look = Object.fromEntries(LOOK_KEYS.map((key) => [key, url[key] || file[key] || saved[key] || ''])) as Record<(typeof LOOK_KEYS)[number], string>;
  const poster = getResolvedPoster(projectId, id, look);
  if (!poster) return null;

  const type = isStickerType(requested.type) ? requested.type : isStickerType(file.type) ? file.type : DEFAULT_STICKER_TYPE;
  const wide = isWideSticker(type);
  const sizes = (wide ? file.layouts?.[type] : file) ?? {};
  const defaultRem = (key: (typeof REM_KEYS)[number], posterRem: number) => sizes[key] ?? (wide ? scaledRem(file[key] ?? posterRem, type) : posterRem);
  const align = url.align || sizes.align || '';
  const titleDefaultRem = defaultRem('titleRem', poster.titleDefaultRem);
  const subtitleDefaultRem = defaultRem('subtitleRem', poster.subtitleDefaultRem);
  const bodyDefaultRem = defaultRem('bodyRem', poster.bodyDefaultRem);
  const iconDefaultRem = defaultRem('iconRem', poster.iconDefaultRem);
  const panel = type === 'kiss-cut' && file.cut === 'panel' && !poster.window;
  const cutAroundArt = panel || (type === 'kiss-cut' && !!poster.window);
  const squareClasses = align === 'left' || align === 'center' || align === 'right' ? applyAlign(SQUARE_LAYOUT, align) : SQUARE_LAYOUT;
  return {
    type,
    cutAroundArt,
    query: { ...url, ...look, align, printSize: '' },
    poster: {
      ...poster,
      aspectRatio: STICKER_TYPES[type].aspectRatio,
      // On a rectangle, a row of pictograms is narrower than the canvas. Side padding keeps its labels under it.
      containerClasses: cn(wide ? wideLayout(poster, align) : squareClasses, cutAroundArt ? 'p-10' : STICKER_TYPES[type].padding, file.cut === 'panel' && (type === 'bumper' ? 'px-[6.5rem]' : wide && 'px-[4.5rem]')),
      bgClass: cutAroundArt ? 'bg-transparent' : poster.bgClass,
      backgroundColor: cutAroundArt ? undefined : poster.backgroundColor,
      panel,
      panelColor: panel ? poster.backgroundColor : undefined,
      panelClass: panel ? file.panelClass : undefined,
      titleClasses: wide && poster.titleClasses.includes('size-[') ? cn(poster.titleClasses, WIDE_SIGN_CLASSES) : poster.titleClasses,
      // On the long, narrow bumper, an overlay placed for a square would drift away from the text.
      graphic: type === 'bumper' && poster.graphic?.className?.includes('absolute') && poster.graphic.className.includes('right-[')
        ? { ...poster.graphic, className: cn(poster.graphic.className, 'right-[27%]') }
        : poster.graphic,
      // The title bar and its offset shadow are sized for a poster.
      window: wide && poster.window
        ? { ...poster.window, shadow: undefined, barClassName: cn(poster.window.barClassName, 'gap-2 px-3 py-1 text-[1.5rem]'), className: cn(poster.window.className, 'gap-1 p-2') }
        : poster.window,
      titleRem: Number(url.titleRem) || titleDefaultRem,
      subtitleRem: Number(url.subtitleRem) || subtitleDefaultRem,
      bodyRem: Number(url.bodyRem) || bodyDefaultRem,
      iconRem: Number(url.iconRem) || iconDefaultRem,
      titleDefaultRem,
      subtitleDefaultRem,
      bodyDefaultRem,
      iconDefaultRem,
      // A sticker has its own listing, and no Pinterest copy.
      etsy: stickerListing(projectId, id).etsy ?? undefined,
      pinterest: undefined,
    },
  };
}

// Writes the studio's print file and the choices behind it, so `sticker-art` can redo the same art.
export function saveSticker(projectId: string, id: string, png: Buffer, requested: VariantSelection & { type?: string }): void {
  const project = getProject(projectId);
  const file = readStickerFile(projectId, id);
  if (!project || !file) throw new Error(`No sticker "${projectId}/${id}".`);
  const type = isStickerType(requested.type) ? requested.type : isStickerType(file.type) ? file.type : DEFAULT_STICKER_TYPE;
  const { widthPx, heightPx } = STICKER_TYPES[type];
  const size = pngDimensions(png);
  if (size?.width !== widthPx || size.height !== heightPx) {
    throw new Error(`Print file is ${size?.width}×${size?.height}; it must be ${widthPx}×${heightPx}.`);
  }
  const valid = getValidSelection(project, requested);
  const next: StickerFile = { ...file, type };
  for (const key of LOOK_KEYS) if (valid[key]) next[key] = valid[key];
  const sizes: StickerSizes = isWideSticker(type) ? { ...file.layouts?.[type] } : next;
  for (const key of REM_KEYS) if (valid[key]) sizes[key] = Number(valid[key]);
  if (valid.align) sizes.align = valid.align;
  if (isWideSticker(type)) next.layouts = { ...file.layouts, [type]: sizes };

  const dir = stickerDir(projectId, id);
  const output = stickerExportPath(projectId, id, type);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, png);
  fs.writeFileSync(path.join(dir, STICKER_FILE), `${JSON.stringify(next, null, 2)}\n`);
}

export const hasStickerLayout = (projectId: string, id: string, type: StickerType) => !!readStickerFile(projectId, id)?.layouts?.[type];

// Records fitted sizes for one rectangular type. The sticker's type and print file stay as they are.
export function saveStickerLayout(projectId: string, id: string, type: StickerType, sizes: StickerSizes): void {
  const file = readStickerFile(projectId, id);
  if (!file) throw new Error(`No sticker "${projectId}/${id}".`);
  const next: StickerFile = { ...file, layouts: { ...file.layouts, [type]: sizes } };
  fs.writeFileSync(path.join(stickerDir(projectId, id), STICKER_FILE), `${JSON.stringify(next, null, 2)}\n`);
}
