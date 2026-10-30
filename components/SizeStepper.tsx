'use client';

import type { ReactNode } from 'react';
import { useQueryParam } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  param: string;
  // The project's offered sizes, ascending.
  options: number[];
  // Currently selected size; empty means the poster's own default.
  value: string;
  // The size actually rendered when nothing is selected (the poster's resolved rem value), so
  // "Default" sits at its real position in the sequence instead of always being the floor —
  // otherwise the first +/- press from Default would jump straight to the smallest/largest
  // option instead of stepping from what's actually on screen.
  defaultValue: number;
};

export function SizeStepper({ label, param, options, value, defaultValue }: Props) {
  const setParam = useQueryParam(param);
  // Options at or below the default come first, then "Default" itself, then options above it —
  // so stepping up from Default always increases past what's currently shown, and stepping down
  // always lands at-or-below it.
  const below = options.filter((o) => o <= defaultValue).map(String);
  const above = options.filter((o) => o > defaultValue).map(String);
  const sequence = [...below, '', ...above];
  const index = Math.max(sequence.indexOf(value), 0);
  const atMin = index === 0;
  const atMax = index === sequence.length - 1;

  function step(delta: number) {
    const next = Math.min(Math.max(index + delta, 0), sequence.length - 1);
    setParam(sequence[next]);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>}
      <div className="flex h-7 items-center gap-0.5 rounded-md border border-neutral-300 bg-white px-0.5 shadow-sm">
        <StepButton label="Decrease" onClick={() => step(-1)} disabled={atMin}>
          <path d="M5 12h14" />
        </StepButton>
        <span className="w-12 select-none text-center text-xs text-neutral-700">
          {value ? `${value}rem` : 'Default'}
        </span>
        <StepButton label="Increase" onClick={() => step(1)} disabled={atMax}>
          <path d="M12 5v14M5 12h14" />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded transition-colors',
        disabled ? 'text-neutral-300' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}
