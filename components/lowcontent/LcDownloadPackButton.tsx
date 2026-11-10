'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { cn } from '@/lib/utils';

type Props = {
  bookId: string;
  bookTitle: string;
  savedElements: string[];
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function LcDownloadPackButton({ bookId, bookTitle, savedElements: initial }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elements = initial;

  if (elements.length === 0) return null;

  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const zip = new JSZip();
      for (const elementId of elements) {
        const response = await fetch(`/api/lc-exports/${bookId}?element=${encodeURIComponent(elementId)}`);
        if (!response.ok) throw new Error(`Failed to fetch ${elementId}`);
        const blob = await response.blob();
        zip.file(`${bookId}-${elementId}.png`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${bookId}-kdp-pack.zip`);
    } catch (caught) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
          'bg-black text-white hover:bg-neutral-800',
        )}
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {busy ? 'Packaging…' : 'Download KDP pack'}
      </button>
      <span className="text-xs text-neutral-500">{elements.length} export{elements.length === 1 ? '' : 's'} saved</span>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
