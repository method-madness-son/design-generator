import fs from 'fs';
import path from 'path';
import rawTheme from '@/theme/global.json';
import { THEME_FONT_CSS } from '@/lib/themeFontFaces';
import type {
  GlobalTheme,
  InkChoice,
  InkSetName,
  InkSwatch,
  MarketOverride,
  MarketSwatch,
  NamedPalette,
  ShirtColor,
  WcagBand,
} from '@/types/theme';

export const globalTheme: GlobalTheme = rawTheme;

/** Inks below this contrast vs the reference shirt are left off the ink lists. */
export const MIN_INK_CONTRAST = 3;

export const PREVIEW_SHIRT_NAMES = ['White', 'Black', 'Heather Gray', 'Navy'] as const;

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function wcagBand(ratio: number): WcagBand {
  if (ratio >= 4.5) return 'AA_normal';
  if (ratio >= MIN_INK_CONTRAST) return 'AA_large_graphics_only';
  return 'below_minimum';
}

export function listShirts(): ShirtColor[] {
  return globalTheme.shirt_colors.colors;
}

export function shirtByName(name: string): ShirtColor | null {
  return listShirts().find((shirt) => shirt.name === name) ?? null;
}

export function resolveShirt(name: string): {
  shirt: ShirtColor | null;
  requested: string;
  fallbackFrom?: string;
  warning?: string;
} {
  const direct = shirtByName(name);
  if (direct) return { shirt: direct, requested: name };
  const fallback = globalTheme.shirt_colors.fallbacks?.find((entry) => entry.name === name);
  if (!fallback) return { shirt: null, requested: name, warning: `No shirt color named ${name}.` };
  const shirt = shirtByName(fallback.fallback);
  if (!shirt) {
    return {
      shirt: null,
      requested: name,
      warning: `${name} falls back to ${fallback.fallback}, which is not a shirt color.`,
    };
  }
  return {
    shirt,
    requested: name,
    fallbackFrom: name,
    warning: `${name} is not a shirt color. Using ${shirt.name} (${shirt.hex}). ${fallback.reason}`,
  };
}

function catalogFamilies(): string[] {
  const faces = [
    ...globalTheme.fonts.display,
    ...globalTheme.fonts.supporting,
    ...globalTheme.fonts.hand_drawn,
    ...globalTheme.fonts.mono,
  ];
  return faces.map((face) => face.family);
}

function marketFontNames(): string[] {
  const names: string[] = [];
  for (const market of Object.values(globalTheme.per_market_overrides)) {
    if (market.fonts?.display) names.push(market.fonts.display);
    if (market.fonts?.supporting) names.push(market.fonts.supporting);
    names.push(...(market.alt_fonts ?? []));
  }
  return names;
}

export function allowedFontFamilies(): string[] {
  return [...new Set([...catalogFamilies(), ...marketFontNames()])];
}

export function bannedFontReason(family: string): string | null {
  const match = globalTheme.fonts.banned.find((entry) => entry.family && entry.family === family);
  if (!match) return null;
  return match.reason ? `${family} is banned (${match.reason}).` : `${family} is banned.`;
}

/** Null when the family may be used. Otherwise a sentence a validator can print. */
export function fontIssue(family: string): string | null {
  const banned = bannedFontReason(family);
  if (banned) return banned;
  if (!allowedFontFamilies().includes(family)) {
    return `${family} is not in the global theme allow-list. Only listed OFL/Apache families are allowed.`;
  }
  if (!THEME_FONT_CSS[family]) {
    return `${family} is allowed by the theme but is not loaded in lib/themeFontFaces.ts.`;
  }
  return null;
}

export function fontFamilyCss(family: string): string {
  return THEME_FONT_CSS[family] ?? 'sans-serif';
}

export function getMarket(id: string): MarketOverride | null {
  return globalTheme.per_market_overrides[id] ?? null;
}

export function getPalette(id: string): NamedPalette | null {
  return globalTheme.palettes[id] ?? null;
}

function fromSwatch(swatch: InkSwatch): InkChoice {
  return {
    name: swatch.name,
    hex: swatch.hex,
    wcag: swatch.wcag,
    contrastRatio: swatch.contrast_ratio,
  };
}

function marketInkList(swatches: MarketSwatch[], isDark: boolean): InkChoice[] {
  const key = isDark ? 'contrast_vs_pepper' : 'contrast_vs_ivory';
  return swatches
    .filter((swatch) => swatch[key] >= MIN_INK_CONTRAST)
    .map((swatch) => ({
      name: swatch.name,
      hex: swatch.hex,
      contrastRatio: swatch[key],
      wcag: wcagBand(swatch[key]),
    }));
}

export function inkListFor(paletteId: string, isDark: boolean): InkChoice[] | null {
  const named = getPalette(paletteId);
  if (named) {
    const list = isDark ? named.ink.on_dark_shirt : named.ink.on_light_shirt;
    return list.map(fromSwatch);
  }
  const market = getMarket(paletteId);
  if (market?.palette) return marketInkList(market.palette, isDark);
  return null;
}

export function chooseInk(list: InkChoice[], requested?: string): { ink: InkChoice; warning?: string } {
  if (list.length === 0) {
    return { ink: { name: 'missing', hex: '#000000' }, warning: 'This shirt side has no listed ink.' };
  }
  if (!requested) return { ink: list[0] };
  const match = list.find((ink) => ink.name === requested || ink.hex.toLowerCase() === requested.toLowerCase());
  if (match) return { ink: match };
  return {
    ink: list[0],
    warning: `Ink "${requested}" is not listed for this shirt. Using ${list[0].name} (${list[0].hex}).`,
  };
}

