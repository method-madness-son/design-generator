import type { ReactNode } from 'react';
import { StickerCutLine } from '@/components/stickers/StickerCutLine';
import type { StickerType } from '@/lib/stickerSizes';

// How the sticker is cut, drawn around the canvas so it never ends up in the print file.
export function StickerStage({ type, cutAround, children }: { type: StickerType; cutAround?: string; children: ReactNode }) {
  if (cutAround) {
    return (
      <div className="relative rounded-md bg-white shadow-lg">
        {children}
        <StickerCutLine canvasId={cutAround} />
      </div>
    );
  }
  if (type !== 'kiss-cut') return <div className="shadow-lg">{children}</div>;
  return (
    <div className="rounded-md bg-white p-6 shadow-lg">
      <div className="relative overflow-hidden rounded-[40px]">
        {children}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[40px] border-2 border-dashed border-neutral-400/70" />
      </div>
    </div>
  );
}
