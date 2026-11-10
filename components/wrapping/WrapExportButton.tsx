'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { downloadWrapTilePng, saveWrapExport } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';

type Props = {
  designId: string;
  exported: boolean;
  bg?: string;
  fg?: string;
};

export function WrapExportButton({ designId, exported, bg, fg }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const artUrl = `/wrapping/${designId}/art${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  async function run(task: () => Promise<void>, done: string) {
    setOpen(false);
    setBusy(true);
    setMessage(null);
    try {
      await task();
      setMessage(done);
    } catch (err) {
      setMessage(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  const item = 'block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative inline-flex" ref={containerRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            disabled={busy}
            aria-expanded={open}
            className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? 'Exporting…' : 'Export'}
            <svg className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {open && (
            <div className="absolute top-full left-0 z-30 mt-1 w-64 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className={item}
                onClick={() =>
                  run(async () => {
                    await saveWrapExport(designId, bg, fg);
                    router.refresh();
                  }, 'Saved for Printify sync.')
                }
              >
                <span className="block font-medium text-neutral-900">
                  {exported ? 'Re-save for Printify' : 'Save for Printify'}
                </span>
                <span className="block text-xs text-neutral-500">
                  9075×10800 PNG → wrapping/{designId}/exports/
                </span>
              </button>
              <button
                type="button"
                className={item}
                onClick={() => run(() => downloadWrapTilePng(designId, bg, fg), 'Downloaded.')}
              >
                <span className="block font-medium text-neutral-900">Download PNG</span>
                <span className="block text-xs text-neutral-500">9075×10800 PNG to your computer</span>
              </button>
            </div>
          )}
        </div>
        <a
          href={artUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Open full tile →
        </a>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          exported ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        )}>
          {exported ? 'Exported' : 'Not exported'}
        </span>
      </div>
      {message && (
        <p className={cn('text-xs', message.startsWith('Export failed') ? 'text-red-600' : 'text-emerald-700')}>
          {message}
        </p>
      )}
    </div>
  );
}
