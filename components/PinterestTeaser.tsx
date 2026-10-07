import { Frame, Pin, Printer, Store } from 'lucide-react';
import { CANVAS_WIDTH, PosterCanvas } from '@/components/PosterCanvas';
import { cn } from '@/lib/utils';
import type { ResolvedPoster } from '@/types/poster';

type Props = {
  poster: ResolvedPoster;
  // Card width as a fraction of the poster's own full print width.
  scale?: number;
  className?: string;
};

const DEFAULT_SCALE = 0.42;
// A pale mat around the image, like a framed print — signals "poster" without
// touching the image itself, where Pinterest overlays its own Save button.
const MAT_PADDING = 10;
const PINTEREST_RED = '#E60023';

function Pill({ icon: Icon, label }: { icon: typeof Frame; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-700">
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

// A mock Pinterest Pin card for one poster: a matted, framed-looking image (so it reads as
// a poster, not just a flat picture), its drafted pin title and board, and a note that it's
// sold on Etsy as both a printed poster and a printable download. Nothing sits on top of the
// image itself, since Pinterest overlays its own Save button there once the pin is live.
// Reusable anywhere a poster is in scope (poster page, grid, a future overview).
export function PinterestTeaser({ poster, scale = DEFAULT_SCALE, className }: Props) {
  if (!poster.pinterest) return null;
  const width = CANVAS_WIDTH * scale;
  const innerWidth = width - MAT_PADDING * 2;
  const imageScale = innerWidth / CANVAS_WIDTH;

  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm', className)}
      style={{ width }}
    >
      <div className="bg-neutral-100" style={{ padding: MAT_PADDING }}>
        <div
          className="overflow-hidden rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.15)] ring-1 ring-neutral-300"
          style={{ width: innerWidth, aspectRatio: poster.aspectRatio.replace('/', ' / ') }}
        >
          <div className="origin-top-left" style={{ transform: `scale(${imageScale})` }}>
            <PosterCanvas poster={poster} />
          </div>
        </div>
      </div>
      <div className="space-y-2 border-t border-neutral-200 bg-white p-3">
        <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{poster.pinterest.title}</p>
        <p className="flex items-center gap-1 text-xs text-neutral-500">
          <Pin className="size-3.5" style={{ color: PINTEREST_RED }} aria-hidden />
          {poster.pinterest.board}
        </p>
        <div className="space-y-1.5 pt-1">
          <p className="flex items-center gap-1 text-xs text-neutral-500">
            <Store className="size-3.5 shrink-0" aria-hidden />
            Available on Etsy as
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Pill icon={Frame} label="Poster" />
            <Pill icon={Printer} label="Printable" />
          </div>
        </div>
      </div>
    </div>
  );
}
