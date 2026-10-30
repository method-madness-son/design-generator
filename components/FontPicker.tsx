'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryParam } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  param: string;
  // Font name -> CSS font-family value, e.g. { Cinzel: 'var(--font-cinzel), serif' }.
  fonts: Record<string, string>;
  // Currently selected font name; empty means the poster's own default.
  value: string;
};

export function FontPicker({ label, param, fonts, value }: Props) {
  const setParam = useQueryParam(param);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedFamily = value ? fonts[value] : undefined;

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
        <span className="flex-1 truncate text-left text-neutral-700" style={{ fontFamily: selectedFamily }}>
          {value || 'Default'}
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
        <div className="absolute top-full left-0 z-40 mt-1.5 max-h-60 w-48 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-xl">
          <Option name="Default" selected={value === ''} onClick={() => choose('Default')} />
          {Object.entries(fonts).map(([name, family]) => (
            <Option key={name} name={name} family={family} selected={value === name} onClick={() => choose(name)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Option({
  name,
  family,
  selected,
  onClick,
}: {
  name: string;
  family?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition-colors',
        selected ? 'bg-neutral-100' : 'hover:bg-neutral-50',
      )}
    >
      <span className="truncate text-sm text-neutral-800" style={{ fontFamily: family }}>
        {name}
      </span>
      {family && (
        <span className="shrink-0 text-sm text-neutral-400" style={{ fontFamily: family }}>
          Aa
        </span>
      )}
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
