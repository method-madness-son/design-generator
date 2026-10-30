'use client';

import { useState, type ReactNode } from 'react';
import { PosterCanvas } from '@/components/PosterCanvas';
import { cn } from '@/lib/utils';
import type { ResolvedPoster } from '@/types/poster';

// A CSS transform: scale() on the wrapper doesn't change the canvas's own layout box (offsetWidth
// stays the base 640px), so zooming here never affects the 300 DPI export math in exportUtils.ts.
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const DEFAULT_ZOOM_INDEX = 2; // 1x

export function PosterZoomView({ poster, id }: { poster: ResolvedPoster; id: string }) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_STEPS[zoomIndex];
  const atMin = zoomIndex === 0;
  const atMax = zoomIndex === ZOOM_STEPS.length - 1;

  return (
    <div className="relative min-h-[50vh] overflow-hidden rounded-xl bg-neutral-100 lg:min-h-[70vh]">
      <div className="flex h-full items-center justify-center overflow-auto p-4 sm:p-6">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
          <PosterCanvas poster={poster} id={id} />
        </div>
      </div>

      {/* Floating zoom controls, overlaid on the poster view itself rather than the page, so they
          stay put regardless of scroll position when zoomed in. */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-white/90 p-1 shadow-lg backdrop-blur">
        <ZoomButton label="Zoom out" onClick={() => setZoomIndex((i) => Math.max(0, i - 1))} disabled={atMin}>
          <path d="M5 12h14" />
        </ZoomButton>
        <button
          type="button"
          onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)}
          className="w-14 select-none rounded-md border border-neutral-300 bg-white py-1 text-center text-xs text-neutral-700 shadow-sm transition-colors hover:border-neutral-400"
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ZoomButton label="Zoom in" onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={atMax}>
          <path d="M12 5v14M5 12h14" />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white shadow-sm transition-colors',
        disabled ? 'text-neutral-300' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
