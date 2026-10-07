'use client';

import { useState } from 'react';

export function CopyAllButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:border-neutral-400"
    >
      {copied ? 'Copied' : 'Copy all as text'}
    </button>
  );
}
