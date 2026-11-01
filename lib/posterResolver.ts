import fs from 'fs';
import path from 'path';
import { BACKGROUND_COLORS } from '@/lib/backgroundColors';
import { getColorOptions } from '@/lib/colorOptions';
import { GLOBAL_FONTS } from '@/lib/fontOptions';
import { POSTER_SIZES, type PosterSizeName } from '@/lib/posterSizes';
import type { PosterFile, ProjectConfig, ResolvedPoster } from '@/types/poster';

const POSTERS_DIR = path.join(process.cwd(), 'posters');
const PROJECT_FILE = 'project.json';
const DEFAULT_PRINT_WIDTH_INCHES = 12;

/**
 * Every poster is a folder:
 *
 *   posters/<projectId>/<posterId>/poster.json   the design
 *   posters/<projectId>/<posterId>/etsy.json     its Etsy listing: { etsy, research } (null until written)
 *   posters/<projectId>/<posterId>/exports/      saved print files (lib/posterExports.ts)
 */
export const POSTER_FILE = 'poster.json';
export const LISTING_FILE = 'etsy.json';

export type PosterListing = { etsy: PosterFile['etsy'] | null; research: PosterFile['research'] | null };

// Ids come from the URL, so keep them to plain slugs before touching the filesystem.
export const isSlug = (value: string) => /^[a-z0-9][a-z0-9-_]*$/i.test(value);

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function getProject(projectId: string): ProjectConfig | null {
  if (!isSlug(projectId)) return null;
  return readJson<ProjectConfig>(path.join(POSTERS_DIR, projectId, PROJECT_FILE));
}

export function getProjects(): ProjectConfig[] {
  if (!fs.existsSync(POSTERS_DIR)) return [];
  return fs
    .readdirSync(POSTERS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => getProject(entry.name))
    .filter((project): project is ProjectConfig => project !== null);
}

export function posterDir(projectId: string, posterId: string): string {
  if (!isSlug(projectId) || !isSlug(posterId)) throw new Error(`Bad poster id "${projectId}/${posterId}".`);
  return path.join(POSTERS_DIR, projectId, posterId);
}

export function getPosterIds(projectId: string): string[] {
  if (!isSlug(projectId)) return [];
  const dir = path.join(POSTERS_DIR, projectId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isSlug(entry.name) && fs.existsSync(path.join(dir, entry.name, POSTER_FILE)))
    .map((entry) => entry.name)
    .sort();
}

// The poster's design with its Etsy listing merged in, or null if the poster does not exist.
export function getPosterFile(projectId: string, posterId: string): PosterFile | null {
  if (!isSlug(projectId) || !isSlug(posterId)) return null;
  const dir = posterDir(projectId, posterId);
  const poster = readJson<PosterFile>(path.join(dir, POSTER_FILE));
  if (!poster) return null;
  const listing = readJson<PosterListing>(path.join(dir, LISTING_FILE));
  return { ...poster, etsy: listing?.etsy ?? undefined, research: listing?.research ?? undefined };
}

// For CLIs: the named posters (all of the project's when none are named), or a clear error.
export function resolvePosterIds(projectId: string, posterIds: string[] = []): string[] {
  if (!getProject(projectId)) throw new Error(`No poster project "${projectId}" under posters/.`);
  const known = getPosterIds(projectId);
  for (const id of posterIds) if (!known.includes(id)) throw new Error(`No poster "${id}" in ${projectId}.`);
  return posterIds.length > 0 ? posterIds : known;
}

export type VariantSelection = {
  palette?: string;
  titleFont?: string;
  subtitleFont?: string;
  bodyFont?: string;
  titleColor?: string;
  subtitleColor?: string;
  iconColor?: string;
  bodyColor?: string;
  backgroundColor?: string;
  iconRem?: string;
  titleRem?: string;
  subtitleRem?: string;
  bodyRem?: string;
  // One of PosterSizeName (e.g. "11x17"); empty means the project's own default layout (8x10).
  printSize?: string;
  // Horizontal alignment of the icon and text: 'left' | 'center' | 'right'; empty means the
  // project's own containerClasses alignment.
  align?: string;
};

