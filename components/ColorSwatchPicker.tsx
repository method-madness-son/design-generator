'use client';

import { dedupeSimilarColors, sortColorEntries, sortColorEntriesByLightness } from '@/lib/colorSort';
import { useQueryParams } from '@/lib/useQueryParam';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  param: string | string[];
  swatches: Record<string, string>;
  value: string;
  defaultValue: string;
  /** 'name' stores the swatch name in the URL param; 'hex' stores the hex value. */
  valueMode?: 'name' | 'hex';
  sortBy?: 'hue' | 'lightness';
};

export function ColorSwatchPicker({
  label,
  param,
  swatches,
  value,
  defaultValue,
  valueMode = 'name',
  sortBy = 'hue',
}: Props) {
  const params = Array.isArray(param) ? param : [param];
  const setParam = useQueryParams(params);

  const deduped = Object.fromEntries(dedupeSimilarColors(Object.entries(swatches)));
  const sorted = sortBy === 'lightness' ? sortColorEntriesByLightness(deduped) : sortColorEntries(deduped);

  const isDefault =
    valueMode === 'hex'
      ? value.toLowerCase() === defaultValue.toLowerCase()
      : value === '';

  const displayHex =
    valueMode === 'hex'
      ? value
      : sorted.find(([name]) => name === value)?.[1] ?? defaultValue;

  function select(name: string, hex: string) {
    if (valueMode === 'hex') {
      setParam(hex.toLowerCase() === defaultValue.toLowerCase() ? '' : hex);
    } else {
      setParam(name);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {label}
          </span>
          {!isDefault && (
            <button
              type="button"
              onClick={() => setParam('')}
              className="text-xs text-neutral-400 hover:text-neutral-700"
            >
              Reset
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          title={`Default (${defaultValue})`}
          onClick={() => setParam('')}
          className="flex flex-col items-center"
        >
          <span
            className={cn(
              'size-7 rounded-full border-2 shadow-sm',
              isDefault
                ? 'border-neutral-800 ring-1 ring-neutral-400'
                : 'border-white ring-1 ring-neutral-200',
            )}
            style={{ background: defaultValue }}
          />
        </button>
        {sorted.map(([name, hex]) => {
          const selected =
            !isDefault &&
            (valueMode === 'hex'
              ? value.toLowerCase() === hex.toLowerCase()
              : value === name);
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => select(name, hex)}
              className="flex flex-col items-center"
            >
              <span
                className={cn(
                  'size-7 rounded-full border-2 shadow-sm',
                  selected
                    ? 'border-neutral-800 ring-1 ring-neutral-400'
                    : 'border-white ring-1 ring-neutral-200',
                )}
                style={{ background: hex }}
              />
            </button>
          );
        })}
      </div>
      <span className="font-mono text-[11px] text-neutral-400">{displayHex}</span>
    </div>
  );
}
