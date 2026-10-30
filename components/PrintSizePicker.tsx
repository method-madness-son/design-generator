'use client';

import { useEffect, useRef, useState } from 'react';
import { POSTER_SIZES, type PosterSizeName } from '@/lib/posterSizes';
import { useQueryParam } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  param: string;
  // Currently selected size name (e.g. "11x17"); empty means the project's own default (8x10).
  value: string;
};

export function PrintSizePicker({ label, param, value }: Props) {
  const setParam = useQueryParam(param);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = value ? POSTER_SIZES[value as PosterSizeName] : undefined;

  useEffect(() => {
    if (!expanded) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [expanded]);

  function choose(name: string) {
    setParam(name === 'Default' ? '' : name);
    setExpanded(false);
  }

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      {label && <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>}

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex h-7 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2 text-xs shadow-sm transition-colors hover:border-neutral-400"
      >
        <span className="flex-1 truncate text-left text-neutral-700">
          {selected ? selected.label : 'Default (8" × 10")'}
        </span>
        <svg
          className={cn('size-3 shrink-0 text-neutral-400 transition-transform', expanded && 'rotate-180')}
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

      {expanded && (
        <div className="absolute top-full left-0 z-40 mt-1.5 w-48 rounded-md border border-neutral-200 bg-white shadow-xl">
          <Option name="Default" label='Default (8" × 10")' selected={value === ''} onClick={() => choose('Default')} />
          {Object.entries(POSTER_SIZES).map(([name, size]) => (
            <Option key={name} name={name} label={size.label} selected={value === name} onClick={() => choose(name)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Option({
  label,
  selected,
  onClick,
}: {
  name: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-sm transition-colors',
        selected ? 'bg-neutral-100' : 'hover:bg-neutral-50',
      )}
    >
      <span className="truncate text-neutral-800">{label}</span>
      {selected && (
        <svg
          className="size-3 shrink-0 text-neutral-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
