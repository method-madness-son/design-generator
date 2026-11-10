import { WRAP_DEFAULTS } from '@/components/wrapping/WrapIconGrid';

export type WrapJson = {
  id: string;
  title: string;
  colors?: { background?: string; foreground?: string; accent?: string };
  icons?: string[];
  customIcons?: Record<string, import('@/types/wrap').CustomIcon>;
};

export type ResolvedWrapParams = {
  background: string;
  foreground: string;
  cellSizeIn: number;
  iconSizeIn: number;
  glowIn: number;
  opacity: number;
  strokeWidth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function num(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

function hex(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  return /^#[0-9a-f]{3,8}$/i.test(raw) ? raw : fallback;
}

export function parseWrapParams(
  json: WrapJson,
  sp: Record<string, string | undefined>,
): ResolvedWrapParams {
  const bg = json.colors?.background ?? '#FFFFFF';
  const fg = json.colors?.foreground ?? '#000000';
  return {
    background: hex(sp.bg, bg),
    foreground: hex(sp.fg, fg),
    cellSizeIn: num(sp.cell, WRAP_DEFAULTS.cellSizeIn, 1, 8),
    iconSizeIn: num(sp.icon, WRAP_DEFAULTS.iconSizeIn, 0.4, 6),
    glowIn: num(sp.glow, WRAP_DEFAULTS.glowIn, 0, 0.3),
    opacity: num(sp.opacity, WRAP_DEFAULTS.opacity, 0.1, 1),
    strokeWidth: num(sp.stroke, WRAP_DEFAULTS.strokeWidth, 0.5, 4),
  };
}

export const WRAP_PARAM_KEYS = ['bg', 'fg', 'cell', 'icon', 'glow', 'opacity', 'stroke'] as const;
