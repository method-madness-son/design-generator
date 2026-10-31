import type { CSSProperties } from 'react';
import type { ResolvedInkSet, ResolvedTee } from '@/types/tee';

function advanceRatio(family: string, role: 'display' | 'supporting'): number {
  if (/mono|space mono|press start/i.test(family)) return 0.62;
  if (role === 'supporting') return 0.56;
  return 0.78;
}

function lineFontSize(text: string, family: string, role: 'display' | 'supporting', widthPx: number): number {
  const inner = widthPx * 0.94;
  const fitted = inner / (Math.max(text.length, 1) * advanceRatio(family, role));
  const max = widthPx * (role === 'display' ? 0.22 : 0.16);
  return Math.max(8, Math.min(max, fitted));
}

function Tabs({ inks, count, heightPx }: { inks: string[]; count: number; heightPx: number }) {
  const slot = 40;
  const width = count * slot;
  return (
    <svg
      viewBox={`0 0 ${width} 48`}
      width="100%"
      height={heightPx}
      role="img"
      aria-label="A row of empty browser tabs"
    >
      {Array.from({ length: count }, (_, index) => {
        const fill = inks[index % inks.length] ?? inks[0];
        return (
          <rect key={index} x={index * slot + 3} y={10} width={32} height={34} rx={3} fill={fill} />
        );
      })}
    </svg>
  );
}

function ProgressBar({
  value,
  track,
  fill,
  heightPx,
}: {
  value: number;
  track: string;
  fill: string;
  heightPx: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const inner = 96 * (clamped / 100);
  return (
    <svg viewBox="0 0 100 18" width="100%" height={heightPx} role="img" aria-label={`Progress bar at ${clamped} percent`}>
      <rect x={1} y={1} width={98} height={16} fill="none" stroke={track} strokeWidth={2} />
      {inner > 0 ? <rect x={2} y={2} width={inner} height={12} fill={fill} /> : null}
    </svg>
  );
}

export function TeeArtwork({
  tee,
  ink,
  widthPx,
  heightPx,
}: {
  tee: ResolvedTee;
  ink: ResolvedInkSet;
  widthPx: number;
  heightPx: number;
}) {
  const graphic = tee.graphic;
  const position = graphic?.position ?? 'top';
  const shapeHexes = ink.shapeInks.map((swatch) => swatch.hex);
  const tabCount = graphic?.type === 'browser-tabs' ? graphic.count ?? 6 : 6;
  const graphicHeight = Math.max(12, Math.min(heightPx * 0.22, widthPx * 0.28));
  const visual =
    graphic?.type === 'browser-tabs' ? (
      <Tabs inks={shapeHexes} count={tabCount} heightPx={graphicHeight} />
    ) : graphic?.type === 'progress-bar' ? (
      <ProgressBar value={graphic.value} track={ink.text.hex} fill={shapeHexes[0] ?? ink.text.hex} heightPx={graphicHeight} />
    ) : null;

  return (
    <div
      data-font-display={tee.fonts.display}
      data-font-supporting={tee.fonts.supporting}
      style={{
        width: widthPx,
        height: heightPx,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Math.round(heightPx * 0.035),
        padding: Math.round(widthPx * 0.03),
        color: ink.text.hex,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {position === 'top' ? visual : null}
      {tee.lines.map((line) => {
        const family = line.font === 'display' ? tee.fonts.display : tee.fonts.supporting;
        const css = line.font === 'display' ? tee.fonts.displayCss : tee.fonts.supportingCss;
        const size = lineFontSize(line.text, family, line.font, widthPx);
        const style: CSSProperties = {
          fontFamily: css,
          fontSize: size,
          lineHeight: 0.95,
          fontWeight: 400,
          letterSpacing: family === 'Bebas Neue' ? '0.08em' : '0',
          margin: 0,
          maxWidth: '100%',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          color: ink.text.hex,
        };
        return line.font === 'display' ? (
          <h1 key={line.text} style={style}>
            {line.text}
          </h1>
        ) : (
          <p key={line.text} style={style}>
            {line.text}
          </p>
        );
      })}
      {position === 'bottom' ? visual : null}
    </div>
  );
}
