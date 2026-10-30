import type { CSSProperties } from 'react';

export type FractalType = 'lorenz' | 'tree' | 'spiral';

// One or more <path> "d" strings per type; kept flat (no external math/graphics deps).
const PATHS: Record<FractalType, string[]> = {
  tree: [
    'M50 100 L50 70 M50 70 L35 45 M50 70 L65 45 M35 45 L25 30 M35 45 L42 30 M65 45 L58 30 M65 45 L75 30',
    'M25 30 L20 22 M25 30 L30 22 M42 30 L38 22 M42 30 L46 22 M58 30 L54 22 M58 30 L62 22 M75 30 L70 22 M75 30 L80 22',
  ],
  spiral: [
    'M50 50 m0 0 a1 1 0 0 1 2 0 a3 3 0 0 1 -4 0 a5 5 0 0 1 6 0 a7 7 0 0 1 -8 0 a10 10 0 0 1 12 0 a15 15 0 0 1 -18 0 a22 22 0 0 1 26 0 a30 30 0 0 1 -36 0',
  ],
  // Stylized Lorenz attractor "butterfly" curve.
  lorenz: [
    'M50 50 C30 20, 10 40, 30 70 C50 90, 70 70, 50 50 C30 30, 10 60, 30 80 C50 100, 90 80, 70 50 C50 20, 70 10, 90 30 C110 50, 90 80, 70 50 Z',
  ],
};

export function Fractal({
  type = 'lorenz',
  className,
  sizeRem,
  style,
}: {
  type?: FractalType;
  className?: string;
  sizeRem: number;
  // Merged in after the size, so e.g. an explicit color here wins over the className's.
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ width: `${sizeRem}rem`, height: `${sizeRem}rem`, ...style } as CSSProperties}
      stroke="currentColor"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[type].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
