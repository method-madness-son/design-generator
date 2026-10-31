import { TeeArtwork } from '@/components/tees/TeeArtwork';
import { WIREFRAME, wireframeDesignRect, wireframePrintRect } from '@/lib/teeSizes';
import type { InkSetName, ShirtColor } from '@/types/theme';
import type { ResolvedTee } from '@/types/tee';

// Flat short-sleeve tee: shallow crew neck, sleeves angling down and out,
// straight angled sleeve hems, a short armhole notch, vertical sides, straight hem.
const BODY_PATH = [
  'M 100 236',
  'L 200 164',
  'L 258 146',
  'Q 340 202 422 146',
  'L 480 164',
  'L 580 236',
  'L 512 296',
  'L 494 296',
  'L 494 700',
  'L 186 700',
  'L 186 296',
  'L 168 296',
  'Z',
].join(' ');

export function TeeWireframe({
  tee,
  shirt,
  inkSet,
  widthPx,
  guides,
}: {
  tee: ResolvedTee;
  shirt: ShirtColor;
  inkSet: InkSetName;
  widthPx: number;
  guides: boolean;
}) {
  const ink = tee.inkBySet[inkSet];
  const scale = widthPx / WIREFRAME.viewWidth;
  const heightPx = WIREFRAME.viewHeight * scale;
  const print = wireframePrintRect();
  const design = wireframeDesignRect(tee.placement.size === 'left-chest' ? 'left-chest' : 'full-front');
  const line = shirt.is_dark ? '#E4E4E4' : '#2C2C2C';
  const label = guides
    ? `${TEE_PRINT_LABEL(print)}`
    : '';

  return (
    <div style={{ position: 'relative', width: widthPx, height: heightPx, background: 'transparent' }}>
      <svg
        viewBox={`0 0 ${WIREFRAME.viewWidth} ${WIREFRAME.viewHeight}`}
        width={widthPx}
        height={heightPx}
        role="img"
        aria-label={`${shirt.name} tee wireframe`}
      >
        <path
          d={BODY_PATH}
          fill={shirt.hex}
          stroke={line}
          strokeWidth={2.75}
          strokeLinejoin="miter"
          strokeMiterlimit={3}
        />
        {guides ? (
          <>
            <rect
              x={print.x}
              y={print.y}
              width={print.width}
              height={print.height}
              fill="none"
              stroke={line}
              strokeWidth={1.5}
              strokeDasharray="7 5"
            />
            <rect
              x={design.x}
              y={design.y}
              width={design.width}
              height={design.height}
              fill="none"
              stroke={line}
              strokeWidth={1.25}
              strokeDasharray="3 4"
            />
            <text
              x={WIREFRAME.centerX}
              y={128}
              textAnchor="middle"
              fill={line}
              fontSize={15}
              fontFamily="ui-sans-serif, sans-serif"
            >
              {label}
            </text>
          </>
        ) : null}
      </svg>
      {ink ? (
        <div
          style={{
            position: 'absolute',
            left: design.x * scale,
            top: design.y * scale,
            width: design.width * scale,
            height: design.height * scale,
          }}
        >
          <TeeArtwork tee={tee} ink={ink} widthPx={design.width * scale} heightPx={design.height * scale} />
        </div>
      ) : null}
    </div>
  );
}

function TEE_PRINT_LABEL(print: { width: number; height: number }): string {
  const pxPerIn = print.width / 15;
  const widthIn = Math.round((print.width / pxPerIn) * 10) / 10;
  const heightIn = Math.round((print.height / pxPerIn) * 10) / 10;
  return `${widthIn} × ${heightIn} in print area`;
}
