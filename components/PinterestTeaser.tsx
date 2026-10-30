'use client';

import { useState } from 'react';
import { CANVAS_WIDTH, PosterCanvas } from '@/components/PosterCanvas';
import { downloadPinterestPin } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';
import type { ResolvedPoster } from '@/types/poster';

type Props = {
  poster: ResolvedPoster;
  // Base filename for the exported pin, e.g. "mtg-lgs-rules-zone-graveyard".
  filename: string;
  className?: string;
};

// Pinterest's recommended Pin shape (1000x1500px at export); this is just a smaller on-screen
// preview of it, scaled up to that size on export via downloadPinterestPin.
const PIN_ASPECT = '2 / 3';
const DISPLAY_WIDTH = 220;
// A pale mat around the image, like a framed print, since the poster's own aspect ratio rarely
// matches Pinterest's 2:3 shape exactly.
const MAT_PADDING = 10;

// A clean thumbnail of the poster, sized and exportable to Pinterest's recommended Pin
// dimensions — nothing else baked into the image (title/board/etc. are copy, not pixels).
export function PinterestTeaser({ poster, filename, className }: Props) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
  const elementId = `pinterest-pin-${poster.id}`;
  const innerWidth = DISPLAY_WIDTH - MAT_PADDING * 2;
  const imageScale = innerWidth / CANVAS_WIDTH;

  async function handleExport() {
    setStatus('exporting');
    try {
      await downloadPinterestPin(elementId, filename);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-2', className)}>
      <div
        id={elementId}
        className="flex items-center justify-center overflow-hidden rounded-xl bg-neutral-100 shadow-sm ring-1 ring-neutral-200"
        style={{ width: DISPLAY_WIDTH, aspectRatio: PIN_ASPECT }}
      >
        <div
          className="overflow-hidden rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-1 ring-neutral-300"
          style={{ width: innerWidth, aspectRatio: poster.aspectRatio.replace('/', ' / ') }}
        >
          <div className="origin-top-left" style={{ transform: `scale(${imageScale})` }}>
            <PosterCanvas poster={poster} />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={status === 'exporting'}
        className="text-center text-xs font-medium text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
      >
        {status === 'exporting' ? 'Exporting…' : 'Download pin (1000×1500)'}
      </button>
      {status === 'error' && <p className="text-xs text-red-600">Export failed.</p>}
    </div>
  );
}