const ALIGN_OPTIONS = ['left', 'center', 'right'] as const;
type AlignOption = (typeof ALIGN_OPTIONS)[number];
const isAlignOption = (value: string): value is AlignOption =>
  (ALIGN_OPTIONS as readonly string[]).includes(value);

// Rewrites containerClasses to reflect a chosen horizontal alignment: swaps any existing
// items-{start|center|end} and text-{left|center|right} tokens, appending defaults if absent.
function applyAlign(containerClasses: string, align: AlignOption): string {
  const itemsClass = align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center';
  const textClass = `text-${align}`;
  const withoutItems = containerClasses.replace(/\bitems-(?:start|center|end)\b/g, '').trim();
  const withoutText = withoutItems.replace(/\btext-(?:left|center|right)\b/g, '').trim();
  return `${withoutText} ${itemsClass} ${textClass}`.replace(/\s+/g, ' ').trim();
}

// A rem value is valid only if it's one of the project's own dropdown options.
function validRem(value: string | undefined, options: number[] | undefined): string {
  if (!value || !options) return '';
  return options.includes(Number(value)) ? value : '';
}

// Returns the selection with anything invalid (or not offered by the project) blanked out.
export function getValidSelection(project: ProjectConfig, selection: VariantSelection) {
  const {
    palette,
    titleFont,
    subtitleFont,
    bodyFont,
    titleColor,
    subtitleColor,
    iconColor,
    bodyColor,
    backgroundColor,
    iconRem,
    titleRem,
    subtitleRem,
    bodyRem,
    printSize,
    align,
  } = selection;
  const colorOptions = getColorOptions(project);
  return {
    palette: palette && project.palettes?.[palette] ? palette : '',
    titleFont: titleFont && GLOBAL_FONTS[titleFont] ? titleFont : '',
    subtitleFont: subtitleFont && GLOBAL_FONTS[subtitleFont] ? subtitleFont : '',
    bodyFont: bodyFont && GLOBAL_FONTS[bodyFont] ? bodyFont : '',
    titleColor: titleColor && colorOptions[titleColor] ? titleColor : '',
    subtitleColor: subtitleColor && colorOptions[subtitleColor] ? subtitleColor : '',
    iconColor: iconColor && colorOptions[iconColor] ? iconColor : '',
    bodyColor: bodyColor && colorOptions[bodyColor] ? bodyColor : '',
    // Background colors come from a fixed global list (dark + light), not the project's own
    // accent palette, since not every accent color makes a good full-canvas background.
    backgroundColor: backgroundColor && BACKGROUND_COLORS[backgroundColor] ? backgroundColor : '',
    iconRem: validRem(iconRem, project.sizeScale?.icon),
    titleRem: validRem(titleRem, project.sizeScale?.title),
    subtitleRem: validRem(subtitleRem, project.sizeScale?.subtitle),
    bodyRem: validRem(bodyRem, project.sizeScale?.body),
    printSize: printSize && POSTER_SIZES[printSize as PosterSizeName] ? printSize : '',
    align: align && isAlignOption(align) ? align : '',
  };
}

