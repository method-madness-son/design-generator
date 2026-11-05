'use client';

import { icons } from 'lucide-react';
import { WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX, WRAP_DPI } from '@/lib/wrapSizes';

type IconName = keyof typeof icons;

const toPascalCase = (name: string) =>
  name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const TILE_WIDTH_IN = WRAP_TILE_WIDTH_PX / WRAP_DPI;
const TILE_HEIGHT_IN = WRAP_TILE_HEIGHT_PX / WRAP_DPI;

type Props = {
  iconNames: string[];
  background: string;
  foreground: string;
  cellSizeIn?: number;
  iconSizeIn?: number;
};

export function WrapIconGrid({
  iconNames,
  background,
  foreground,
  cellSizeIn = 3,
  iconSizeIn = 1.4,
}: Props) {
  const cols = Math.ceil(TILE_WIDTH_IN / cellSizeIn);
  const rows = Math.ceil(TILE_HEIGHT_IN / cellSizeIn);
  const cellPx = WRAP_DPI * cellSizeIn;
  const iconPx = WRAP_DPI * iconSizeIn;

  const items: { icon: IconName; col: number; row: number; key: string }[] = [];
  let iconIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const name = toPascalCase(iconNames[iconIndex % iconNames.length]) as IconName;
      if (icons[name]) {
        items.push({ icon: name, col, row, key: `${row}-${col}` });
      }
      iconIndex++;
    }
  }

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
      {items.map(({ icon, col, row, key }) => {
        const Icon = icons[icon];
        const stagger = row % 2 === 1 ? cellPx / 2 : 0;
        const x = col * cellPx + stagger + (cellPx - iconPx) / 2;
        const y = row * cellPx + (cellPx - iconPx) / 2;
        return (
          <Icon
            key={key}
            width={iconPx}
            height={iconPx}
            strokeWidth={1.5}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              color: foreground,
              filter: `drop-shadow(0 0 ${WRAP_DPI * 0.06}px ${foreground})`,
              opacity: 0.85,
            }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
