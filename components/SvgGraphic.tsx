import type { CSSProperties } from 'react';

import crossedSticksSvg from '@/graphics/crossed-sticks.svg';
import gravelSvg from '@/graphics/gravel.svg';
import snowflakeSvg from '@/graphics/snowflake.svg';
import tarmacSvg from '@/graphics/tarmac.svg';

function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'default' in v) return String((v as { default: unknown }).default);
  return String(v ?? '');
}

const SVG_FILES: Record<string, string> = {
  'crossed-sticks': toStr(crossedSticksSvg),
  'gravel': toStr(gravelSvg),
  'snowflake': toStr(snowflakeSvg),
  'tarmac': toStr(tarmacSvg),
};

export const SVG_GRAPHIC_NAMES = Object.keys(SVG_FILES);

export function hasSvgGraphic(name: string): boolean {
  return name in SVG_FILES;
}

export function getSvgData(name: string) {
  const raw = SVG_FILES[name];
  if (!raw) return null;
  return parse(raw);
}

function parse(raw: string) {
  const vbMatch = raw.match(/viewBox="([^"]+)"/);
  const viewBox = vbMatch?.[1] ?? '0 0 100 100';
  const hasClasses = raw.includes('class="');
  const inner = raw
    .replace(/<\?xml[^?]*\?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return { viewBox, inner, hasClasses };
}

export function SvgGraphic({
  name,
  className,
  sizeRem,
  style,
}: {
  name: string;
  className?: string;
  sizeRem: number;
  style?: CSSProperties;
}) {
  const raw = SVG_FILES[name];
  if (!raw) return null;

  const { viewBox, inner, hasClasses } = parse(raw);
  const parts = viewBox.split(/\s+/).map(Number);
  const vbW = parts[2] ?? 100;
  const vbH = parts[3] ?? 100;
  const heightRem = (sizeRem * vbH) / vbW;

  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={{ width: `${sizeRem}rem`, height: `${heightRem}rem`, ...style }}
      {...(!hasClasses && { fill: 'currentColor' })}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
