'use client';

import { useEffect, useRef, useState } from 'react';
import { CANVAS_WIDTH, PosterCanvas } from '@/components/PosterCanvas';
import type { ResolvedPoster } from '@/types/poster';

// Scales the fixed-width PosterCanvas down to whatever width its container ends up
// with, so thumbnails stay sharp at any grid/sidebar layout instead of a hardcoded size.
export function PosterThumbnail({ poster }: { poster: ResolvedPoster }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / CANVAS_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ aspectRatio: poster.aspectRatio.replace('/', ' / ') }}
    >
      <div className="origin-top-left" style={{ width: CANVAS_WIDTH, transform: `scale(${scale})` }}>
        <PosterCanvas poster={poster} />
      </div>
    </div>
  );
}
