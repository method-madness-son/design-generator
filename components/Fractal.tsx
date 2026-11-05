import type { CSSProperties } from 'react';

export type FractalType =
  | 'lorenz'
  | 'tree'
  | 'spiral'
  | 'road-arrow'
  | 'pen-arrow'
  | 'loop-arrow'
  | 'surfaces'
  | 'progress-bar'
  | 'spoon-count'
  | 'spoon-battery'
  | 'spoon-badge'
  | 'side-quest-fork'
  | 'squiggles'
  | 'crossed-sticks'
  | 'goal-holes'
  | 'three-hats'
  | 'headstone'
  | 'three-cautions'
  | 'tulip'
  | 'left-right-oops'
  | 'crest-jump-landing'
  | 'hairpin-square-flat'
  | 'recce-rally-repair'
  | 'card-fan'
  | 'd20-life'
  | 'tap-card'
  | 'mana-shield'
  | 'mana-wheel'
  | 'lightning-bolt';

// A path is drawn in the graphic's color (currentColor) unless it names the palette accent.
// Strokes are the default; `fill` paths are solid shapes such as arrowheads. `paper` strokes are
// drawn in the poster background to cut gaps, and `knockout` shapes are filled with a paper
// outline so overlapping shapes stay separate. `sign` and `tint` shapes are outlined and filled
// with the background or the accent. With `accent`, a `fill` shape is filled in the accent.
type GraphicPath = {
  d: string;
  fill?: boolean;
  accent?: boolean;
  paper?: boolean;
  knockout?: boolean;
  sign?: boolean;
  tint?: boolean;
  dash?: string;
  width?: number;
};
// Text is set at x/y, or along the path `d` (centred on it). Its font is --graphic-font, so a
// graphic's className can pick one, e.g. [--graphic-font:var(--font-theme-oswald)].
type GraphicText = { text: string; size: number; x?: number; y?: number; d?: string };
type Graphic = {
  viewBox: [number, number];
  strokeWidth: number;
  paths: GraphicPath[];
  texts?: GraphicText[];
  linecap?: 'round' | 'butt' | 'square';
};

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
  // A pixel progress bar at 8/9, with the last block in the accent color.
  'progress-bar': {
    viewBox: [300, 50],
    strokeWidth: 4,
    linecap: 'square',
    paths: [
      { d: 'M4 4 H296 V46 H4 Z', width: 5 },
      { d: 'M12 11 H38.2 V39 H12 Z', fill: true },
      { d: 'M43.2 11 H69.4 V39 H43.2 Z', fill: true },
      { d: 'M74.4 11 H100.7 V39 H74.4 Z', fill: true },
      { d: 'M105.7 11 H131.9 V39 H105.7 Z', fill: true },
      { d: 'M136.9 11 H163.1 V39 H136.9 Z', fill: true },
      { d: 'M168.1 11 H194.3 V39 H168.1 Z', fill: true },
      { d: 'M199.3 11 H225.6 V39 H199.3 Z', fill: true },
      { d: 'M230.6 11 H256.8 V39 H230.6 Z', fill: true },
      { d: 'M261.8 11 H288 V39 H261.8 Z', accent: true, fill: true },
    ],
  },
  // Eight spoons: seven used up (crossed out), the last one left in the accent color.
  'spoon-count': {
    viewBox: [320, 92],
    strokeWidth: 3,
    linecap: 'square',
    paths: [
      { d: 'M16.5 33 V72 H23.5 V33 Z', sign: true },
      { d: 'M14 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M9 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M15 14 L25 24 M25 14 L15 24' },
      { d: 'M56.5 33 V72 H63.5 V33 Z', sign: true },
      { d: 'M54 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M49 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M55 14 L65 24 M65 14 L55 24' },
      { d: 'M96.5 33 V72 H103.5 V33 Z', sign: true },
      { d: 'M94 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M89 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M95 14 L105 24 M105 14 L95 24' },
      { d: 'M136.5 33 V72 H143.5 V33 Z', sign: true },
      { d: 'M134 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M129 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M135 14 L145 24 M145 14 L135 24' },
      { d: 'M176.5 33 V72 H183.5 V33 Z', sign: true },
      { d: 'M174 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M169 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M175 14 L185 24 M185 14 L175 24' },
      { d: 'M216.5 33 V72 H223.5 V33 Z', sign: true },
      { d: 'M214 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M209 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M215 14 L225 24 M225 14 L215 24' },
      { d: 'M256.5 33 V72 H263.5 V33 Z', sign: true },
      { d: 'M254 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', sign: true },
      { d: 'M249 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', sign: true },
      { d: 'M255 14 L265 24 M265 14 L255 24' },
      { d: 'M296.5 33 V72 H303.5 V33 Z', tint: true },
      { d: 'M294 79 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0 Z', tint: true },
      { d: 'M289 19 a11 15 0 1 0 22 0 a11 15 0 1 0 -22 0 Z', tint: true },
    ],
  },
  // Five spoons as a battery: four empty, the last one in the accent color.
  'spoon-battery': {
    viewBox: [250, 100],
    strokeWidth: 3.5,
    linecap: 'square',
    paths: [
      { d: 'M21 37.3 V82.2 H29 V37.3 Z', sign: true },
      { d: 'M18.1 90.2 a6.9 8 0 1 0 13.8 0 a6.9 8 0 1 0 -13.8 0 Z', sign: true },
      { d: 'M12.4 21.2 a12.6 17.2 0 1 0 25.3 0 a12.6 17.2 0 1 0 -25.3 0 Z', sign: true },
      { d: 'M71 37.3 V82.2 H79 V37.3 Z', sign: true },
      { d: 'M68.1 90.2 a6.9 8 0 1 0 13.8 0 a6.9 8 0 1 0 -13.8 0 Z', sign: true },
      { d: 'M62.4 21.2 a12.6 17.2 0 1 0 25.3 0 a12.6 17.2 0 1 0 -25.3 0 Z', sign: true },
      { d: 'M121 37.3 V82.2 H129 V37.3 Z', sign: true },
      { d: 'M118.1 90.2 a6.9 8 0 1 0 13.8 0 a6.9 8 0 1 0 -13.8 0 Z', sign: true },
      { d: 'M112.3 21.2 a12.6 17.2 0 1 0 25.3 0 a12.6 17.2 0 1 0 -25.3 0 Z', sign: true },
      { d: 'M171 37.3 V82.2 H179 V37.3 Z', sign: true },
      { d: 'M168.1 90.2 a6.9 8 0 1 0 13.8 0 a6.9 8 0 1 0 -13.8 0 Z', sign: true },
      { d: 'M162.3 21.2 a12.6 17.2 0 1 0 25.3 0 a12.6 17.2 0 1 0 -25.3 0 Z', sign: true },
      { d: 'M221 37.3 V82.2 H229 V37.3 Z', tint: true },
      { d: 'M218.1 90.2 a6.9 8 0 1 0 13.8 0 a6.9 8 0 1 0 -13.8 0 Z', tint: true },
      { d: 'M212.3 21.2 a12.6 17.2 0 1 0 25.3 0 a12.6 17.2 0 1 0 -25.3 0 Z', tint: true },
    ],
  },
  // A round badge: curved text over and under a spoon, with accent stars and dashes.
  'spoon-badge': {
    viewBox: [300, 300],
    strokeWidth: 3,
    linecap: 'round',
    paths: [
      { d: 'M10 150 a140 140 0 1 0 280 0 a140 140 0 1 0 -280 0 Z', width: 6 },
      { d: 'M21 150 a129 129 0 1 0 258 0 a129 129 0 1 0 -258 0 Z', width: 2.5 },
      { d: 'M127 108 a23 33 0 1 0 46 0 a23 33 0 1 0 -46 0 Z', fill: true },
      { d: 'M144 136 L156 136 L154 204 Q161 214 155 224 L145 224 Q139 214 146 204 Z', fill: true },
      { d: 'M48 114 L50.1 119.1 L55.6 119.5 L51.4 123.1 L52.7 128.5 L48 125.6 L43.3 128.5 L44.6 123.1 L40.4 119.5 L45.9 119.1 Z', accent: true, fill: true },
      { d: 'M44 162 L46.1 167.1 L51.6 167.5 L47.4 171.1 L48.7 176.5 L44 173.6 L39.3 176.5 L40.6 171.1 L36.4 167.5 L41.9 167.1 Z', accent: true, fill: true },
      { d: 'M58 200 L59.6 203.8 L63.7 204.1 L60.6 206.8 L61.5 210.9 L58 208.7 L54.5 210.9 L55.4 206.8 L52.3 204.1 L56.4 203.8 Z', accent: true, fill: true },
      { d: 'M54 136 L52 158', accent: true, width: 2.5 },
      { d: 'M64 138 L61 160', accent: true, width: 2.5 },
      { d: 'M52 182 L55 198', accent: true, width: 2.5 },
      { d: 'M62 180 L66 196', accent: true, width: 2.5 },
      { d: 'M252 114 L254.1 119.1 L259.6 119.5 L255.4 123.1 L256.7 128.5 L252 125.6 L247.3 128.5 L248.6 123.1 L244.4 119.5 L249.9 119.1 Z', accent: true, fill: true },
      { d: 'M256 162 L258.1 167.1 L263.6 167.5 L259.4 171.1 L260.7 176.5 L256 173.6 L251.3 176.5 L252.6 171.1 L248.4 167.5 L253.9 167.1 Z', accent: true, fill: true },
      { d: 'M242 200 L243.6 203.8 L247.7 204.1 L244.6 206.8 L245.5 210.9 L242 208.7 L238.5 210.9 L239.4 206.8 L236.3 204.1 L240.4 203.8 Z', accent: true, fill: true },
      { d: 'M246 136 L248 158', accent: true, width: 2.5 },
      { d: 'M236 138 L239 160', accent: true, width: 2.5 },
      { d: 'M248 182 L245 198', accent: true, width: 2.5 },
      { d: 'M238 180 L234 196', accent: true, width: 2.5 },
    ],
    texts: [
      { text: 'OUT OF SPOONS', d: 'M50 150 A100 100 0 0 1 250 150', size: 32 },
      { text: 'PLEASE TRY AGAIN TOMORROW', d: 'M27 150 A123 123 0 0 0 273 150', size: 23 },
    ],
  },
  // A fork in the road with a main quest / side quest signpost and an accent sparkle.
  'side-quest-fork': {
    viewBox: [300, 220],
    strokeWidth: 3,
    linecap: 'round',
    paths: [
      { d: 'M18 104 C 68 108, 112 126, 150 150 C 188 126, 232 108, 282 104', width: 4 },
      { d: 'M62 212 C 96 182, 102 158, 76 134', width: 4 },
      { d: 'M238 212 C 204 182, 198 158, 224 134', width: 4 },
      { d: 'M74 210 C 104 182, 112 160, 92 138', dash: '2 6', width: 3 },
      { d: 'M226 210 C 196 182, 188 160, 208 138', dash: '2 6', width: 3 },
      { d: 'M38 112 C 80 120, 118 140, 150 162 C 182 140, 220 120, 262 112', dash: '2 6', width: 3 },
      { d: 'M215 24 V112', width: 6 },
      { d: 'M168 26 H244 L256 38 L244 50 H168 Z', sign: true },
      { d: 'M262 58 H186 L174 70 L186 82 H262 Z', sign: true },
      { d: 'M276 0 L280 12 L292 16 L280 20 L276 32 L272 20 L260 16 L272 12 Z', accent: true, fill: true },
    ],
    texts: [
      { text: 'main quest', x: 206, y: 42, size: 11.5 },
      { text: 'side quest', x: 222, y: 74, size: 11.5 },
    ],
  },
  // Squiggles on both sides of a centred title (one in the accent color); leave the middle clear.
  'squiggles': {
    viewBox: [640, 300],
    strokeWidth: 3.5,
    linecap: 'round',
    paths: [
      { d: 'M70 22 Q62.1 29.6 73.1 30.5 Q84 31.3 76.2 38.9 Q68.3 46.6 79.2 47.4 Q90.2 48.2 82.3 55.8 Q74.5 63.5 85.4 64.3 Q96.3 65.1 88.5 72.7' },
      { d: 'M28 92 Q34.2 101.1 36.9 90.4 Q39.6 79.8 45.7 88.9 Q51.9 97.9 54.6 87.3 Q57.3 76.7 63.5 85.7 Q69.6 94.8 72.3 84.2 Q75 73.6 81.2 82.6' },
      { d: 'M14 150 Q18.5 160 23 150 Q27.5 140 32 150 Q36.5 160 41 150 Q45.5 140 50 150 Q54.5 160 59 150 Q63.5 140 68 150' },
      { d: 'M28 206 Q30.7 216.6 36.9 207.6 Q43 198.5 45.7 209.1 Q48.4 219.8 54.6 210.7 Q60.8 201.6 63.5 212.3 Q66.1 222.9 72.3 213.8 Q78.5 204.7 81.2 215.4' },
      { d: 'M70 248 Q80.9 247.2 73.1 239.5 Q65.2 231.9 76.2 231.1 Q87.1 230.3 79.2 222.6 Q71.4 215 82.3 214.2 Q93.2 213.4 85.4 205.7 Q77.5 198.1 88.5 197.3' },
      { d: 'M570 22 Q559.1 22.8 566.9 30.5 Q574.8 38.1 563.8 38.9 Q552.9 39.7 560.8 47.4 Q568.6 55 557.7 55.8 Q546.8 56.6 554.6 64.3 Q562.5 71.9 551.5 72.7' },
      { d: 'M565 98 Q562.3 87.4 556.1 96.4 Q550 105.5 547.3 94.9 Q544.6 84.2 538.4 93.3 Q532.2 102.4 529.5 91.7 Q526.9 81.1 520.7 90.2 Q514.5 99.3 511.8 88.6' },
      { d: 'M572 150 Q576.5 160 581 150 Q585.5 140 590 150 Q594.5 160 599 150 Q603.5 140 608 150 Q612.5 160 617 150 Q621.5 140 626 150', accent: true },
      { d: 'M565 202 Q558.8 192.9 556.1 203.6 Q553.4 214.2 547.3 205.1 Q541.1 196.1 538.4 206.7 Q535.7 217.3 529.5 208.3 Q523.4 199.2 520.7 209.8 Q518 220.4 511.8 211.4' },
      { d: 'M570 248 Q577.9 240.4 566.9 239.5 Q556 238.7 563.8 231.1 Q571.7 223.4 560.8 222.6 Q549.8 221.8 557.7 214.2 Q565.5 206.5 554.6 205.7 Q543.7 204.9 551.5 197.3' },
    ],
  },
  // Two crossed hockey sticks with accent tape, over a puck.
  'crossed-sticks': {
    viewBox: [160, 172],
    strokeWidth: 9,
    linecap: 'butt',
    paths: [
      { d: 'M30 6 L114 132' },
      { d: 'M110 128 Q118 152 154 150', width: 12 },
      { d: 'M130 6 L46 132' },
      { d: 'M50 128 Q42 152 6 150', width: 12 },
      { d: 'M34 12 L44 27', accent: true, width: 11 },
      { d: 'M126 12 L116 27', accent: true, width: 11 },
      { d: 'M124 147 L140 150', accent: true, width: 13 },
      { d: 'M36 147 L20 150', accent: true, width: 13 },
      { d: 'M60 156 V164 A20 7 0 0 0 100 164 V156 Z', fill: true },
      { d: 'M60 156 a20 7 0 1 0 40 0 a20 7 0 1 0 -40 0 Z', knockout: true },
    ],
  },
  // A goalie in the net, with the shooter's five holes numbered.
  'goal-holes': {
    viewBox: [300, 210],
    strokeWidth: 9,
    paths: [
      { d: 'M60 20 V205 M100 20 V205 M200 20 V205 M240 20 V205 M20 60 H280 M20 100 H280 M20 140 H280', dash: '2 8', width: 2 },
      { d: 'M20 205 V20 H280 V205' },
      { d: 'M118 82 L92 100 M182 82 L212 100', width: 10 },
      { d: 'M132 50 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z', fill: true },
      { d: 'M118 72 H182 L192 125 H108 Z', fill: true },
      { d: 'M106 129 H132 L122 205 H86 Z', fill: true },
      { d: 'M168 129 H194 L214 205 H178 Z', fill: true },
      { d: 'M80 88 H102 V114 H80 Z', fill: true },
      { d: 'M198 100 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z', fill: true },
      { d: 'M35 54 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0 Z', sign: true, width: 3 },
      { d: 'M231 54 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0 Z', sign: true, width: 3 },
      { d: 'M35 160 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0 Z', sign: true, width: 3 },
      { d: 'M231 160 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0 Z', sign: true, width: 3 },
      { d: 'M130 172 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 Z', sign: true, accent: true, width: 5 },
    ],
    texts: [
      { text: '1', size: 24, x: 52, y: 62 },
      { text: '2', size: 24, x: 248, y: 62 },
      { text: '3', size: 24, x: 52, y: 168 },
      { text: '4', size: 24, x: 248, y: 168 },
      { text: '5', size: 28, x: 150, y: 182 },
    ],
  },
  // Three top hats: the trick, taken literally.
  'three-hats': {
    viewBox: [320, 100],
    strokeWidth: 8,
    linecap: 'butt',
    paths: [
      { d: 'M22 8 H78 V80 H22 Z', fill: true },
      { d: 'M2 80 H98 V94 H2 Z', fill: true },
      { d: 'M22 58 H78 V70 H22 Z', accent: true, fill: true },
      { d: 'M132 8 H188 V80 H132 Z', fill: true },
      { d: 'M112 80 H208 V94 H112 Z', fill: true },
      { d: 'M132 58 H188 V70 H132 Z', accent: true, fill: true },
      { d: 'M242 8 H298 V80 H242 Z', fill: true },
      { d: 'M222 80 H318 V94 H222 Z', fill: true },
      { d: 'M242 58 H298 V70 H242 Z', accent: true, fill: true },
    ],
  },
  // A small headstone on a line of grass.
  headstone: {
    viewBox: [140, 170],
    strokeWidth: 8,
    paths: [
      { d: 'M20 165 V70 a50 50 0 0 1 100 0 V165 Z', sign: true },
      { d: 'M2 165 H138' },
      { d: 'M28 163 L24 150 M36 163 L38 148 M104 163 L102 148 M112 163 L116 150', accent: true, width: 4 },
    ],
    texts: [{ text: 'RIP', size: 34, x: 70, y: 100 }],
  },
  // Three warning triangles in a row, the last in the accent color.
  'three-cautions': {
    viewBox: [320, 100],
    strokeWidth: 8,
    paths: [
      { d: 'M50 10 L95 90 H5 Z' },
      { d: 'M50 38 V62' },
      { d: 'M50 75 V76' },
      { d: 'M160 10 L205 90 H115 Z' },
      { d: 'M160 38 V62' },
      { d: 'M160 75 V76' },
      { d: 'M270 10 L315 90 H225 Z', accent: true },
      { d: 'M270 38 V62', accent: true },
      { d: 'M270 75 V76', accent: true },
    ],
  },
  // A roadbook tulip: start ball, the route in bold, and the other roads in thin lines.
  tulip: {
    viewBox: [200, 240],
    strokeWidth: 14,
    linecap: 'butt',
    paths: [
      { d: 'M100 95 V20 M100 95 H24', width: 5 },
      { d: 'M100 205 V95 H160' },
      { d: 'M158 68 L198 95 L158 122 Z', fill: true },
      { d: 'M84 205 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0 Z', accent: true, fill: true },
    ],
  },
  // Three pictograms in thirds, for a row of labels underneath, like 'surfaces'.
  'left-right-oops': {
    viewBox: [300, 90],
    strokeWidth: 12,
    linecap: 'butt',
    paths: [
      { d: 'M62 86 V40 Q62 25 47 25 H30' },
      { d: 'M138 86 V40 Q138 25 153 25 H170' },
      { d: 'M236 86 C 200 40, 292 40, 266 62 C 244 80, 222 34, 250 20 C 262 14, 272 16, 280 24' },
      { d: 'M32 7 L8 25 L32 43 Z', fill: true },
      { d: 'M168 7 L192 25 L168 43 Z', fill: true },
      { d: 'M272 34 L296 40 L288 12 Z', fill: true },
    ],
  },
  'crest-jump-landing': {
    viewBox: [300, 90],
    strokeWidth: 7,
    paths: [
      { d: 'M6 84 Q50 28 94 84' },
      { d: 'M108 84 L136 66' },
      { d: 'M172 84 H194' },
      { d: 'M208 84 H294' },
      { d: 'M27.2 47.0 L27.2 38.5 L37.6 36.5 L43.4 28.0 L58.5 28.0 L64.3 36.5 L72.8 39.4 L72.8 47.0 Z', fill: true },
      { d: 'M31.9 48 a5.7 5.7 0 1 0 11.4 0 a5.7 5.7 0 1 0 -11.4 0 Z', fill: true },
      { d: 'M56.7 48 a5.7 5.7 0 1 0 11.4 0 a5.7 5.7 0 1 0 -11.4 0 Z', fill: true },
      { d: 'M130.9 41.5 L128.8 33.2 L138.5 28.8 L142.0 19.2 L156.7 15.5 L164.3 22.4 L173.3 23.1 L175.1 30.5 Z', fill: true },
      { d: 'M135.5 39.9 a5.7 5.7 0 1 0 11.4 0 a5.7 5.7 0 1 0 -11.4 0 Z', fill: true },
      { d: 'M159.5 33.9 a5.7 5.7 0 1 0 11.4 0 a5.7 5.7 0 1 0 -11.4 0 Z', fill: true },
      { d: 'M231.2 56.7 L234.6 48.9 L245.0 51.4 L253.7 45.9 L267.5 52.1 L269.3 62.2 L275.9 68.3 L272.8 75.3 Z', fill: true },
      { d: 'M234.6 61.8 a5.7 5.7 0 1 0 11.4 0 a5.7 5.7 0 1 0 -11.4 0 Z', fill: true },
      { d: 'M257.2 71.9 a5.7 5.7 0 1 0 11.4 0 a5.7 5.7 0 1 0 -11.4 0 Z', fill: true },
      { d: 'M278 66 L290 58', width: 4 },
      { d: 'M282 76 L296 74', width: 4 },
      { d: 'M272 54 L278 44', width: 4 },
    ],
  },
  'hairpin-square-flat': {
    viewBox: [300, 90],
    strokeWidth: 13,
    linecap: 'butt',
    paths: [
      { d: 'M30 88 V36 a20 20 0 0 1 40 0 V64' },
      { d: 'M132 88 V26 H164' },
      { d: 'M250 88 V30' },
      { d: 'M56 62 L84 62 L70 88 Z', fill: true },
      { d: 'M162 7 L190 26 L162 45 Z', fill: true },
      { d: 'M231 32 L250 3 L269 32 Z', fill: true },
    ],
  },
  'recce-rally-repair': {
    viewBox: [300, 90],
    strokeWidth: 7,
    paths: [
      { d: 'M24 8 H76 V84 H24 Z', fill: true },
      { d: 'M34 26 H66 M34 40 H66 M34 54 H66 M34 68 H52', paper: true, width: 5 },
      { d: 'M117.4 70.3 L115.8 55.0 L134.1 49.7 L142.6 33.4 L169.7 30.6 L181.4 44.7 L197.2 48.2 L198.6 61.7 Z', fill: true },
      { d: 'M126.0 70 a10.2 10.2 0 1 0 20.4 0 a10.2 10.2 0 1 0 -20.4 0 Z', fill: true },
      { d: 'M170.0 65.4 a10.2 10.2 0 1 0 20.4 0 a10.2 10.2 0 1 0 -20.4 0 Z', fill: true },
      { d: 'M96 74 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z', fill: true },
      { d: 'M104 56 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z', fill: true },
      { d: 'M92 58 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z', fill: true },
      { d: 'M224 80 L262 36', width: 15 },
      { d: 'M252 26 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 Z', fill: true },
      { d: 'M272 26 L296 2', paper: true, width: 15 },
    ],
  },
  // A quick pen-drawn arrow, for handwritten notes.
  'pen-arrow': {
    viewBox: [120, 40],
    strokeWidth: 3,
    paths: [{ d: 'M6 28 C 30 34, 70 32, 108 22' }, { d: 'M92 12 L109 22 L94 34' }],
  },
  // Three playing cards fanned out.
  'card-fan': {
    viewBox: [280, 200],
    strokeWidth: 5,
    linecap: 'butt',
    paths: [
      { d: 'M42 32 L110 14 L128 160 L60 178 Z', sign: true },
      { d: 'M170 14 L238 32 L220 178 L152 160 Z', sign: true },
      { d: 'M100 8 L180 8 L180 190 L100 190 Z', sign: true },
      { d: 'M112 22 H168 V44 H112 Z', fill: true },
      { d: 'M126 80 H154 V108 H126 Z', accent: true, fill: true },
    ],
  },
  // A d20 die face showing the number 20.
  'd20-life': {
    viewBox: [160, 180],
    strokeWidth: 5,
    paths: [
      { d: 'M80 8 L150 165 L10 165 Z' },
      { d: 'M80 8 L46 100 L114 100 Z', width: 3 },
      { d: 'M46 100 L10 165', width: 3 },
      { d: 'M114 100 L150 165', width: 3 },
      { d: 'M46 100 L114 100', accent: true, width: 3 },
    ],
    texts: [{ text: '20', size: 44, x: 80, y: 152 }],
  },
  // A card rotated 90° (tapped) with a curved rotation arrow.
  'tap-card': {
    viewBox: [200, 160],
    strokeWidth: 5,
    linecap: 'butt',
    paths: [
      { d: 'M18 28 H182 V132 H18 Z', sign: true },
      { d: 'M30 40 H82 V58 H30 Z', fill: true },
      { d: 'M80 78 H120 V98 H80 Z', accent: true, fill: true },
      { d: 'M166 10 A54 54 0 0 1 194 52', accent: true, width: 4 },
      { d: 'M186 36 L196 56 L174 54', accent: true, fill: true },
    ],
  },
  // A pointed shield with inner border detail and a center gem.
  'mana-shield': {
    viewBox: [160, 200],
    strokeWidth: 5,
    paths: [
      { d: 'M80 8 L148 54 L128 176 L80 196 L32 176 L12 54 Z' },
      { d: 'M80 28 L132 64 L116 166 L80 182 L44 166 L28 64 Z', width: 2.5 },
      { d: 'M38 80 H122', accent: true, width: 2.5 },
      { d: 'M80 98 L96 118 L80 138 L64 118 Z', accent: true, fill: true },
      { d: 'M80 46 V72', width: 2 },
      { d: 'M80 156 V176', width: 2 },
      { d: 'M52 56 L62 66', width: 2 },
      { d: 'M108 56 L98 66', width: 2 },
    ],
  },
  // Five circles at pentagon vertices connected by a star, evoking the five mana colors.
  'mana-wheel': {
    viewBox: [200, 200],
    strokeWidth: 3,
    paths: [
      { d: 'M100 25 L171 77 L144 161 L56 161 L29 77 Z', width: 2 },
      { d: 'M100 25 L144 161 M144 161 L29 77 M29 77 L171 77 M171 77 L56 161 M56 161 L100 25', accent: true, width: 1.5 },
      { d: 'M88 25 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z', sign: true },
      { d: 'M159 77 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z', sign: true },
      { d: 'M132 161 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z', sign: true },
      { d: 'M44 161 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z', sign: true },
      { d: 'M17 77 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z', sign: true },
      { d: 'M90 100 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z', accent: true, fill: true },
    ],
  },
  // A jagged lightning bolt with accent energy sparks.
  'lightning-bolt': {
    viewBox: [120, 200],
    strokeWidth: 4,
    linecap: 'butt',
    paths: [
      { d: 'M72 2 L38 82 L60 82 L26 198 L92 110 L70 110 L100 2 Z', fill: true },
      { d: 'M16 62 L28 70', accent: true },
      { d: 'M98 130 L110 122', accent: true },
      { d: 'M12 104 L24 100', accent: true },
      { d: 'M100 72 L112 68', accent: true },
      { d: 'M8 82 L18 84', accent: true },
      { d: 'M106 96 L116 92', accent: true },
    ],
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
  const { viewBox, strokeWidth, paths, texts = [], linecap = 'round' } = GRAPHICS[type];
  const accentColor = 'var(--poster-accent)';
  const paperColor = 'var(--poster-background)';
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
      {paths.map(({ d, fill, accent, paper, knockout, sign, tint, dash, width: pathWidth }) => (
        <path
          key={d}
          d={d}
          strokeWidth={pathWidth}
          strokeDasharray={dash}
          style={{
            ...(accent ? { stroke: accentColor } : undefined),
            ...(fill ? { fill: accent ? accentColor : 'currentColor', stroke: 'none' } : undefined),
            ...(paper ? { stroke: paperColor } : undefined),
            ...(knockout ? { fill: 'currentColor', stroke: paperColor, strokeWidth: 2.5 } : undefined),
            ...(sign ? { fill: paperColor } : undefined),
            ...(tint ? { fill: accentColor } : undefined),
          }}
        />
      ))}
      {texts.map(({ text, size, x, y, d }, index) => {
        const pathId = `graphic-${type}-${index}`;
        return (
          <text
            key={text}
            x={x}
            y={y}
            fontSize={size}
            textAnchor="middle"
            style={{ fill: 'currentColor', stroke: 'none', fontFamily: 'var(--graphic-font, inherit)' }}
          >
            {d ? (
              <>
                <defs>
                  <path id={pathId} d={d} />
                </defs>
                <textPath href={`#${pathId}`} startOffset="50%">
                  {text}
                </textPath>
              </>
            ) : (
              text
            )}
          </text>
        );
      })}
    </svg>
  );
}
