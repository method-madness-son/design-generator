import fs from "fs";
import path from "path";
import { planSlots, rectInside, safeRect, slotProblems } from "@/lib/mugLayout";
import { CERAMIC_WHITE_HEX, MUG_CANVASES, isMugSize } from "@/lib/mugSizes";
import { fontFamilyCss, fontIssue, getMarket, getPalette, globalTheme, inkListFor, wcagBand } from "@/lib/theme";
import type { InkChoice } from "@/types/theme";
import type {
  MugDesignFile,
  MugGraphic,
  MugProductId,
  MugProjectFile,
  MugWrapLayout,
  ResolvedMug,
  ResolvedMugInk,
} from "@/types/mug";

const MUGS_DIR = path.join(process.cwd(), "mugs");
const PROJECT_FILE = "project.json";
const ETSY_TAG_LIMIT = 13;
const ETSY_TAG_LENGTH = 20;
const ETSY_TITLE_LENGTH = 140;
const WRAP_LAYOUTS: MugWrapLayout[] = ["front", "full-wrap", "drinker-left", "drinker-right"];
const PRODUCTS: MugProductId[] = ["ceramic-white", "accent", "color-changing"];
const GRAPHICS = ["cursor-block", "tab-pips", "steam"] as const;
const DENY = ["neurospicy", "kitchenaid", "pyrex", "github", "javascript", "nintendo", "pokemon"];
const MEDICAL = /\b(cure|cures|diagnose|diagnosis|treatment|medication|supplement)\b/i;

const isSlug = (value: string) => /^[a-z0-9][a-z0-9-_]*$/i.test(value);

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getMugProjects(): MugProjectFile[] {
  if (!fs.existsSync(MUGS_DIR)) return [];
  return fs
    .readdirSync(MUGS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => getMugProject(entry.name))
    .filter((project): project is MugProjectFile => project !== null);
}

export function getMugProject(projectId: string): MugProjectFile | null {
  if (!isSlug(projectId)) return null;
  return readJson<MugProjectFile>(path.join(MUGS_DIR, projectId, PROJECT_FILE));
}

export function getMugDesignIds(projectId?: string): string[] {
  const projects = projectId ? [projectId] : getMugProjects().map((project) => project.id);
  const ids: string[] = [];
  for (const id of projects) {
    if (!isSlug(id)) continue;
    const dir = path.join(MUGS_DIR, id);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file === PROJECT_FILE || !file.endsWith(".json")) continue;
      ids.push(file.replace(/\.json$/, ""));
    }
  }
  return ids.sort();
}

