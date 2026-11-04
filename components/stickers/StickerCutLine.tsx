'use client';

import { useEffect, useState } from 'react';

// The white border Printify's cut leaves around the art, in canvas px: about 1/8" at 3".
const BORDER_PX = 27;
type Box = { left: number; top: number; width: number; height: number };

// The estimated kiss-cut line around a design's window, measured so it follows the window's size.
export function StickerCutLine({ canvasId }: { canvasId: string }) {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const art = document.getElementById(canvasId)?.firstElementChild;
    if (!(art instanceof HTMLElement)) return;
    // offset* ignore the zoom transform, so the line stays in canvas px.
    const measure = () => setBox({ left: art.offsetLeft, top: art.offsetTop, width: art.offsetWidth, height: art.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(art);
    return () => observer.disconnect();
  }, [canvasId]);

  if (!box) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute rounded-[28px] border-2 border-dashed border-neutral-400/70"
      style={{ left: box.left - BORDER_PX, top: box.top - BORDER_PX, width: box.width + BORDER_PX * 2, height: box.height + BORDER_PX * 2 }}
    />
  );
}
