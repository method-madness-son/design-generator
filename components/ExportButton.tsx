'use client';

import { useState } from 'react';
import { downloadAllPalettes, downloadCanvasAs300DPI } from '@/lib/exportUtils';

type Props = {
  elementId: string;
  // Base name without the palette, e.g. "neuro-zones-quiet-zone".
  filename: string;
  paletteName?: string;
  palettes: Record<string, Record<string, string>>;
  printWidthInches: number;
};

const buttonClasses = 'rounded-md px-4 py-2 disabled:opacity-50';

export function ExportButton({ elementId, filename, paletteName, palettes, printWidthInches }: Props) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
  const paletteCount = Object.keys(palettes).length;

  async function run(task: () => Promise<void>) {
    setStatus('exporting');
    try {
      await task();
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() =>
          run(() =>
            downloadCanvasAs300DPI(elementId, [filename, paletteName].filter(Boolean).join('-'), printWidthInches),
          )
        }
        disabled={status === 'exporting'}
        className={`${buttonClasses} bg-black text-white hover:bg-neutral-800`}
      >
        {status === 'exporting' ? 'Exporting…' : 'Download 300 DPI PNG'}
      </button>
      {paletteCount > 1 && (
        <button
          type="button"
          onClick={() => run(() => downloadAllPalettes(elementId, filename, printWidthInches, palettes))}
          disabled={status === 'exporting'}
          className={`${buttonClasses} border border-neutral-200 bg-white hover:border-neutral-400`}
        >
          Download all {paletteCount} color sets
        </button>
      )}
      {status === 'error' && <p className="text-sm text-red-600">Export failed. See the console for details.</p>}
    </div>
  );
}
