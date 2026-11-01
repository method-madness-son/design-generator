'use client';

import { useEffect, useRef, useState } from 'react';
import { dedupeSimilarColors, sortColorEntries, sortColorEntriesByLightness } from '@/lib/colorSort';
import { useQueryParams } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  // A single param to set, or several to set to the same value at once (e.g. bundling icon +
  // subtitle color into one control).
  param: string | string[];
  // The same color palette every project offers, so a choice always means the same thing
  // wherever it's picked from.
  colors: Record<string, string>;
  // Currently selected color name; empty means the poster's own default.
  value: string;
  // Hex color shown in the trigger swatch when nothing is selected (the poster's own default).
  defaultColor?: string;
  // 'hue' (default) groups same-ish hues together; 'lightness' lists darkest to lightest,
  // ignoring hue — used for the background picker.
  sortBy?: 'hue' | 'lightness';
};

export function ColorWheelPicker({ label, param, colors, value, defaultColor, sortBy = 'hue' }: Props) {
  const setParam = useQueryParams(Array.isArray(param) ? param : [param]);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const deduped = Object.fromEntries(dedupeSimilarColors(Object.entries(colors)));
  const allColors = sortBy === 'lightness' ? sortColorEntriesByLightness(deduped) : sortColorEntries(deduped);
  const selectedColor = allColors.find(([name]) => name === value)?.[1];
  const displayColor = selectedColor ?? defaultColor;

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      {label && <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>}

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex h-7 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2 text-xs shadow-sm transition-colors hover:border-neutral-400"
      >
        <Swatch color={displayColor} size="dot" />
        <span className="flex-1 truncate text-left text-neutral-700">{value || 'Default'}</span>
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
        <div className="absolute top-full left-0 z-40 mt-1.5 w-40 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-xl">
          <div className="grid grid-cols-5 gap-1.5">
            {[['Default', defaultColor ?? ''], ...allColors].map(([name, color]) => {
              const selected = value === name || (name === 'Default' && value === '');
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setParam(name === 'Default' ? '' : name)}
                  className="flex items-center justify-center"
                >
                  <Swatch color={color} selected={selected} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Swatch({ color, selected, size = 'grid' }: { color?: string; selected?: boolean; size?: 'grid' | 'dot' }) {
  const noColor = !color;
  return (
    <span
      className={cn(
        'shrink-0 rounded-md border border-neutral-200 transition-transform',
        size === 'dot' ? 'size-3.5 rounded-full' : 'size-6',
        selected && 'ring-2 ring-neutral-900 ring-offset-1',
        noColor && 'bg-[repeating-conic-gradient(#d4d4d4_0%_25%,white_0%_50%)] bg-[length:8px_8px]',
      )}
      style={color ? { background: color } : undefined}
    />
  );
}
