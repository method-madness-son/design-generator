'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function StagedToggle({ itemKey, staged: initial }: { itemKey: string; staged: boolean }) {
  const router = useRouter();
  const [staged, setStaged] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch('/api/staged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: itemKey, staged: !staged }),
      });
      if (res.ok) {
        setStaged(!staged);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition disabled:opacity-50',
        staged ? 'bg-violet-100 text-violet-800 hover:bg-violet-200' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
      )}
    >
      {staged ? 'Staged' : 'Stage'}
    </button>
  );
}