export type PosterPaletteRole = { role: string; hex: string };

/** Read-only bridge for a later poster pipeline. Does not write poster JSON. */
export function mapPosterColorPalette(palette: Record<string, string>): PosterPaletteRole[] {
  const roles = ['background', 'ink', 'accent'] as const;
  return roles.filter((role) => Boolean(palette[role])).map((role) => ({ role, hex: palette[role] }));
}

export const DEV_REALITIES_PROJECT = 'posters/dev-realities/project.json';

export function readPosterPaletteBridge(relativePath: string): {
  roles: PosterPaletteRole[];
  fontFamily: string;
} | null {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    colorPalette?: Record<string, string>;
    defaultTypography?: { fontFamily?: string };
  };
  return {
    roles: mapPosterColorPalette(parsed.colorPalette ?? {}),
    fontFamily: parsed.defaultTypography?.fontFamily ?? '',
  };
}

function checkHex(label: string, hex: string, errors: string[]) {
  if (!HEX.test(hex)) errors.push(`${label} hex ${hex} is not a solid #RRGGBB color.`);
}

export function validateGlobalTheme(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (globalTheme.shirt_colors.hex_note === 'approximate') {
    warnings.push('Shirt hex values are approximate. Confirm them against a Comfort Colors chart before production.');
  }
  for (const note of globalTheme.meta.local_additions ?? []) warnings.push(note);

  const names = new Set<string>();
  for (const shirt of listShirts()) {
    if (names.has(shirt.name)) errors.push(`Duplicate shirt color ${shirt.name}.`);
    names.add(shirt.name);
    checkHex(shirt.name, shirt.hex, errors);
    if (shirt.source === 'added_for_preview') {
      warnings.push(`${shirt.name} was added for previews and is not a ${globalTheme.shirt_colors.blank} chart color.`);
    }
  }

  for (const required of ['Black', ...PREVIEW_SHIRT_NAMES]) {
    if (!shirtByName(required)) errors.push(`Preview shirt ${required} is missing from shirt_colors.`);
  }

  for (const fallback of globalTheme.shirt_colors.fallbacks ?? []) {
    const resolved = resolveShirt(fallback.name);
    if (!resolved.shirt || resolved.shirt.name !== fallback.fallback) {
      errors.push(`Fallback ${fallback.name} → ${fallback.fallback} did not resolve.`);
    } else {
      warnings.push(resolved.warning ?? `${fallback.name} falls back to ${fallback.fallback}.`);
    }
  }

  if (fontIssue("Keep on Truckin'") === null) {
    errors.push("Banned face Keep on Truckin' was accepted.");
  }
  if (fontIssue('Comic Sans MS') === null) {
    errors.push('An unlisted face was accepted.');
  }

  for (const family of allowedFontFamilies()) {
    const issue = fontIssue(family);
    if (issue) errors.push(issue);
  }

  for (const [id, palette] of Object.entries(globalTheme.palettes)) {
    if (palette.status.includes('unverified')) {
      warnings.push(`Palette ${id} is ${palette.status}.`);
    }
    for (const color of palette.colors) checkHex(`${id}.${color.name}`, color.hex, errors);
    for (const setName of ['on_light_shirt', 'on_dark_shirt'] as const) {
      const list = palette.ink[setName];
      if (list.length === 0) errors.push(`${id} ${setName} has no inks.`);
      for (const ink of list) {
        checkHex(`${id}.${setName}.${ink.name}`, ink.hex, errors);
        if (ink.contrast_ratio !== undefined && ink.contrast_ratio < MIN_INK_CONTRAST) {
          errors.push(`${id} ${setName} includes ${ink.name} below contrast ${MIN_INK_CONTRAST}.`);
        }
      }
    }
    for (const role of ['display', 'supporting'] as const) {
      const issue = fontIssue(palette.fonts[role]);
      if (issue) errors.push(`${id} font: ${issue}`);
    }
  }

  for (const [id, market] of Object.entries(globalTheme.per_market_overrides)) {
    if (market.status === 'proposed_unverified') {
      warnings.push(`Market ${id} is proposed_unverified.`);
    }
    if (market.fonts) {
      for (const role of ['display', 'supporting'] as const) {
        const issue = fontIssue(market.fonts[role]);
        if (issue) errors.push(`${id} font: ${issue}`);
      }
    }
    for (const alt of market.alt_fonts ?? []) {
      const issue = fontIssue(alt);
      if (issue) errors.push(`${id} alt font: ${issue}`);
    }
    for (const swatch of market.palette ?? []) checkHex(`${id}.${swatch.name}`, swatch.hex, errors);
    for (const shirtName of market.recommended_shirts ?? []) {
      const resolved = resolveShirt(shirtName);
      if (!resolved.shirt) errors.push(`${id} recommends ${shirtName}, which did not resolve.`);
    }
  }

  const devDark = inkListFor('dev', true) ?? [];
  const devLight = inkListFor('dev', false) ?? [];
  if (devDark.some((ink) => ink.name === 'syntax_purple') || devLight.some((ink) => ink.name === 'syntax_purple')) {
    errors.push('syntax_purple is below the contrast floor and must stay off the dev ink lists.');
  }

  return { errors, warnings };
}
