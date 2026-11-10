import { icons } from 'lucide-react';
import { WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX, WRAP_DPI } from '@/lib/wrapSizes';
import { hasSvgGraphic, getSvgData } from '@/components/SvgGraphic';
import type { CustomIcon, CustomIconPath } from '@/types/wrap';

type IconName = keyof typeof icons;

const toPascalCase = (name: string) =>
  name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const TILE_WIDTH_IN = WRAP_TILE_WIDTH_PX / WRAP_DPI;
const TILE_HEIGHT_IN = WRAP_TILE_HEIGHT_PX / WRAP_DPI;

export const WRAP_DEFAULTS = {
  cellSizeIn: 3,
  iconSizeIn: 1.4,
  glowIn: 0,
  opacity: 1,
  strokeWidth: 1.5,
} as const;

type Props = {
  iconNames: string[];
  customIcons?: Record<string, CustomIcon>;
  background: string;
  foreground: string;
  accent?: string;
  cellSizeIn?: number;
  iconSizeIn?: number;
  glowIn?: number;
  opacity?: number;
  strokeWidth?: number;
};

type GridItem = {
  name: string;
  kind: 'lucide' | 'custom' | 'svg';
  col: number;
  row: number;
  key: string;
};

export function WrapIconGrid({
  iconNames,
  customIcons = {},
  background,
  foreground,
  accent = foreground,
  cellSizeIn = WRAP_DEFAULTS.cellSizeIn,
  iconSizeIn = WRAP_DEFAULTS.iconSizeIn,
  glowIn = WRAP_DEFAULTS.glowIn,
  opacity = WRAP_DEFAULTS.opacity,
  strokeWidth = WRAP_DEFAULTS.strokeWidth,
}: Props) {
  const cols = Math.ceil(TILE_WIDTH_IN / cellSizeIn);
  const rows = Math.ceil(TILE_HEIGHT_IN / cellSizeIn);
  const cellPx = WRAP_DPI * cellSizeIn;
  const iconPx = WRAP_DPI * iconSizeIn;
  const glowPx = WRAP_DPI * glowIn;

  const items: GridItem[] = [];
  let iconIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const rawName = iconNames[iconIndex % iconNames.length];
      if (hasSvgGraphic(rawName)) {
        items.push({ name: rawName, kind: 'svg', col, row, key: `${row}-${col}` });
      } else if (customIcons[rawName]) {
        items.push({ name: rawName, kind: 'custom', col, row, key: `${row}-${col}` });
      } else {
        const pascal = toPascalCase(rawName) as IconName;
        if (icons[pascal]) {
          items.push({ name: pascal, kind: 'lucide', col, row, key: `${row}-${col}` });
        }
      }
      iconIndex++;
    }
  }

  const filterStyle = glowPx > 0 ? `drop-shadow(0 0 ${glowPx}px ${foreground})` : undefined;

  return (
    <div
      data-wrap-art
      style={{
        width: WRAP_TILE_WIDTH_PX,
        height: WRAP_TILE_HEIGHT_PX,
        backgroundColor: background,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {items.map(({ name, kind, col, row, key }) => {
        const stagger = row % 2 === 1 ? cellPx / 2 : 0;
        const x = col * cellPx + stagger + (cellPx - iconPx) / 2;
        const y = row * cellPx + (cellPx - iconPx) / 2;
        const pos = { position: 'absolute' as const, left: x, top: y, opacity, filter: filterStyle };

        if (kind === 'svg') {
          const data = getSvgData(name);
          if (data) {
            const html = data.inner
              .replace(/var\(--poster-accent,[^)]*\)/g, accent)
              .replace(/var\(--poster-background,[^)]*\)/g, background);
            return (
              <svg
                key={key}
                width={iconPx}
                height={iconPx}
                viewBox={data.viewBox}
                style={{ ...pos, color: foreground }}
                {...(!data.hasClasses && { fill: 'currentColor' })}
                aria-hidden
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
        }

        if (kind === 'custom') {
          const custom = customIcons[name];
          const vb = custom.viewBox ?? '0 0 24 24';
          const cap = custom.linecap ?? 'round';

          if (custom.paths) {
            const baseStroke = custom.strokeWidth ?? strokeWidth;
            return (
              <svg
                key={key}
                width={iconPx}
                height={iconPx}
                viewBox={vb}
                strokeLinecap={cap}
                strokeLinejoin="round"
                style={pos}
                aria-hidden
              >
                {custom.paths.map((p: CustomIconPath, i: number) => {
                  if (p.knockout) {
                    return (
                      <path key={i} d={p.d} fill={background} stroke={foreground}
                        strokeWidth={p.width ?? baseStroke} />
                    );
                  }
                  if (p.fill) {
                    return (
                      <path key={i} d={p.d}
                        fill={p.accent ? accent : foreground} stroke="none" />
                    );
                  }
                  return (
                    <path key={i} d={p.d} fill="none"
                      stroke={p.accent ? accent : foreground}
                      strokeWidth={p.width ?? baseStroke} />
                  );
                })}
              </svg>
            );
          }

          return (
            <svg
              key={key}
              width={iconPx}
              height={iconPx}
              viewBox={vb}
              fill={custom.fill ? foreground : 'none'}
              stroke={custom.fill ? 'none' : foreground}
              strokeWidth={custom.fill ? 0 : strokeWidth}
              strokeLinecap={cap}
              strokeLinejoin="round"
              style={pos}
              aria-hidden
            >
              <path d={custom.path!} />
            </svg>
          );
        }

        const Icon = icons[name as IconName];
        return (
          <Icon
            key={key}
            width={iconPx}
            height={iconPx}
            strokeWidth={strokeWidth}
            style={{ ...pos, color: foreground }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
