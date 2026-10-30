'use client';

import { compareColors } from '@/lib/colorSort';
import { useQueryParam } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  param: string;
  palettes: Record<string, Record<string, string>>;
  // Currently selected palette name; empty means the poster's own default.
  value: string;
  // The project's own default accent, shown on the "Default" swatch.
  defaultAccent: string;
};

export function PaletteSwatchPicker({ label, param, palettes, value, defaultAccent }: Props) {
  const setParam = useQueryParam(param);
  const sortedPalettes = Object.entries(palettes).sort(([, a], [, b]) =>
    compareColors(a.accent ?? Object.values(a)[0], b.accent ?? Object.values(b)[0]),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        <Swatch name="Default" color={defaultAccent} selected={value === ''} onClick={() => setParam('')} />
        {sortedPalettes.map(([name, colors]) => (
          <Swatch
            key={name}
            name={name}
            color={colors.accent ?? Object.values(colors)[0]}
            selected={value === name}
            onClick={() => setParam(name)}
          />
        ))}
      </div>
    </div>
  );
}

function Swatch({
  name,
  color,
  selected,
  onClick,
}: {
  name: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={name}
      className={cn(
        'flex flex-col items-center gap-1 rounded-md p-1.5 transition-colors',
        selected ? 'bg-neutral-100' : 'hover:bg-neutral-50',
      )}
    >
      <span
        className={cn(
          'size-7 rounded-full border-2 shadow-sm',
          selected ? 'border-neutral-800' : 'border-white ring-1 ring-neutral-200',
        )}
        style={{ background: color }}
      />
      <span className="max-w-16 truncate text-[11px] capitalize text-neutral-500">{name}</span>
    </button>
  );
}
