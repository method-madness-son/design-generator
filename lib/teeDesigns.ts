import fs from 'fs';
import path from 'path';
import {
  chooseInk,
  fontFamilyCss,
  fontIssue,
  getMarket,
  getPalette,
  globalTheme,
  inkListFor,
  resolveShirt,
} from '@/lib/theme';
import { TEE_PLACEMENTS, TEE_PRINT_AREA, designBoxInsidePrintArea, designBoxPx, printAreaPx } from '@/lib/teeSizes';
import type { InkSetName } from '@/types/theme';
import type { ResolvedInkSet, ResolvedTee, TeeDesignFile, TeeGraphic, TeePlacementSize, TeeProjectFile } from '@/types/tee';

const TEES_DIR = path.join(process.cwd(), 'tees');
const PROJECT_FILE = 'project.json';
const ETSY_TAG_LIMIT = 13;
const ETSY_TAG_LENGTH = 20;
const ETSY_TITLE_LENGTH = 140;

const isSlug = (value: string) => /^[a-z0-9][a-z0-9-_]*$/i.test(value);

const INK_SETS: InkSetName[] = ['on_light_shirt', 'on_dark_shirt'];

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function getTeeProject(projectId: string): TeeProjectFile | null {
  if (!isSlug(projectId)) return null;
  return readJson<TeeProjectFile>(path.join(TEES_DIR, projectId, PROJECT_FILE));
}

export function getTeeProjects(): TeeProjectFile[] {
  if (!fs.existsSync(TEES_DIR)) return [];
  return fs
    .readdirSync(TEES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => getTeeProject(entry.name))
    .filter((project): project is TeeProjectFile => project !== null);
}

export function getTeeDesignIds(projectId?: string): string[] {
  const projects = projectId ? [projectId] : getTeeProjects().map((project) => project.id);
  const ids: string[] = [];
  for (const id of projects) {
    if (!isSlug(id)) continue;
    const dir = path.join(TEES_DIR, id);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json') || file === PROJECT_FILE) continue;
      ids.push(file.replace(/\.json$/, ''));
    }
  }
  return ids.sort();
}

export function findTeeDesign(designId: string): { project: TeeProjectFile; design: TeeDesignFile } | null {
  if (!isSlug(designId)) return null;
  for (const project of getTeeProjects()) {
    const filePath = path.join(TEES_DIR, project.id, `${designId}.json`);
    const design = readJson<TeeDesignFile>(filePath);
    if (design) return { project, design };
  }
  return null;
}

function graphicIssue(graphic: TeeGraphic | undefined): string | null {
  if (!graphic) return null;
  if (graphic.type === 'browser-tabs') {
    const count = graphic.count ?? 6;
    if (!Number.isInteger(count) || count < 3 || count > 8) return 'browser-tabs count must be an integer from 3 to 8.';
    return null;
  }
  if (graphic.type === 'progress-bar') {
    if (!Number.isInteger(graphic.value) || graphic.value < 0 || graphic.value > 100) {
      return 'progress-bar value must be an integer from 0 to 100.';
    }
    return null;
  }
  return 'Unknown graphic. Puzzle-piece graphics are not allowed.';
}

function resolveInkSet(paletteId: string, setName: InkSetName, requested: string | undefined): ResolvedInkSet | null {
  const isDark = setName === 'on_dark_shirt';
  const list = inkListFor(paletteId, isDark);
  if (!list || list.length === 0) return null;
  const chosen = chooseInk(list, requested);
  const warnings = chosen.warning ? [chosen.warning] : [];
  if (chosen.ink.wcag === 'AA_large_graphics_only') {
    warnings.push(
      `${chosen.ink.name} is AA for large graphics only. Keep it at display size; it is not listed as small-text ink.`,
    );
  }
  const others = list.filter((ink) => ink.name !== chosen.ink.name);
  const chromatic = others.filter((ink) => ink.name !== 'ink_white' && ink.name !== 'ink_black');
  const neutrals = others.filter((ink) => ink.name === 'ink_white' || ink.name === 'ink_black');
  const shapeInks = [...chromatic, ...neutrals];
  return {
    text: chosen.ink,
    shapeInks: shapeInks.length > 0 ? shapeInks : [chosen.ink],
    warnings,
  };
}

