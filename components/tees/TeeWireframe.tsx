import { TeeArtwork } from '@/components/tees/TeeArtwork';
import { WIREFRAME, wireframeDesignRect, wireframePrintRect } from '@/lib/teeSizes';
import type { InkSetName, ShirtColor } from '@/types/theme';
import type { ResolvedTee } from '@/types/tee';

const BODY_PATH = [
  'M 124 168',
  'L 46 228',
  'L 98 286',
  'L 164 228',
  'L 184 700',
  'Q 340 732 496 700',
  'L 516 228',
  'L 582 286',
  'L 634 228',
  'L 556 168',
  'C 470 150 430 176 404 178',
  'L 276 178',
  'C 250 176 210 150 124 168',
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
        <path d={BODY_PATH} fill={shirt.hex} stroke={line} strokeWidth={3} strokeLinejoin="round" />
        <path d="M 268 178 Q 340 292 412 178" fill="none" stroke={line} strokeWidth={3} />
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
            <text x={print.x} y={print.y - 8} fill={line} fontSize={15} fontFamily="ui-sans-serif, sans-serif">
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
