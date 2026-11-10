'use client';

import { useState } from 'react';
import { toCanvas } from 'html-to-image';
import { cn } from '@/lib/utils';

type Props = {
  elementId: string;
  bookId: string;
  previewNodeId: string;
  widthPx: number;
  heightPx: number;
  selection: Record<string, string>;
  saved: boolean;
};

async function nodeToExactPng(node: HTMLElement, widthPx: number, heightPx: number): Promise<Blob> {
  const rendered = await toCanvas(node, { pixelRatio: widthPx / node.offsetWidth });
  const exact = document.createElement('canvas');
  exact.width = widthPx;
  exact.height = heightPx;
  const context = exact.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  context.imageSmoothingQuality = 'high';
  context.drawImage(rendered, 0, 0, widthPx, heightPx);
  rendered.width = rendered.height = 0;
  const blob = await new Promise<Blob | null>((resolve) => exact.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to render to PNG');
  return blob;
}

export function LcSaveButton({ elementId, bookId, previewNodeId, widthPx, heightPx, selection, saved: initialSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(initialSaved);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const node = document.getElementById(previewNodeId);
      if (!node) throw new Error(`Element #${previewNodeId} not found`);
      const blob = await nodeToExactPng(node, widthPx, heightPx);
      const form = new FormData();
      form.append('elementId', elementId);
      form.append('selection', JSON.stringify(selection));
      form.append('file', blob, `${bookId}-${elementId}.png`);
      const response = await fetch(`/api/lc-exports/${bookId}`, { method: 'POST', body: form });
      const result = (await response.json()) as { elements?: string[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
      setSaved(true);
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
        onClick={handleSave}
        disabled={busy}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
          'bg-black text-white hover:bg-neutral-800',
        )}
      >
        {busy ? 'Saving…' : saved ? `Re-save ${elementId}` : `Save ${elementId} for KDP`}
      </button>
      {saved && !busy && <span className="text-xs text-green-700">Saved</span>}
      {error && <p className="text-sm text-red-600">Export failed: {error}</p>}
    </div>
  );
}
