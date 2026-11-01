import type { CSSProperties } from 'react';

export type FractalType = 'lorenz' | 'tree' | 'spiral' | 'road-arrow' | 'pen-arrow' | 'loop-arrow' | 'surfaces';

// A path is drawn in the graphic's color (currentColor) unless it names the palette accent.
// Strokes are the default; `fill` paths are solid shapes such as arrowheads. `paper` strokes are
// drawn in the poster background to cut gaps, and `knockout` shapes are filled with a paper
// outline so overlapping shapes stay separate.
type GraphicPath = { d: string; fill?: boolean; accent?: boolean; paper?: boolean; knockout?: boolean; width?: number };
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
  // Gravel, snow, and tarmac icons centred in thirds, for a row of labels underneath.
  surfaces: {
    viewBox: [300, 90],
    strokeWidth: 5,
    paths: [
      { d: 'M5 74 a15 12 0 1 0 30 0 a15 12 0 1 0 -30 0 Z', knockout: true },
      { d: 'M30 77 a15 11 0 1 0 30 0 a15 11 0 1 0 -30 0 Z', knockout: true },
      { d: 'M55 73 a14 12 0 1 0 28 0 a14 12 0 1 0 -28 0 Z', knockout: true },
      { d: 'M78 78 a10 8 0 1 0 20 0 a10 8 0 1 0 -20 0 Z', knockout: true },
      { d: 'M16 54 a14 11 0 1 0 28 0 a14 11 0 1 0 -28 0 Z', knockout: true },
      { d: 'M40 53 a15 13 0 1 0 30 0 a15 13 0 1 0 -30 0 Z', knockout: true },
      { d: 'M67 58 a11 10 0 1 0 22 0 a11 10 0 1 0 -22 0 Z', knockout: true },
      { d: 'M28 34 a12 10 0 1 0 24 0 a12 10 0 1 0 -24 0 Z', knockout: true },
      { d: 'M51 35 a11 10 0 1 0 22 0 a11 10 0 1 0 -22 0 Z', knockout: true },
      { d: 'M39 16 a11 9 0 1 0 22 0 a11 9 0 1 0 -22 0 Z', knockout: true },
      { d: 'M150.0 45.0 L150.0 7.0 M150.0 45.0 L117.1 26.0 M150.0 45.0 L117.1 64.0 M150.0 45.0 L150.0 83.0 M150.0 45.0 L182.9 64.0 M150.0 45.0 L182.9 26.0 M150.0 21.0 L157.1 13.9 M150.0 21.0 L142.9 13.9 M150.0 33.0 L154.9 28.1 M150.0 33.0 L145.1 28.1 M129.2 33.0 L126.6 23.3 M129.2 33.0 L119.6 35.6 M139.6 39.0 L137.8 32.2 M139.6 39.0 L132.8 40.8 M129.2 57.0 L119.6 54.4 M129.2 57.0 L126.6 66.7 M139.6 51.0 L132.8 49.2 M139.6 51.0 L137.8 57.8 M150.0 69.0 L142.9 76.1 M150.0 69.0 L157.1 76.1 M150.0 57.0 L145.1 61.9 M150.0 57.0 L154.9 61.9 M170.8 57.0 L173.4 66.7 M170.8 57.0 L180.4 54.4 M160.4 51.0 L162.2 57.8 M160.4 51.0 L167.2 49.2 M170.8 33.0 L180.4 35.6 M170.8 33.0 L173.4 23.3 M160.4 39.0 L167.2 40.8 M160.4 39.0 L162.2 32.2' },
      { d: 'M208 15 L292 15 L288 23 L294 31 L288 39 L294 47 L288 55 L294 63 L288 71 L292 80 L208 80 L212 71 L206 63 L212 55 L206 47 L212 39 L206 31 L212 23 Z', fill: true },
      { d: 'M229 15 V80 M250 15 V80 M271 15 V80 M206 33 H294 M206 62 H294', paper: true, width: 3 },
    ],
  },
  // A loop-the-loop arrow, drawn in the accent color.
  'loop-arrow': {
    viewBox: [160, 110],
    strokeWidth: 9,
    paths: [
      { d: 'M12 62 C 12 26, 62 18, 72 48 C 80 74, 50 88, 38 68 C 26 48, 72 40, 102 62 L 140 90', accent: true },
      { d: 'M114 94 L141 91 L135 64', accent: true },
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
      {paths.map(({ d, fill, accent, paper, knockout, width: pathWidth }) => (
        <path
          key={d}
          d={d}
          strokeWidth={pathWidth}
          style={{
            ...(fill ? { fill: 'currentColor', stroke: 'none' } : undefined),
            ...(accent ? { stroke: 'var(--poster-accent)' } : undefined),
            ...(paper ? { stroke: 'var(--poster-background)' } : undefined),
            ...(knockout ? { fill: 'currentColor', stroke: 'var(--poster-background)', strokeWidth: 2.5 } : undefined),
          }}
        />
      ))}
    </svg>
  );
}
