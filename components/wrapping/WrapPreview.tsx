import { WrapIconGrid } from '@/components/wrapping/WrapIconGrid';
import { WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX } from '@/lib/wrapSizes';
import type { ResolvedWrapParams } from '@/lib/wrapParams';
import type { CustomIcon } from '@/types/wrap';

type Props = {
  iconNames: string[];
  customIcons?: Record<string, CustomIcon>;
  accent?: string;
  resolved: ResolvedWrapParams;
  widthPx?: number;
};

export function WrapPreview({ iconNames, customIcons, accent, resolved, widthPx = 600 }: Props) {
  const scale = widthPx / WRAP_TILE_WIDTH_PX;
  const heightPx = WRAP_TILE_HEIGHT_PX * scale;

  return (
    <div
      className="overflow-hidden rounded-xl border border-neutral-200"
      style={{ width: widthPx, height: heightPx }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <WrapIconGrid
          iconNames={iconNames}
          customIcons={customIcons}
          background={resolved.background}
          foreground={resolved.foreground}
          accent={accent}
          cellSizeIn={resolved.cellSizeIn}
          iconSizeIn={resolved.iconSizeIn}
          glowIn={resolved.glowIn}
          opacity={resolved.opacity}
          strokeWidth={resolved.strokeWidth}
        />
      </div>
    </div>
  );
}
