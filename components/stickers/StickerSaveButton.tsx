'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { downloadStickerPng, saveStickerExport } from '@/lib/exportUtils';
import { stickerLayoutProblems } from '@/lib/stickerLayout';
import { STICKER_TYPES, type StickerType } from '@/lib/stickerSizes';
import { cn } from '@/lib/utils';

type Props = {
  canvasId: string;
  projectId: string;
  id: string;
  type: StickerType;
  selection: Record<string, string>;
  saved: boolean;
};

// The sticker version of the poster page's Export dropdown.
export function StickerSaveButton({ canvasId, projectId, id, type, selection, saved }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { widthPx, heightPx } = STICKER_TYPES[type];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  // Art that would be cut off isn't exported, the same rule as `npm run sticker-art`.
  async function run(task: () => Promise<void>, done: string) {
    setOpen(false);
    setBusy(true);
    setMessage(null);
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) throw new Error('Sticker preview not found.');
      const { errors } = stickerLayoutProblems(canvas, type);
      if (errors.length > 0) throw new Error(errors[0]);
      await task();
      setMessage(done);
    } catch (caught) {
      setMessage(`Export failed: ${caught instanceof Error ? caught.message : String(caught)}`);
    } finally {
      setBusy(false);
    }
  }

  const item = 'block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100';
  return (
    <div className="ml-auto flex flex-col items-start gap-1">
      <div className="relative inline-flex" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={busy}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? 'Exporting…' : 'Export Sticker'}
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
                  await saveStickerExport(canvasId, projectId, id, type, selection);
                  router.refresh();
                }, 'Saved for Etsy listing.')
              }
            >
              <span className="block font-medium text-neutral-900">{saved ? 'Re-save for Etsy listing' : 'Save for Etsy listing'}</span>
              <span className="block text-xs break-all text-neutral-500">{widthPx}×{heightPx} PNG → stickers/{projectId}/{id}/exports/</span>
            </button>
            <button type="button" className={item} onClick={() => run(() => downloadStickerPng(canvasId, id, type), 'Downloaded.')}>
              <span className="block font-medium text-neutral-900">Download PNG</span>
              <span className="block text-xs text-neutral-500">{widthPx}×{heightPx} PNG to your computer</span>
            </button>
          </div>
        )}
      </div>
      {message && <p className={cn('text-xs', message.startsWith('Export failed') ? 'text-red-600' : 'text-emerald-700')}>{message}</p>}
    </div>
  );
}
