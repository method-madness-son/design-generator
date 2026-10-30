'use client';

import { useEffect, useRef, useState } from 'react';
import { downloadEtsyPack, downloadPinterestPack } from '@/lib/exportUtils';
import { formatEtsyListing, formatPinterestListing } from '@/lib/listingText';
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
};

const triggerClasses = 'rounded-md px-4 py-2 disabled:opacity-50';

export function ExportButton({ elementId, filename, poster, label = 'Export', className }: Props) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
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
    try {
      await task();
      setStatus('idle');
    } catch (error) {
      console.error(error);
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
                run(() =>
                  downloadEtsyPack(
                    elementId,
                    fullFilename,
                    poster.printWidthInches,
                    poster.etsy ? formatEtsyListing(poster.etsy) : undefined,
                  ),
                )
              }
              className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
            >
              <span className="block font-medium text-neutral-900">Download current Etsy item</span>
              <span className="block text-xs text-neutral-500">
                Current preview PNG{poster.etsy ? ' + listing copy' : ''}
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

      {status === 'error' && <p className="text-sm text-red-600">Export failed. See the console for details.</p>}
    </div>
  );
}
