'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  // The item's API route, which answers DELETE.
  url: string;
  // e.g. `poster "vim-wq"`.
  name: string;
  // Where to go once it's gone.
  afterHref: string;
};

export function DeleteItemButton({ url, name, afterHref }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(force: boolean) {
    const response = await fetch(`${url}${force ? '?force=1' : ''}`, { method: 'DELETE' });
    return { status: response.status, body: (await response.json()) as { deleted?: boolean; error?: string; productIds?: string[]; hasSticker?: boolean } };
  }

  async function remove() {
    if (!window.confirm(`Delete ${name}?\n\nThis removes its design, Etsy listing, and exported files from this project. Print files that were never committed can't be recovered.`)) return;
    setBusy(true);
    setError(null);
    try {
      let { status, body } = await send(false);
      if (status === 409 && body.hasSticker) {
        if (!window.confirm('This poster has a sticker made from it. Delete both the poster and its sticker?')) return;
        ({ status, body } = await send(true));
      }
      if (status === 409 && body.productIds) {
        const warning = `This item is on Printify (product ${body.productIds.join(', ')}), and may be live on Etsy. Deleting here does NOT remove it there, and the pipeline will stop tracking it.\n\nDelete the local files anyway?`;
        if (!window.confirm(warning)) return;
        ({ status, body } = await send(true));
      }
      if (!body.deleted) throw new Error(body.error ?? `Delete failed (${status}).`);
      router.push(afterHref);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
