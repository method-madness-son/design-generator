'use client';

import { useEffect, useState } from 'react';
import { stickerLayoutProblems, type StickerLayoutReport } from '@/lib/stickerLayout';
import { STICKER_TYPES, type StickerType } from '@/lib/stickerSizes';

type Props = {
  canvasId: string;
  type: StickerType;
  // Changes whenever the design does, so the check re-runs.
  signature: string;
  // Print route: no visible list, just the result for `npm run sticker-art` to read.
  hidden?: boolean;
};

export function StickerFitReport({ canvasId, type, signature, hidden = false }: Props) {
  const [report, setReport] = useState<StickerLayoutReport & { signature: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      const canvas = document.getElementById(canvasId);
      if (!cancelled && canvas) setReport({ ...stickerLayoutProblems(canvas, type), signature });
    });
    return () => {
      cancelled = true;
    };
  }, [canvasId, type, signature]);

  if (hidden) return report ? <div hidden data-sticker-report={JSON.stringify(report)} /> : null;
  if (!report) return null;
  if (report.errors.length === 0 && report.warnings.length === 0) return <p className="text-xs text-emerald-700">Fits the safe area at {STICKER_TYPES[type].sizes}.</p>;
  return (
    <ul className="space-y-0.5 text-xs">
      {report.errors.map((error) => (
        <li key={error} className="text-red-600">{error}</li>
      ))}
      {report.warnings.map((warning) => (
        <li key={warning} className="text-amber-700">{warning}</li>
      ))}
    </ul>
  );
}
