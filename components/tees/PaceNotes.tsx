import type { CSSProperties, ReactNode } from 'react';
import type { NdArtKind, ResolvedTee } from '@/types/tee';

const ORANGE = '#DA5A2A';

function inch(widthPx: number, value: number) {
  return (widthPx / 12) * value;
}

export function PaceNotes({
  kind,
  tee,
  ink,
  dark,
  widthPx,
  heightPx,
}: {
  kind: NdArtKind;
  tee: ResolvedTee;
  ink: string;
  dark: boolean;
  widthPx: number;
  heightPx: number;
}) {
  return kind === 'pace-hand' ? (
    <HandNote tee={tee} ink={ink} dark={dark} widthPx={widthPx} heightPx={heightPx} />
  ) : (
    <StencilNote tee={tee} ink={ink} widthPx={widthPx} heightPx={heightPx} />
  );
}

function StencilNote({
  tee,
  ink,
  widthPx,
  heightPx,
}: {
  tee: ResolvedTee;
  ink: string;
  widthPx: number;
  heightPx: number;
}) {
  const label = inch(widthPx, 0.48);
  return (
    <div style={stage(widthPx, heightPx, ink)}>
      <svg viewBox="0 0 1200 520" width={inch(widthPx, 11)} height={inch(widthPx, 4.8)} role="img" aria-label="LEFT 4 OVER CREST">
        <filter id="pace-distress" x="-5%" y="-10%" width="110%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="4" result="noise" />
          <feComponentTransfer in="noise" result="mask">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 0 1 1" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
        <text
          filter="url(#pace-distress)"
          x="600"
          y="190"
          textAnchor="middle"
          fill={ink}
          fontSize="200"
          fontWeight="800"
          style={{ fontFamily: tee.fonts.displayCss }}
        >
          LEFT 4
        </text>
        <text
          filter="url(#pace-distress)"
          x="600"
          y="400"
          textAnchor="middle"
          fill={ink}
          fontSize="188"
          fontWeight="800"
          style={{ fontFamily: tee.fonts.displayCss }}
        >
          OVER CREST
        </text>
      </svg>
      <div
        style={{
          marginTop: inch(widthPx, 0.28),
          fontFamily: tee.fonts.supportingCss,
          fontSize: label,
          fontWeight: 600,
          letterSpacing: '0.22em',
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        DON&apos;T CUT
      </div>
      <svg
        viewBox="0 0 320 90"
        width={inch(widthPx, 5.2)}
        height={inch(widthPx, 1.45)}
        aria-hidden="true"
        style={{ marginTop: inch(widthPx, 0.15) }}
      >
        <path d="M18 68 C 90 68, 140 46, 230 30" fill="none" stroke={ink} strokeWidth="16" strokeLinecap="butt" />
        <path d="M18 48 C 80 48, 130 32, 214 18" fill="none" stroke={ink} strokeWidth="11" strokeLinecap="butt" />
        <path d="M18 68 C 48 68, 62 62, 78 58" fill="none" stroke={ORANGE} strokeWidth="16" strokeLinecap="butt" />
        <path d="M214 8 L268 24 L210 46 Z" fill={ink} />
      </svg>
    </div>
  );
}

function HandNote({
  tee,
  ink,
  dark,
  widthPx,
  heightPx,
}: {
  tee: ResolvedTee;
  ink: string;
  dark: boolean;
  widthPx: number;
  heightPx: number;
}) {
  const size = inch(widthPx, 0.95);
  const line: CSSProperties = {
    fontFamily: tee.fonts.displayCss,
    fontSize: size,
    fontWeight: 400,
    lineHeight: 1.25,
    position: 'relative',
    display: 'inline-block',
  };
  return (
    <div style={{ ...stage(widthPx, heightPx, ink), alignItems: 'flex-start', paddingLeft: inch(widthPx, 1.1) }}>
      <NoteRow ink={ink} size={size}>
        <span style={line}>L4 ^ crest</span>
      </NoteRow>
      <NoteRow ink={ink} size={size}>
        <span style={line}>
          don&apos;t cut
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-4%',
              right: '-6%',
              bottom: '8%',
              height: '42%',
              background: ORANGE,
              opacity: dark ? 0.85 : 0.6,
              mixBlendMode: dark ? 'normal' : 'multiply',
              transform: 'skewX(-18deg) rotate(-2deg)',
              zIndex: -1,
            }}
          />
        </span>
      </NoteRow>
      <NoteRow ink={ink} size={size}>
        <span style={line}>
          caution
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: '8%',
              bottom: '6%',
              height: Math.max(3, size * 0.06),
              background: ink,
              transform: 'rotate(-1.5deg)',
            }}
          />
        </span>
      </NoteRow>
      <div style={{ ...line, marginLeft: inch(widthPx, 0.7) }}>flat out</div>
    </div>
  );
}

function NoteRow({ ink, size, children }: { ink: string; size: number; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.35 }}>
      <svg viewBox="0 0 36 24" width={size * 0.7} height={size * 0.46} aria-hidden="true">
        <path d="M2 12 H24" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M18 5 L30 12 L18 19" stroke={ink} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {children}
    </div>
  );
}

function stage(widthPx: number, heightPx: number, ink: string): CSSProperties {
  return {
    width: widthPx,
    height: heightPx,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: ink,
    background: 'transparent',
    overflow: 'hidden',
  };
}