// A valid selection replaces the poster's own palette, fonts, and colors.
export function getResolvedPoster(
  projectId: string,
  posterId: string,
  selection: VariantSelection = {},
): ResolvedPoster | null {
  if (!isSlug(posterId)) return null;
  const project = getProject(projectId);
  if (!project) return null;
  const poster = getPosterFile(projectId, posterId);
  if (!poster) return null;

  const { overrides } = poster;
  const selected = getValidSelection(project, selection);
  const palettes = project.palettes ?? {};
  const colorOptions = getColorOptions(project);
  const activePalette = selected.palette || poster.palette;

  const typography = { ...project.defaultTypography, ...overrides?.defaultTypography };
  const titleFontName = selected.titleFont || poster.titleFont;
  const subtitleFontName = selected.subtitleFont || poster.subtitleFont;
  const bodyFontName = selected.bodyFont;
  const titleColorName = selected.titleColor || poster.titleColor;
  const subtitleColorName = selected.subtitleColor || poster.subtitleColor;
  const iconColorName = selected.iconColor || poster.iconColor;
  const bodyColorName = selected.bodyColor;
  const backgroundColorName = selected.backgroundColor || poster.backgroundColor;
  const sizeOverride = selected.printSize ? POSTER_SIZES[selected.printSize as PosterSizeName] : undefined;
  // text-xl (1.25rem) is the baked-in default body size when the project doesn't override it,
  // so SizeStepper's "Default" lines up with what's actually on screen.
  const bodyDefaultRem = typography.bodyRem ?? 1.25;

  return {
    id: posterId,
    projectId,
    title: poster.title,
    subtitle: poster.subtitle,
    icon: poster.icon,
    graphic: poster.graphic,
    window: poster.window,
    pinterest: poster.pinterest,
    etsy: poster.etsy,
    aspectRatio: sizeOverride?.aspectRatio || overrides?.defaultLayout?.aspectRatio || project.defaultLayout.aspectRatio,
    printWidthInches:
      sizeOverride?.printWidthInches ||
      overrides?.defaultLayout?.printWidthInches ||
      project.defaultLayout.printWidthInches ||
      DEFAULT_PRINT_WIDTH_INCHES,
    containerClasses: (() => {
      const base = overrides?.defaultLayout?.containerClasses || project.defaultLayout.containerClasses;
      return selected.align ? applyAlign(base, selected.align as AlignOption) : base;
    })(),
    bgClass: overrides?.defaultBackground?.className || project.defaultBackground.className,
    titleClasses: typography.titleClasses,
    subtitleClasses: typography.subtitleClasses,
    titleRem: Number(selected.titleRem) || typography.titleRem,
    subtitleRem: Number(selected.subtitleRem) || typography.subtitleRem,
    iconRem: Number(selected.iconRem) || poster.icon?.sizeRem || poster.graphic?.sizeRem || project.iconRem,
    bodyRem: Number(selected.bodyRem) || bodyDefaultRem,
    // The un-customized sizes (ignoring any selection), so a SizeStepper can place "Default" at
    // its real position in the scale instead of always treating it as the floor.
    titleDefaultRem: typography.titleRem,
    subtitleDefaultRem: typography.subtitleRem,
    iconDefaultRem: poster.icon?.sizeRem || poster.graphic?.sizeRem || project.iconRem,
    bodyDefaultRem,
    body: poster.body ?? [],
    bodyClasses: typography.bodyClasses || '',
    titleFont: titleFontName ? GLOBAL_FONTS[titleFontName] : typography.titleFontFamily || typography.fontFamily,
    subtitleFont: subtitleFontName ? GLOBAL_FONTS[subtitleFontName] : typography.subtitleFontFamily || typography.fontFamily,
    bodyFont: bodyFontName ? GLOBAL_FONTS[bodyFontName] : typography.bodyFontFamily || typography.subtitleFontFamily || typography.fontFamily,
    titleFontName: titleFontName || undefined,
    subtitleFontName: subtitleFontName || undefined,
    bodyFontName: bodyFontName || undefined,
    titleColor: titleColorName ? colorOptions[titleColorName] : undefined,
    subtitleColor: subtitleColorName ? colorOptions[subtitleColorName] : undefined,
    iconColor: iconColorName ? colorOptions[iconColorName] : undefined,
    bodyColor: bodyColorName ? colorOptions[bodyColorName] : undefined,
    backgroundColor: backgroundColorName ? BACKGROUND_COLORS[backgroundColorName] : undefined,
    paletteName: activePalette,
    colorPalette: {
      ...project.colorPalette,
      ...(activePalette ? palettes[activePalette] : undefined),
      ...overrides?.colorPalette,
    },
  };
}

export function getResolvedPosters(projectId: string, selection: VariantSelection = {}): ResolvedPoster[] {
  return getPosterIds(projectId)
    .map((posterId) => getResolvedPoster(projectId, posterId, selection))
    .filter((poster): poster is ResolvedPoster => poster !== null);
}
