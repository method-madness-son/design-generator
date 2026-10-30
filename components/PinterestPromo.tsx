import { CopyAllButton } from '@/components/CopyAllButton';
import { PinterestTeaser } from '@/components/PinterestTeaser';
import { formatPinterestListing } from '@/lib/listingText';
import type { ResolvedPoster } from '@/types/poster';

type Pinterest = NonNullable<ResolvedPoster['pinterest']>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-neutral-900">{value}</p>
    </div>
  );
}

export function PinterestPromoContent({
  poster,
  pinterest,
  filename,
}: {
  poster: ResolvedPoster;
  pinterest: Pinterest;
  filename: string;
}) {
  const fullText = formatPinterestListing(pinterest);

  return (
    <div className="flex flex-wrap gap-5 text-sm">
      <PinterestTeaser poster={poster} filename={filename} />
      <div className="min-w-0 flex-1 space-y-3">
        <Field label="Pin title" value={pinterest.title} />
        <Field label="Pin description" value={pinterest.description} />
        <Field label="Board" value={pinterest.board} />
        <Field label="Alt text" value={pinterest.altText} />
        <Field label="Keywords" value={pinterest.keywords.join(', ')} />
        <CopyAllButton text={fullText} />
      </div>
    </div>
  );
}

export function PinterestPromo({
  poster,
  pinterest,
  filename,
}: {
  poster: ResolvedPoster;
  pinterest: Pinterest;
  filename: string;
}) {
  return (
    // <details> gives the expand/collapse behavior for free, no client JS needed to toggle it.
    <details className="group rounded-lg border border-neutral-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        Pinterest promo
        <span className="text-neutral-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-neutral-200 p-4">
        <PinterestPromoContent poster={poster} pinterest={pinterest} filename={filename} />
      </div>
    </details>
  );
}
