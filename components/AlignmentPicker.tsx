'use client';

import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useQueryParam } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Align = 'left' | 'center' | 'right';

type Props = {
  label?: string;
  param: string;
  // Currently selected alignment; empty means the poster's own default.
  value: string;
};

export function AlignmentPicker({ label, param, value }: Props) {
  const setParam = useQueryParam(param);

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>}
      <div className="flex h-7 items-center gap-0.5 rounded-md border border-neutral-300 bg-white px-0.5 shadow-sm">
        <AlignButton
          label="Align left"
          active={value === 'left'}
          onClick={() => setParam(value === 'left' ? '' : 'left')}
        >
          <AlignLeft className="size-3.5" strokeWidth={2} />
        </AlignButton>
        <AlignButton
          label="Align center"
          active={value === 'center'}
          onClick={() => setParam(value === 'center' ? '' : 'center')}
        >
          <AlignCenter className="size-3.5" strokeWidth={2} />
        </AlignButton>
        <AlignButton
          label="Align right"
          active={value === 'right'}
          onClick={() => setParam(value === 'right' ? '' : 'right')}
        >
          <AlignRight className="size-3.5" strokeWidth={2} />
        </AlignButton>
      </div>
    </div>
  );
}

function AlignButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded transition-colors',
        active ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      {children}
    </button>
  );
}

export type { Align };