export function findMugDesign(designId: string): { project: MugProjectFile; design: MugDesignFile; fileName: string } | null {
  for (const project of getMugProjects()) {
    const fileName = `${designId}.json`;
    const design = readJson<MugDesignFile>(path.join(MUGS_DIR, project.id, fileName));
    if (design) return { project, design, fileName };
  }
  return null;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lighter = Math.max(luminance(hexA), luminance(hexB));
  const darker = Math.min(luminance(hexA), luminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((start) => {
    const srgb = Number.parseInt(value.slice(start, start + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function toInk(ink: InkChoice): ResolvedMugInk {
  const contrastOnWhite = Math.round(contrastRatio(ink.hex, CERAMIC_WHITE_HEX) * 100) / 100;
  return {
    name: ink.name,
    hex: ink.hex.toUpperCase(),
    contrastOnWhite,
    wcag: wcagBand(contrastOnWhite),
  };
}

function pickInks(paletteId: string): { text: ResolvedMugInk; graphic: ResolvedMugInk; warnings: string[] } | null {
  const list = inkListFor(paletteId, false);
  if (!list || list.length === 0) return null;
  const ranked = list.map(toInk).filter((ink) => ink.contrastOnWhite >= 3);
  const text = ranked.filter((ink) => ink.contrastOnWhite >= 4.5).sort((a, b) => b.contrastOnWhite - a.contrastOnWhite)[0];
  if (!text) return null;
  const graphic =
    ranked
      .filter((ink) => ink.hex !== text.hex)
      .sort((a, b) => b.contrastOnWhite - a.contrastOnWhite)[0] ?? text;
  const warnings: string[] = [];
  if (graphic.hex === text.hex) warnings.push("No second ink reaches contrast 3.0 on white. The graphic uses the text ink.");
  return { text, graphic, warnings };
}

function graphicIssue(graphic: MugGraphic | undefined): string | null {
  if (!graphic) return null;
  if (!(GRAPHICS as readonly string[]).includes(graphic.type)) return `Unknown graphic ${graphic.type}.`;
  return null;
}

export function resolveMug(project: MugProjectFile, design: MugDesignFile): ResolvedMug {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (design.id && !isSlug(design.id)) errors.push(`Design id ${design.id} is not a slug.`);
  if (design.project !== project.title) errors.push(`project "${design.project}" does not match ${project.title}.`);
  if (design.market !== project.market) errors.push(`market "${design.market}" does not match project market ${project.market}.`);

  const market = getMarket(design.market);
  if (!market) errors.push(`Unknown market ${design.market}.`);
  else if (market.status === "proposed_unverified") {
    warnings.push(`Market ${design.market} is proposed_unverified. Treat its colors and fonts as a draft.`);
  }

  const product = design.product ?? project.product ?? "ceramic-white";
  if (!PRODUCTS.includes(product)) errors.push(`Unknown product ${product}.`);
  if (product !== "ceramic-white") {
    errors.push(`${product} is not rendered yet. Print area for accent and color-changing mugs is unverified.`);
  }

  const paletteId = design.palette ?? design.market;
  const named = design.palette ? getPalette(design.palette) : null;
  if (design.palette && !named) errors.push(`Unknown palette ${design.palette}.`);
  if (!design.palette && !market?.palette && !market?.default_palette) {
    errors.push(`Market ${design.market} has no palette. Set palette on the design.`);
  }
  if (named?.status.includes("unverified")) warnings.push(`Palette ${design.palette} is ${named.status}.`);
  if (market?.palettes && design.palette && !market.palettes.includes(design.palette)) {
    warnings.push(`${design.palette} is not in the ${design.market} palette list. Using it as an explicit override.`);
  }

  const paletteFonts = named?.fonts ?? (!design.palette ? market?.fonts : undefined);
  const display = design.fonts?.display ?? paletteFonts?.display ?? "";
  const supporting = design.fonts?.supporting ?? paletteFonts?.supporting ?? "";
  if (!display || !supporting) errors.push("Design needs one display font and one supporting font.");
  for (const family of [display, supporting]) {
    if (!family) continue;
    const issue = fontIssue(family);
    if (issue) errors.push(issue);
  }
  if (display && supporting && display === supporting) {
    warnings.push("Display and supporting are the same family. The theme asks for one of each role.");
  }
  if (display === "Monoton" || supporting === "Monoton") {
    errors.push("Monoton needs letters at least 3 inches tall. A mug wrap is not tall enough.");
  }

  if (!WRAP_LAYOUTS.includes(design.wrap)) errors.push("wrap must be front, full-wrap, drinker-left, or drinker-right.");
  const sizes = Array.isArray(design.sizes) ? design.sizes : [];
  if (sizes.length === 0) errors.push("List at least one mug size.");
  if (new Set(sizes).size !== sizes.length) errors.push("Mug sizes must be unique.");
  for (const size of sizes) {
    if (!isMugSize(size)) errors.push(`Unknown mug size ${size}.`);
    else if (!MUG_CANVASES[size].verified) {
      warnings.push(`${MUG_CANVASES[size].label} canvas is UNVERIFIED. ${MUG_CANVASES[size].sourceNote}`);
    }
  }

  if (!Array.isArray(design.lines) || design.lines.length === 0) errors.push("Design needs at least one text line.");
  for (const line of design.lines ?? []) {
    if (!line.text?.trim()) errors.push("A design line is empty.");
    if (line.font !== "display" && line.font !== "supporting") errors.push("Line font must be display or supporting.");
    if (MEDICAL.test(line.text ?? "")) errors.push(`Printed line "${line.text}" reads as a medical claim.`);
  }
  const graphicError = graphicIssue(design.graphic);
  if (graphicError) errors.push(graphicError);
  const bannedSymbols = market?.symbols_banned ?? [];
  if (bannedSymbols.some((symbol) => /puzzle/i.test(symbol)) && JSON.stringify(design.graphic ?? "").includes("puzzle")) {
    errors.push("Puzzle-piece graphics are banned for this market.");
  }

  const printed = (design.lines ?? []).map((line) => line.text).join(" ");
  const haystack = `${printed} ${design.etsy?.title ?? ""} ${design.etsy?.description ?? ""} ${(design.etsy?.tags ?? []).join(" ")}`;
  for (const word of DENY) {
    if (haystack.toLowerCase().includes(word)) errors.push(`Remove trademarked or watched term "${word}".`);
  }
  for (const phrase of globalTheme.rules.trademark_watch) {
    if (haystack.toUpperCase().includes(phrase.phrase.toUpperCase())) {
      warnings.push(`Trademark watch: ${phrase.phrase}. ${phrase.note}`);
    }
  }

  const inks = pickInks(paletteId);
  if (!inks) errors.push(`No light-ground ink for ${paletteId} reaches contrast 4.5 on ${CERAMIC_WHITE_HEX}.`);
  else warnings.push(...inks.warnings);

  if (display && supporting && inks && WRAP_LAYOUTS.includes(design.wrap)) {
    for (const size of sizes.filter(isMugSize)) {
      const slots = planSlots({
        wrap: design.wrap,
        size,
        lines: design.lines ?? [],
        displayFont: display,
        supportingFont: supporting,
        hasGraphic: Boolean(design.graphic),
      });
      const safe = safeRect(size);
      for (const slot of slots) {
        if (!rectInside(slot, safe)) errors.push(`${size} text slot sits outside the safe rect.`);
        for (const problem of slotProblems(design.lines ?? [], slot, display, supporting)) {
          errors.push(`${size}: ${problem}`);
        }
        const displayPx = slot.displayPx;
        if (displayPx < 160) {
          warnings.push(`${size}: display type is ${displayPx}px, under the 160px mug floor. Shirt minimums are not applied as errors.`);
        }
      }
    }
  }

  const etsy = design.etsy;
  if (!etsy?.title?.trim() || !etsy.description?.trim() || !etsy.category?.trim()) {
    errors.push("etsy title, description, and category are required.");
  }
  if (etsy?.title && etsy.title.length > ETSY_TITLE_LENGTH) {
    errors.push(`Etsy title is ${etsy.title.length} characters. The limit is ${ETSY_TITLE_LENGTH}.`);
  }
  const tags = etsy?.tags ?? [];
  if (tags.length === 0 || tags.length > ETSY_TAG_LIMIT) {
    errors.push(`Etsy allows 1–${ETSY_TAG_LIMIT} tags. This design has ${tags.length}.`);
  }
  for (const tag of tags) {
    if (tag.length === 0 || tag.length > ETSY_TAG_LENGTH) {
      errors.push(`Etsy tag "${tag}" must be 1–${ETSY_TAG_LENGTH} characters.`);
    } else if (!/^[0-9A-Za-z][0-9A-Za-z '-]*$/.test(tag)) {
      errors.push(`Etsy tag "${tag}" has a character Etsy does not allow.`);
    }
  }
  if (new Set(tags.map((tag) => tag.toLowerCase())).size !== tags.length) errors.push("Etsy tags must be unique.");

  return {
    id: design.id,
    projectId: project.id,
    projectTitle: project.title,
    market: design.market,
    marketStatus: market?.status ?? null,
    paletteId,
    paletteLabel: named?.display_name ?? (market ? `${design.market} market colors` : paletteId),
    product,
    fonts: {
      display,
      supporting,
      displayCss: fontFamilyCss(display),
      supportingCss: fontFamilyCss(supporting),
    },
    lines: design.lines ?? [],
    graphic: design.graphic,
    wrap: WRAP_LAYOUTS.includes(design.wrap) ? design.wrap : "front",
    sizes: sizes.filter(isMugSize),
    textInk: inks?.text ?? null,
    graphicInk: inks?.graphic ?? null,
    blankHex: CERAMIC_WHITE_HEX,
    etsy: etsy ?? { title: "", description: "", tags: [], category: "" },
    warnings,
    errors,
  };
}

export function loadResolvedMug(designId: string): ResolvedMug | null {
  const found = findMugDesign(designId);
  if (!found) return null;
  const resolved = resolveMug(found.project, found.design);
  if (found.design.id !== designId) resolved.errors.push(`id ${found.design.id} does not match ${found.fileName}.`);
  return resolved;
}

export function loadAllResolvedMugs(): ResolvedMug[] {
  return getMugDesignIds().map((id) => loadResolvedMug(id)).filter((mug): mug is ResolvedMug => mug !== null);
}

export function mugInkHexes(mug: ResolvedMug): string[] {
  const hexes = [mug.textInk?.hex, mug.graphicInk?.hex].filter((hex): hex is string => Boolean(hex));
  return [...new Set(hexes)];
}
