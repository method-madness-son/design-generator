import type { CoverGeometry } from '@/lib/lowcontent/specs';
import { COVER_SAFE_INSET_IN, scaleX, scaleY } from '@/lib/lowcontent/specs';
import { fontFamilyCss } from '@/lib/theme';
import type { ResolvedInteriorTheme } from '@/types/lowcontent';

export type CoverConcept = 'a' | 'b' | 'c';

export function coverConceptFor(bookId: string, value: string | undefined): CoverConcept | undefined {
  if (bookId !== 'nd-planner') return undefined;
  if (value === 'b' || value === 'c') return value;
  return 'a';
}

const NAVY = '#1D3557';
const PAPER = '#F1FAEE';
const POWDER = '#A8DADC';
const PINK = '#FFAFCC';
const LAVENDER = '#CDB4DB';
const BUTTER = '#FFE8A3';

type Props = {
  concept: CoverConcept;
  geometry: CoverGeometry;
  theme: ResolvedInteriorTheme;
  mode: 'print' | 'preview';
  variant: 'wrap' | 'front';
  pageCount: number;
};

export function NdCover({ concept, geometry, mode, variant, pageCount }: Props) {
  const widthPx = variant === 'front' ? Math.round(geometry.trimWidthIn * 300) : geometry.fullWidthPx;
  const heightPx = variant === 'front' ? Math.round(geometry.trimHeightIn * 300) : geometry.fullHeightPx;
  const widthIn = variant === 'front' ? geometry.trimWidthIn : geometry.fullWidthIn;
  const heightIn = variant === 'front' ? geometry.trimHeightIn : geometry.fullHeightIn;
  const sx = (inches: number) => scaleX(widthIn, widthPx, inches);
  const sy = (inches: number) => scaleY(heightIn, heightPx, inches);
  const fredoka = fontFamilyCss('Fredoka');
  const work = fontFamilyCss('Work Sans');
  const shell = concept === 'b' ? BUTTER : concept === 'a' ? POWDER : PAPER;

  if (variant === 'front') {
    return (
      <div data-lc-front-ready="1" style={{ position: 'relative', width: widthPx, height: heightPx, background: concept === 'b' ? BUTTER : PAPER }}>
        <Front concept={concept} sx={sx} sy={sy} fredoka={fredoka} work={work} pad={COVER_SAFE_INSET_IN} />
      </div>
    );
  }

  const guide = Math.max(sy(1.25 / 72), 2);
  return (
    <article
      data-lc-cover={mode === 'print' ? '1' : undefined}
      style={{ position: 'relative', width: widthPx, height: heightPx, background: shell, overflow: 'hidden' }}
    >
      {concept === 'a' ? (
        <div style={{ position: 'absolute', left: 0, top: 0, width: sx(geometry.spine.x + geometry.spine.width), height: heightPx, background: POWDER }} />
      ) : null}
      <Front
        concept={concept}
        sx={sx}
        sy={sy}
        fredoka={fredoka}
        work={work}
        pad={COVER_SAFE_INSET_IN}
        offsetX={sx(geometry.front.x)}
        offsetY={sy(geometry.front.y)}
        width={sx(geometry.front.width)}
        height={sy(geometry.front.height)}
      />
      <Back concept={concept} geometry={geometry} sx={sx} sy={sy} work={work} pageCount={pageCount} />
      {geometry.allowSpineText ? (
        <div
          style={{
            position: 'absolute',
            left: sx(geometry.spine.x + geometry.spineMarginIn),
            top: sy(geometry.spine.y + COVER_SAFE_INSET_IN),
            width: sx(Math.max(0, geometry.spine.width - geometry.spineMarginIn * 2)),
            height: sy(geometry.spine.height - COVER_SAFE_INSET_IN * 2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: NAVY,
            fontFamily: fredoka,
            fontWeight: 600,
            fontSize: sy(8 / 72),
            overflow: 'hidden',
          }}
        >
          ADHD Planner
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: sx(geometry.barcode.x),
          top: sy(geometry.barcode.y),
          width: sx(geometry.barcode.width),
          height: sy(geometry.barcode.height),
          background: '#ffffff',
          boxSizing: 'border-box',
          border: mode === 'preview' ? `${guide}px dashed #b91c1c` : 'none',
        }}
      />
      {mode === 'preview' ? (
        <div
          style={{
            position: 'absolute',
            left: sx(geometry.bleedIn),
            top: sy(geometry.bleedIn),
            width: sx(geometry.fullWidthIn - geometry.bleedIn * 2),
            height: sy(geometry.fullHeightIn - geometry.bleedIn * 2),
            outline: `${guide}px solid rgba(20,20,20,0.55)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </article>
  );
}

function Front({
  concept,
  sx,
  sy,
  fredoka,
  work,
  pad,
  offsetX = 0,
  offsetY = 0,
  width,
  height,
}: {
  concept: CoverConcept;
  sx: (inches: number) => number;
  sy: (inches: number) => number;
  fredoka: string;
  work: string;
  pad: number;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
}) {
  const positioned = width !== undefined && height !== undefined;
  return (
    <div
      data-lc-front="1"
      style={{
        position: positioned ? 'absolute' : 'relative',
        left: positioned ? offsetX : undefined,
        top: positioned ? offsetY : undefined,
        width: positioned ? width : '100%',
        height: positioned ? height : '100%',
        background: concept === 'b' ? BUTTER : PAPER,
        color: NAVY,
        fontFamily: work,
        boxSizing: 'border-box',
        padding: positioned ? undefined : 0,
      }}
    >
      <div style={{ position: 'absolute', left: sx(pad), right: sx(pad), top: sy(pad), bottom: sy(pad), display: 'flex', flexDirection: 'column' }}>
        {concept === 'a' ? <BrainTabs sx={sx} sy={sy} fredoka={fredoka} work={work} /> : null}
        {concept === 'b' ? <BrainDump fredoka={fredoka} work={work} sy={sy} /> : null}
        {concept === 'c' ? <NowNextLater fredoka={fredoka} work={work} sy={sy} /> : null}
      </div>
    </div>
  );
}

function BrainTabs({ sx, sy, fredoka, work }: { sx: (n: number) => number; sy: (n: number) => number; fredoka: string; work: string }) {
  const tabs = [
    { label: 'today', fill: PINK, active: true },
    { label: 'later', fill: LAVENDER, active: false },
    { label: 'ideas', fill: '#ffffff', active: false },
    { label: 'wins', fill: '#ffffff', active: false },
  ];
  return (
    <>
      <h1 style={{ margin: 0, fontFamily: fredoka, fontWeight: 600, fontSize: sy(0.92), lineHeight: 0.95, color: NAVY }}>
        ADHD
        <br />
        Planner
      </h1>
      <div style={{ marginTop: sy(0.35), flex: 1, background: POWDER, borderRadius: sx(0.12), padding: sx(0.12), display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: sx(0.06) }}>
          {tabs.map((tab) => (
            <div
              key={tab.label}
              style={{
                background: tab.fill,
                color: NAVY,
                fontFamily: fredoka,
                fontWeight: 600,
                fontSize: sy(0.16),
                padding: `${sy(0.06)}px ${sx(0.1)}px`,
                borderRadius: `${sx(0.06)}px ${sx(0.06)}px 0 0`,
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: '#ffffff', borderRadius: sx(0.08), display: 'flex', alignItems: 'center', gap: sx(0.12), padding: sx(0.16) }}>
          <span style={{ width: sx(0.28), height: sx(0.28), border: `${Math.max(sy(0.02), 2)}px solid ${NAVY}`, borderRadius: sx(0.04), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fredoka, fontSize: sy(0.18) }}>
            ✓
          </span>
          <span style={{ fontFamily: work, fontWeight: 500, fontSize: sy(0.2) }}>one thing for today</span>
        </div>
      </div>
      <p style={{ margin: `${sy(0.16)}px 0 0`, fontFamily: work, fontWeight: 500, fontSize: sy(0.19) }}>undated · brain dump · top 3 · dopamine menu</p>
      <p style={{ marginTop: 'auto', marginBottom: 0, fontFamily: work, fontWeight: 500, fontSize: sy(0.16) }}>for neurodivergent adults · start any day</p>
    </>
  );
}

function BrainDump({ fredoka, work, sy }: { fredoka: string; work: string; sy: (n: number) => number }) {
  return (
    <>
      <div style={{ position: 'relative', marginTop: sy(0.8) }}>
        <div style={{ position: 'absolute', left: '8%', right: '6%', top: sy(-0.15), height: sy(1.6), background: PINK, borderRadius: '50%', opacity: 0.95 }} />
        <h1 style={{ position: 'relative', margin: 0, fontFamily: fredoka, fontWeight: 700, fontSize: sy(1.15), lineHeight: 0.9, color: NAVY }}>
          brain
          <br />
          dump
        </h1>
      </div>
      <p style={{ marginTop: sy(0.4), fontFamily: work, fontWeight: 600, fontSize: sy(0.2) }}>ADHD planner · undated · 6×9</p>
    </>
  );
}

function NowNextLater({ fredoka, work, sy }: { fredoka: string; work: string; sy: (n: number) => number }) {
  const bars = [
    { label: 'now', fill: PINK },
    { label: 'next', fill: POWDER },
    { label: 'later', fill: LAVENDER },
  ];
  return (
    <>
      <h1 style={{ margin: 0, fontFamily: fredoka, fontWeight: 600, fontSize: sy(0.8), lineHeight: 0.95, color: NAVY }}>ADHD Planner</h1>
      <div style={{ marginTop: sy(0.45), display: 'flex', flexDirection: 'column', gap: sy(0.16) }}>
        {bars.map((bar) => (
          <div key={bar.label} style={{ background: bar.fill, color: NAVY, fontFamily: fredoka, fontWeight: 600, fontSize: sy(0.52), borderRadius: sy(0.12), padding: `${sy(0.12)}px ${sy(0.2)}px` }}>
            {bar.label}
          </div>
        ))}
      </div>
      <p style={{ marginTop: 'auto', fontFamily: work, fontWeight: 500, fontSize: sy(0.18) }}>undated · start any day</p>
    </>
  );
}

function Back({
  concept,
  geometry,
  sx,
  sy,
  work,
  pageCount,
}: {
  concept: CoverConcept;
  geometry: CoverGeometry;
  sx: (n: number) => number;
  sy: (n: number) => number;
  work: string;
  pageCount: number;
}) {
  const pad = geometry.safeInsetIn;
  const textBottom = geometry.barcode.y - 0.2;
  const height = Math.max(0.5, textBottom - (geometry.back.y + pad));
  const bullets = ['Undated, so you can start any day', 'Brain dump, top 3, and a dopamine menu', 'A paper tool. Not medical advice.'];
  return (
    <div
      style={{
        position: 'absolute',
        left: sx(geometry.back.x + pad),
        top: sy(geometry.back.y + pad),
        width: sx(geometry.back.width - pad * 2),
        height: sy(height),
        overflow: 'hidden',
        color: NAVY,
        fontFamily: work,
        fontWeight: 500,
      }}
    >
      <p style={{ margin: 0, fontSize: sy(0.2), fontWeight: 600 }}>ADHD Planner</p>
      <ul style={{ margin: `${sy(0.2)}px 0 0`, paddingLeft: sx(0.22), fontSize: sy(0.16), lineHeight: 1.45 }}>
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p style={{ margin: `${sy(0.22)}px 0 0`, fontSize: sy(0.14) }}>{pageCount} write-in pages · {concept === 'a' ? 'matte' : concept === 'b' ? 'type cover' : 'bar cover'}</p>
    </div>
  );
}
