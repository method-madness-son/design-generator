'use client';

import { useSearchParams } from 'next/navigation';
import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { WRAP_DEFAULTS } from '@/components/wrapping/WrapIconGrid';
import { useQueryParam, useQueryParams } from '@/lib/useQueryParam';
import type { ResolvedWrapParams } from '@/lib/wrapParams';

type Props = {
  defaults: { background: string; foreground: string };
  resolved: ResolvedWrapParams;
  bgSwatches: Record<string, string>;
  fgSwatches: Record<string, string>;
};

function NumberSlider({
  label,
  param,
  value,
  defaultValue,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  param: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const setParam = useQueryParam(param);
  const isDefault = value === defaultValue;
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-neutral-600">
            {value.toFixed(step < 0.1 ? 2 : 1)}{unit}
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
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          setParam(n === defaultValue ? '' : String(n));
        }}
        className="h-1.5 w-full cursor-pointer accent-neutral-800"
      />
    </label>
  );
}

const WRAP_PARAMS = ['bg', 'fg', 'cell', 'icon', 'glow', 'opacity', 'stroke'];

export function WrapControls({ defaults, resolved, bgSwatches, fgSwatches }: Props) {
  const searchParams = useSearchParams();
  const resetAll = useQueryParams(WRAP_PARAMS);
  const hasOverrides = Array.from(searchParams.keys()).some((k) => WRAP_PARAMS.includes(k));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Customize</h3>
        {hasOverrides && (
          <button
            type="button"
            onClick={() => resetAll('')}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            Reset all
          </button>
        )}
      </div>

      <ColorSwatchPicker
        label="Background"
        param="bg"
        swatches={bgSwatches}
        value={resolved.background}
        defaultValue={defaults.background}
        valueMode="hex"
      />
      <ColorSwatchPicker
        label="Icon color"
        param="fg"
        swatches={fgSwatches}
        value={resolved.foreground}
        defaultValue={defaults.foreground}
        valueMode="hex"
      />

      <NumberSlider
        label="Cell spacing"
        param="cell"
        value={resolved.cellSizeIn}
        defaultValue={WRAP_DEFAULTS.cellSizeIn}
        min={1}
        max={8}
        step={0.25}
        unit="″"
      />
      <NumberSlider
        label="Icon size"
        param="icon"
        value={resolved.iconSizeIn}
        defaultValue={WRAP_DEFAULTS.iconSizeIn}
        min={0.4}
        max={6}
        step={0.1}
        unit="″"
      />
      <NumberSlider
        label="Glow radius"
        param="glow"
        value={resolved.glowIn}
        defaultValue={WRAP_DEFAULTS.glowIn}
        min={0}
        max={0.3}
        step={0.01}
        unit="″"
      />
      <NumberSlider
        label="Icon opacity"
        param="opacity"
        value={resolved.opacity}
        defaultValue={WRAP_DEFAULTS.opacity}
        min={0.1}
        max={1}
        step={0.05}
        unit=""
      />
      <NumberSlider
        label="Stroke width"
        param="stroke"
        value={resolved.strokeWidth}
        defaultValue={WRAP_DEFAULTS.strokeWidth}
        min={0.5}
        max={4}
        step={0.25}
        unit=""
      />
    </div>
  );
}
