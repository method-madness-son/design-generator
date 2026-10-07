import Link from 'next/link';
import { CANVAS_WIDTH, PosterCanvas } from '@/components/PosterCanvas';
import type { ResolvedPoster } from '@/types/poster';

const THUMBNAIL_SCALE = 0.55;

export type FontSpecimenData = {
  name: string;
  // CSS variable the font is exposed under, e.g. "--font-lexend".
  cssVar: string;
  category: string;
  weights: string;
  usedBy: string[];
};

export function TypographySpecimen({ font, poster }: { font: FontSpecimenData; poster: ResolvedPoster }) {
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-6 sm:flex-row sm:items-start">
      <Link
        href={`/${poster.projectId}/${poster.id}`}
        className="block shrink-0 overflow-hidden rounded border border-neutral-100"
        style={{
          width: CANVAS_WIDTH * THUMBNAIL_SCALE,
          aspectRatio: poster.aspectRatio.replace('/', ' / '),
        }}
      >
        <div className="origin-top-left" style={{ transform: `scale(${THUMBNAIL_SCALE})` }}>
          <PosterCanvas poster={poster} />
        </div>
      </Link>

      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">{font.name}</h2>
          <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500">{font.cssVar}</code>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {font.category} &middot; {font.weights}
        </p>
        <p className="mt-3 text-sm text-neutral-600">
          Shown as rendered in <span className="font-medium">{poster.title}</span> ({poster.projectId})
        </p>
        {font.usedBy.length > 0 && (
          <p className="mt-4 text-xs uppercase tracking-wide text-neutral-400">Used in: {font.usedBy.join(' · ')}</p>
        )}
      </div>
    </section>
  );
}
