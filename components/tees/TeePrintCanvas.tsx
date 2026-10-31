import { TeeArtwork } from '@/components/tees/TeeArtwork';
import type { InkSetName } from '@/types/theme';
import type { ResolvedTee } from '@/types/tee';

export function TeePrintCanvas({ tee, inkSet }: { tee: ResolvedTee; inkSet: InkSetName }) {
  const ink = tee.inkBySet[inkSet];
  if (!ink) return null;
  const { print } = tee;
  return (
    <div
      data-tee-art="1"
      data-tee-id={tee.id}
      data-print-width={print.widthPx}
      data-print-height={print.heightPx}
      data-ink-set={inkSet}
      style={{
        position: 'relative',
        width: print.widthPx,
        height: print.heightPx,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: print.box.x,
          top: print.box.y,
          width: print.box.width,
          height: print.box.height,
        }}
      >
        <TeeArtwork tee={tee} ink={ink} widthPx={print.box.width} heightPx={print.box.height} />
      </div>
    </div>
  );
}
