'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function CollapsibleSection({
  label,
  defaultOpen = true,
  children,
  className,
}: {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('flex flex-col gap-2 rounded-md border border-neutral-100 bg-neutral-50/60 p-2.5', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-semibold text-neutral-600">{label}</span>
        <svg
          className={cn('size-3.5 shrink-0 text-neutral-400 transition-transform', open && 'rotate-180')}
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
      {open && <div className="flex flex-wrap gap-x-3 gap-y-2">{children}</div>}
    </div>
  );
}