export function resolveTee(project: TeeProjectFile, design: TeeDesignFile): ResolvedTee {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (design.id && !isSlug(design.id)) errors.push(`Design id ${design.id} is not a slug.`);
  if (design.project !== project.title) {
    errors.push(`project "${design.project}" does not match ${project.title}.`);
  }
  if (design.market !== project.market) {
    errors.push(`market "${design.market}" does not match project market ${project.market}.`);
  }

  const market = getMarket(design.market);
  if (!market) errors.push(`Unknown market ${design.market}.`);
  else if (market.status === 'proposed_unverified') {
    warnings.push(`Market ${design.market} is proposed_unverified. Treat its colors and fonts as a draft.`);
  }

  const paletteId = design.palette ?? design.market;
  const named = design.palette ? getPalette(design.palette) : null;
  if (design.palette && !named) errors.push(`Unknown palette ${design.palette}.`);
  if (!design.palette && !market?.palette && !market?.default_palette) {
    errors.push(`Market ${design.market} has no palette. Set palette on the design.`);
  }
  if (named?.status.includes('unverified')) warnings.push(`Palette ${design.palette} is ${named.status}.`);

  if (market?.palettes && design.palette && !market.palettes.includes(design.palette)) {
    warnings.push(`${design.palette} is not in the ${design.market} palette list. Using it as an explicit override.`);
  }

  const paletteFonts = named?.fonts ?? (!design.palette ? market?.fonts : undefined);
  const display = design.fonts?.display ?? paletteFonts?.display ?? '';
  const supporting = design.fonts?.supporting ?? paletteFonts?.supporting ?? '';
  if (!display || !supporting) errors.push('Design needs one display font and one supporting font.');
  for (const family of [display, supporting]) {
    if (!family) continue;
    const issue = fontIssue(family);
    if (issue) errors.push(issue);
  }
  if (display && supporting && display === supporting) {
    warnings.push('Display and supporting are the same family. The theme asks for one of each role.');
  }
  if (display === 'Monoton' || supporting === 'Monoton') {
    warnings.push('Monoton is only for 1–2 words at least 3 inches tall.');
  }
  const bebasOnDark = [display, supporting].includes('Bebas Neue');
  if (bebasOnDark) warnings.push('Bebas Neue on a dark shirt should use looser tracking. The renderer adds a little.');

  const size = design.placement?.size;
  const placementKnown = size === 'full-front' || size === 'left-chest';
  if (!placementKnown) errors.push('placement.size must be full-front or left-chest.');
  if (design.placement?.side === 'back') {
    errors.push('Back prints are not rendered yet. Set placement.side to front.');
  } else if (design.placement?.side !== 'front') {
    errors.push('placement.side must be front or back.');
  }
  if (placementKnown && !designBoxInsidePrintArea(size)) {
    errors.push(`${size} does not fit inside the ${TEE_PRINT_AREA.widthIn}×${TEE_PRINT_AREA.heightIn} in print area.`);
  }

  if (!Array.isArray(design.lines) || design.lines.length === 0) errors.push('Design needs at least one text line.');
  for (const line of design.lines ?? []) {
    if (!line.text?.trim()) errors.push('A design line is empty.');
    if (line.font !== 'display' && line.font !== 'supporting') errors.push(`Line font must be display or supporting.`);
    if (/zones of regulation/i.test(line.text ?? '')) errors.push('Do not use the phrase Zones of Regulation.');
  }

  const graphicError = graphicIssue(design.graphic);
  if (graphicError) errors.push(graphicError);
  const bannedSymbols = market?.symbols_banned ?? [];
  if (bannedSymbols.some((symbol) => /puzzle/i.test(symbol)) && design.graphic && JSON.stringify(design.graphic).includes('puzzle')) {
    errors.push('Puzzle-piece graphics are banned for this market.');
  }

  for (const phrase of globalTheme.rules.trademark_watch) {
    const haystack = `${design.lines?.map((line) => line.text).join(' ')} ${design.etsy?.title ?? ''}`;
    if (haystack.toUpperCase().includes(phrase.phrase.toUpperCase())) {
      warnings.push(`Trademark watch: ${phrase.phrase}. ${phrase.note}`);
    }
  }

  const shirts: string[] = [];
  for (const name of design.shirts ?? []) {
    const resolved = resolveShirt(name);
    if (!resolved.shirt) errors.push(resolved.warning ?? `Unknown shirt ${name}.`);
    else {
      shirts.push(resolved.shirt.name);
      if (resolved.warning) warnings.push(resolved.warning);
    }
  }
  if (shirts.length === 0) errors.push('List at least one shirt color.');
  if (shirts.length < 6 || shirts.length > 8) {
    warnings.push(`Theme listing rule is 6–8 shirt colors. This design lists ${shirts.length}.`);
  }

  const inkBySet = {
    on_light_shirt: null,
    on_dark_shirt: null,
  } as Record<InkSetName, ResolvedInkSet | null>;
  if (named || market?.palette || getPalette(paletteId)) {
    for (const setName of INK_SETS) {
      const resolved = resolveInkSet(paletteId, setName, design.ink?.[setName]);
      if (!resolved) errors.push(`No ink list for ${paletteId} ${setName}.`);
      else {
        inkBySet[setName] = resolved;
        warnings.push(...resolved.warnings);
      }
    }
  }

  const etsy = design.etsy;
  if (!etsy?.title?.trim() || !etsy.description?.trim() || !etsy.category?.trim()) {
    errors.push('etsy title, description, and category are required.');
  }
  if (etsy?.title && etsy.title.length > ETSY_TITLE_LENGTH) {
    warnings.push(`Etsy title is ${etsy.title.length} characters. Etsy allows ${ETSY_TITLE_LENGTH}.`);
  }
  const tags = etsy?.tags ?? [];
  if (tags.length > ETSY_TAG_LIMIT) errors.push(`Etsy allows ${ETSY_TAG_LIMIT} tags. This design has ${tags.length}.`);
  for (const tag of tags) {
    if (tag.length === 0 || tag.length > ETSY_TAG_LENGTH) {
      errors.push(`Etsy tag "${tag}" must be 1–${ETSY_TAG_LENGTH} characters.`);
    }
  }
  if (new Set(tags).size !== tags.length) errors.push('Etsy tags must be unique.');

  const area = printAreaPx();
  const box = placementKnown ? designBoxPx(size) : { ...area, x: 0, y: 0, width: area.widthPx, height: area.heightPx, widthIn: 0, heightIn: 0 };
  const placementSize: TeePlacementSize = placementKnown ? size : 'full-front';

  return {
    id: design.id,
    projectId: project.id,
    projectTitle: project.title,
    market: design.market,
    marketStatus: market?.status ?? null,
    paletteId,
    paletteLabel: named?.display_name ?? (market ? `${design.market} override` : paletteId),
    paletteStatus: named?.status ?? market?.status ?? null,
    fonts: {
      display,
      supporting,
      displayCss: fontFamilyCss(display),
      supportingCss: fontFamilyCss(supporting),
    },
    lines: design.lines ?? [],
    graphic: design.graphic,
    placement: {
      side: design.placement?.side === 'back' ? 'back' : 'front',
      size: placementSize,
      label: TEE_PLACEMENTS[placementSize].label,
    },
    print: {
      widthPx: area.widthPx,
      heightPx: area.heightPx,
      widthIn: TEE_PRINT_AREA.widthIn,
      heightIn: TEE_PRINT_AREA.heightIn,
      box: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        widthIn: box.widthIn,
        heightIn: box.heightIn,
      },
    },
    inkBySet,
    shirts,
    etsy: etsy ?? { title: '', description: '', tags: [], category: '' },
    warnings,
    errors,
  };
}

export function loadResolvedTee(designId: string): ResolvedTee | null {
  const found = findTeeDesign(designId);
  if (!found) return null;
  return resolveTee(found.project, found.design);
}

export function loadAllResolvedTees(): ResolvedTee[] {
  const resolved: ResolvedTee[] = [];
  for (const project of getTeeProjects()) {
    for (const designId of getTeeDesignIds(project.id)) {
      const found = findTeeDesign(designId);
      if (found && found.project.id === project.id) resolved.push(resolveTee(found.project, found.design));
    }
  }
  return resolved;
}

export function inkHexes(set: ResolvedInkSet): string[] {
  const hexes = [set.text.hex, ...set.shapeInks.map((ink) => ink.hex)];
  return [...new Set(hexes.map((hex) => hex.toUpperCase()))];
}

export function defaultPreviewShirt(tee: ResolvedTee): string {
  for (const name of ['White', 'Black', 'Heather Gray', 'Navy']) {
    if (tee.shirts.includes(name)) return name;
  }
  return tee.shirts[0] ?? 'White';
}

export function shirtSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
