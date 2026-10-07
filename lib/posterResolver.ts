import fs from 'fs';
import path from 'path';
import { cn } from '@/lib/utils';
import type { PosterFile, ProjectConfig, ResolvedPoster } from '@/types/poster';

const POSTERS_DIR = path.join(process.cwd(), 'posters');
const PROJECT_FILE = 'project.json';
const DEFAULT_PRINT_WIDTH_INCHES = 12;

// Ids come from the URL, so keep them to plain slugs before touching the filesystem.
const isSlug = (value: string) => /^[a-z0-9][a-z0-9-_]*$/i.test(value);

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

export function getPosterIds(projectId: string): string[] {
  if (!isSlug(projectId)) return [];
  const dir = path.join(POSTERS_DIR, projectId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json') && file !== PROJECT_FILE)
    .map((file) => file.replace(/\.json$/, ''))
    .sort();
}

export type VariantSelection = {
  palette?: string;
  fonts?: string;
  iconRem?: string;
  titleRem?: string;
  subtitleRem?: string;
};

// A rem value is valid only if it's one of the project's own dropdown options.
function validRem(value: string | undefined, options: number[] | undefined): string {
  if (!value || !options) return '';
  return options.includes(Number(value)) ? value : '';
}

// Returns the selection with anything the project does not define blanked out.
export function getValidSelection(project: ProjectConfig, selection: VariantSelection) {
  const { palette, fonts, iconRem, titleRem, subtitleRem } = selection;
  return {
    palette: palette && project.palettes?.[palette] ? palette : '',
    fonts: fonts && project.fontPairs?.[fonts] ? fonts : '',
    iconRem: validRem(iconRem, project.sizeScale?.icon),
    titleRem: validRem(titleRem, project.sizeScale?.title),
    subtitleRem: validRem(subtitleRem, project.sizeScale?.subtitle),
  };
}

// A valid selection replaces the poster's own palette and font pair.
export function getResolvedPoster(
  projectId: string,
  posterId: string,
  selection: VariantSelection = {},
): ResolvedPoster | null {
  if (!isSlug(posterId)) return null;
  const project = getProject(projectId);
  if (!project) return null;
  const poster = readJson<PosterFile>(path.join(POSTERS_DIR, projectId, `${posterId}.json`));
  if (!poster) return null;

  const { overrides } = poster;
  const selected = getValidSelection(project, selection);
  const palettes = project.palettes ?? {};
  const activePalette = selected.palette || poster.palette;
  const fontsName = selected.fonts || poster.fonts;
  const fontPair = fontsName ? project.fontPairs?.[fontsName] : undefined;
  const fontFamily = overrides?.defaultTypography?.fontFamily || project.defaultTypography.fontFamily;

  return {
    id: posterId,
    projectId,
    title: poster.title,
    subtitle: poster.subtitle,
    icon: poster.icon,
    graphic: poster.graphic,
    pinterest: poster.pinterest,
    etsy: poster.etsy,
    aspectRatio: overrides?.defaultLayout?.aspectRatio || project.defaultLayout.aspectRatio,
    printWidthInches:
      overrides?.defaultLayout?.printWidthInches ||
      project.defaultLayout.printWidthInches ||
      DEFAULT_PRINT_WIDTH_INCHES,
    containerClasses: overrides?.defaultLayout?.containerClasses || project.defaultLayout.containerClasses,
    bgClass: overrides?.defaultBackground?.className || project.defaultBackground.className,
    titleClasses: cn(
      overrides?.defaultTypography?.titleClasses || project.defaultTypography.titleClasses,
      fontPair?.titleClasses,
    ),
    subtitleClasses: overrides?.defaultTypography?.subtitleClasses || project.defaultTypography.subtitleClasses,
    titleRem: Number(selected.titleRem) || overrides?.defaultTypography?.titleRem || project.defaultTypography.titleRem,
    subtitleRem:
      Number(selected.subtitleRem) || overrides?.defaultTypography?.subtitleRem || project.defaultTypography.subtitleRem,
    iconRem: Number(selected.iconRem) || poster.icon?.sizeRem || poster.graphic?.sizeRem || project.iconRem,
    body: poster.body ?? [],
    bodyClasses: overrides?.defaultTypography?.bodyClasses || project.defaultTypography.bodyClasses || '',
    titleFont: fontPair?.title || fontFamily,
    bodyFont: fontPair?.body || fontFamily,
    fontsName: fontPair ? fontsName : undefined,
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
