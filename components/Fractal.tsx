import type { CSSProperties } from 'react';

export type FractalType = 'lorenz' | 'tree' | 'spiral' | 'road-arrow' | 'pen-arrow';

// A path is drawn in the graphic's color (currentColor) unless it names the palette accent.
// Strokes are the default; `fill` paths are solid shapes such as arrowheads.
type GraphicPath = { d: string; fill?: boolean; accent?: boolean; width?: number };
type Graphic = { viewBox: [number, number]; strokeWidth: number; paths: GraphicPath[]; linecap?: 'round' | 'butt' };

const GRAPHICS: Record<FractalType, Graphic> = {
  tree: {
    viewBox: [100, 100],
    strokeWidth: 1.5,
    paths: [
      { d: 'M50 100 L50 70 M50 70 L35 45 M50 70 L65 45 M35 45 L25 30 M35 45 L42 30 M65 45 L58 30 M65 45 L75 30' },
      { d: 'M25 30 L20 22 M25 30 L30 22 M42 30 L38 22 M42 30 L46 22 M58 30 L54 22 M58 30 L62 22 M75 30 L70 22 M75 30 L80 22' },
    ],
  },
  spiral: {
    viewBox: [100, 100],
    strokeWidth: 1.5,
    paths: [
      { d: 'M50 50 m0 0 a1 1 0 0 1 2 0 a3 3 0 0 1 -4 0 a5 5 0 0 1 6 0 a7 7 0 0 1 -8 0 a10 10 0 0 1 12 0 a15 15 0 0 1 -18 0 a22 22 0 0 1 26 0 a30 30 0 0 1 -36 0' },
    ],
  },
  // Stylized Lorenz attractor "butterfly" curve.
  lorenz: {
    viewBox: [100, 100],
    strokeWidth: 1.5,
    paths: [
      { d: 'M50 50 C30 20, 10 40, 30 70 C50 90, 70 70, 50 50 C30 30, 10 60, 30 80 C50 100, 90 80, 70 50 C50 20, 70 10, 90 30 C110 50, 90 80, 70 50 Z' },
    ],
  },
  // Two lanes sweeping up into an arrowhead, with an accent-colored start on the outer lane.
  // Matches the rally tee's stencil pace note (components/tees/PaceNotes.tsx).
  'road-arrow': {
    viewBox: [320, 130],
    strokeWidth: 22,
    linecap: 'butt',
    paths: [
      { d: 'M28 124 C 62 74, 140 44, 238 36' },
      { d: 'M104 124 C 128 92, 176 70, 238 60', width: 16 },
      { d: 'M28 124 C 36 112, 44 103, 54 94', accent: true },
      { d: 'M228 12 L304 46 L232 84 Z', fill: true },
    ],
  },
  // A quick pen-drawn arrow, for handwritten notes.
  'pen-arrow': {
    viewBox: [120, 40],
    strokeWidth: 3,
    paths: [{ d: 'M6 28 C 30 34, 70 32, 108 22' }, { d: 'M92 12 L109 22 L94 34' }],
  },
};

export function Fractal({
  type = 'lorenz',
  className,
  sizeRem,
  style,
}: {
  type?: FractalType;
  className?: string;
  // Width in rem; height follows the graphic's own aspect ratio.
  sizeRem: number;
  // Merged in after the size, so e.g. an explicit color here wins over the className's.
  style?: CSSProperties;
}) {
  const { viewBox, strokeWidth, paths, linecap = 'round' } = GRAPHICS[type];
  const [width, height] = viewBox;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: `${sizeRem}rem`, height: `${(sizeRem * height) / width}rem`, ...style } as CSSProperties}
      stroke="currentColor"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap={linecap}
      strokeLinejoin="round"
      aria-hidden
    >
      {paths.map(({ d, fill, accent, width: pathWidth }) => (
        <path
          key={d}
          d={d}
          strokeWidth={pathWidth}
          style={{
            ...(fill ? { fill: 'currentColor', stroke: 'none' } : undefined),
            ...(accent ? { stroke: 'var(--poster-accent)' } : undefined),
          }}
        />
      ))}
    </svg>
  );
}
