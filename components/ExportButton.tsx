'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { downloadPinterestPack, saveListingExport } from '@/lib/exportUtils';
import { formatPinterestListing } from '@/lib/listingText';
import { cn } from '@/lib/utils';
import type { ResolvedPoster } from '@/types/poster';

type Props = {
  elementId: string;
  // Base name without the palette, e.g. "neuro-zones-quiet-zone".
  filename: string;
  poster: ResolvedPoster;
  // Text on the dropdown trigger.
  label?: string;
  className?: string;
  // Where "Save for Etsy listing" writes. size is null when the current layout is not a
  // sellable print size (pick one with the Print Size control first).
  listing: {
    size: string | null;
    sizeLabel?: string;
    widthPx: number;
    heightPx: number;
    savedSizes: string[];
    selection: Record<string, string>;
  };
};

const triggerClasses = 'rounded-md px-4 py-2 disabled:opacity-50';

export function ExportButton({ elementId, filename, poster, label = 'Export', className, listing }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedSizes, setSavedSizes] = useState(listing.savedSizes);
  const isSaved = listing.size !== null && savedSizes.includes(listing.size);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullFilename = [filename, poster.paletteName].filter(Boolean).join('-');
  // The Pinterest pin image only exists in the DOM when PinterestPromo (and its hidden
  // PinterestTeaser) is rendered, which only happens when the poster has pinterest copy.
  const pinterestElementId = `pinterest-pin-${poster.id}`;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  async function run(task: () => Promise<void>) {
    setOpen(false);
    setStatus('exporting');
    setErrorMessage('');
    try {
      await task();
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus('error');
    }
  }

  return (
    <div className={cn('flex flex-col items-start gap-2', className)}>
      <div className="relative inline-flex" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={status === 'exporting'}
          aria-expanded={open}
          className={cn(triggerClasses, 'flex items-center gap-2 bg-black text-white hover:bg-neutral-800')}
        >
          {status === 'exporting' ? 'Exporting…' : label}
          <svg
            className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-0 z-30 mt-1 w-56 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() =>
                run(async () => {
                  if (!listing.size) return;
                  const result = await saveListingExport(
                    elementId,
                    { projectId: poster.projectId, posterId: poster.id, size: listing.size, widthPx: listing.widthPx, heightPx: listing.heightPx },
                    listing.selection,
                  );
                  setSavedSizes(result.sizes);
                  router.refresh();
                })
              }
              disabled={!listing.size}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <span className="block font-medium text-neutral-900">
                {isSaved ? `Re-save ${listing.size} for Etsy listing` : 'Save for Etsy listing'}
              </span>
              <span className="block text-xs text-neutral-500">
                {listing.size
                  ? `${listing.widthPx}×${listing.heightPx} PNG → posters/${poster.projectId}/exports/`
                  : 'Pick a Print Size first'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                run(() =>
                  downloadPinterestPack(
                    pinterestElementId,
                    fullFilename,
                    poster.pinterest ? formatPinterestListing(poster.pinterest) : undefined,
                  ),
                )
              }
              disabled={!poster.pinterest}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <span className="block font-medium text-neutral-900">Download Pinterest pack</span>
              <span className="block text-xs text-neutral-500">
                {poster.pinterest ? 'Pin image + listing copy' : 'No Pinterest copy for this poster'}
              </span>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-neutral-500" data-listing-status>
        {savedSizes.length > 0 ? (
          <>
            <span className="font-medium text-emerald-700">Eligible for listing</span> · saved {savedSizes.join(', ')}
            {poster.etsy ? '' : ' · needs Etsy copy'}
          </>
        ) : (
          'Not saved yet · not listed'
        )}
      </p>

      {status === 'error' && (
        <p className="text-sm text-red-600">Export failed{errorMessage ? `: ${errorMessage}` : '. See the console for details.'}</p>
      )}
    </div>
  );
}
