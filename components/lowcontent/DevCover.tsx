import { icons } from 'lucide-react';
import type { CoverGeometry } from '@/lib/lowcontent/specs';
import { COVER_SAFE_INSET_IN, scaleX, scaleY } from '@/lib/lowcontent/specs';
import type { ResolvedInteriorTheme } from '@/types/lowcontent';

type IconName = keyof typeof icons;

const toPascalCase = (name: string) =>
  name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const NIGHT_OWL_BG = '#011627';
const NIGHT_OWL_ACCENT = '#7FDBCA';
const NIGHT_OWL_WHITE = '#D6DEEB';

export type DevDesignId =
  | 'aspect-ratios'
  | 'command-s'
  | 'console-log'
  | 'const-self'
  | 'eslint-disable'
  | 'frame-rates'
  | 'from-ubuntu-latest'
  | 'git-commit-wip'
  | 'git-conflict'
  | 'http-status-codes'
  | 'j-k-l'
  | 'reduction'
  | 'rm-node-modules'
  | 'then-catch-finally'
  | 'two-problems-regex'
  | 'typeof-nan'
  | 'z-index';

export const DEV_DESIGNS: { id: DevDesignId; title: string; subtitle: string; icon: string }[] = [
  { id: 'aspect-ratios', title: 'Aspect Ratios', subtitle: '16:9 for YouTube. 9:16 for Reels. 2.35:1 for Cinema.', icon: 'MonitorSmartphone' },
  { id: 'command-s', title: 'Command + S', subtitle: 'Because it will crash.', icon: 'Save' },
  { id: 'console-log', title: "console.log('here');", subtitle: "The world's most popular debugging tool.", icon: 'SquareTerminal' },
  { id: 'const-self', title: 'const self = this;', subtitle: 'When you lose track of who you are.', icon: 'Crosshair' },
  { id: 'eslint-disable', title: '// eslint-disable-next-line', subtitle: 'The official solution to all warnings.', icon: 'AlertTriangle' },
  { id: 'frame-rates', title: 'Frame Rates', subtitle: '24fps for film. 30fps for TV. 60fps for gaming.', icon: 'Film' },
  { id: 'from-ubuntu-latest', title: 'FROM ubuntu:latest', subtitle: 'Shipping "my machine" to production.', icon: 'Box' },
  { id: 'git-commit-wip', title: 'git commit -m "wip"', subtitle: 'Friday. 4:59 PM.', icon: 'Clock' },
  { id: 'git-conflict', title: '<<<<<<< HEAD', subtitle: 'Choose your fighter.', icon: 'Swords' },
  { id: 'http-status-codes', title: '200 | 400 | 500', subtitle: '200: OK. 400: Your fault. 500: My fault.', icon: 'ServerCrash' },
  { id: 'j-k-l', title: 'J, K, L', subtitle: 'Rewind. Pause. Fast Forward.', icon: 'FastForward' },
  { id: 'reduction', title: 'Reduction', subtitle: '“Less, but better.” — Dieter Rams', icon: 'Minimize2' },
  { id: 'rm-node-modules', title: 'rm -rf node_modules', subtitle: 'The universal fix for everything.', icon: 'Trash2' },
  { id: 'then-catch-finally', title: '.then() .catch() .finally()', subtitle: 'Resolve. Reject. Clean up.', icon: 'FastForward' },
  { id: 'two-problems-regex', title: '/^([a-zA-Z0-9]+)$/', subtitle: 'Now you have two problems.', icon: 'Brackets' },
  { id: 'typeof-nan', title: "typeof NaN === 'number'", subtitle: 'Welcome to JavaScript.', icon: 'Zap' },
  { id: 'z-index', title: 'z-index: 99999;', subtitle: 'Nuking the stacking context from orbit.', icon: 'Layers' },
];

export function devDesignFor(value: string | undefined): DevDesignId | undefined {
  if (!value) return DEV_DESIGNS[0].id;
  const found = DEV_DESIGNS.find((d) => d.id === value);
  return found?.id ?? DEV_DESIGNS[0].id;
}

type Props = {
  design: DevDesignId;
  geometry: CoverGeometry;
  theme: ResolvedInteriorTheme;
  mode: 'print' | 'preview';
  variant: 'wrap' | 'front';
  title: string;
  subtitle: string;
  pageCount: number;
  iconRem?: number;
  titleRem?: number;
  subtitleRem?: number;
  defaultIconRem?: number;
  defaultTitleRem?: number;
  defaultSubtitleRem?: number;
};

export function DevCover({
  design,
  geometry,
  mode,
  variant,
  title,
  subtitle,
  pageCount,
  iconRem,
  titleRem,
  subtitleRem,
  defaultIconRem,
  defaultTitleRem,
  defaultSubtitleRem,
}: Props) {
  const entry = DEV_DESIGNS.find((d) => d.id === design)!;
  const widthPx = variant === 'front' ? Math.round(geometry.trimWidthIn * 300) : geometry.fullWidthPx;
  const heightPx = variant === 'front' ? Math.round(geometry.trimHeightIn * 300) : geometry.fullHeightPx;
  const widthIn = variant === 'front' ? geometry.trimWidthIn : geometry.fullWidthIn;
  const heightIn = variant === 'front' ? geometry.trimHeightIn : geometry.fullHeightIn;
  const sx = (inches: number) => scaleX(widthIn, widthPx, inches);
  const sy = (inches: number) => scaleY(heightIn, heightPx, inches);

  const doto = 'var(--font-doto), sans-serif';
  const spaceMono = 'var(--font-theme-space-mono), monospace';

  if (variant === 'front') {
    return (
      <div data-lc-front-ready="1" style={{ position: 'relative', width: widthPx, height: heightPx, background: NIGHT_OWL_BG }}>
        <Front
          entry={entry}
          sx={sx}
          sy={sy}
          doto={doto}
          spaceMono={spaceMono}
          pad={COVER_SAFE_INSET_IN}
          bookTitle={title}
          bookSubtitle={subtitle}
          iconRem={iconRem}
          titleRem={titleRem}
          subtitleRem={subtitleRem}
          defaultIconRem={defaultIconRem}
          defaultTitleRem={defaultTitleRem}
          defaultSubtitleRem={defaultSubtitleRem}
        />
      </div>
    );
  }

  const guide = Math.max(sy(1.25 / 72), 2);
  return (
    <article
      data-lc-cover={mode === 'print' ? '1' : undefined}
      style={{ position: 'relative', width: widthPx, height: heightPx, background: NIGHT_OWL_BG, overflow: 'hidden' }}
    >
      <Front
        entry={entry}
        sx={sx}
        sy={sy}
        doto={doto}
        spaceMono={spaceMono}
        pad={COVER_SAFE_INSET_IN}
        bookTitle={title}
        bookSubtitle={subtitle}
        offsetX={sx(geometry.front.x)}
        offsetY={sy(geometry.front.y)}
        width={sx(geometry.front.width)}
        height={sy(geometry.front.height)}
        iconRem={iconRem}
        titleRem={titleRem}
        subtitleRem={subtitleRem}
        defaultIconRem={defaultIconRem}
        defaultTitleRem={defaultTitleRem}
        defaultSubtitleRem={defaultSubtitleRem}
      />
      <Back
        geometry={geometry}
        sx={sx}
        sy={sy}
        spaceMono={spaceMono}
        bookTitle={title}
        bookSubtitle={subtitle}
        pageCount={pageCount}
      />
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
            color: NIGHT_OWL_ACCENT,
            fontFamily: doto,
            fontWeight: 600,
            fontSize: sy(8 / 72),
            overflow: 'hidden',
          }}
        >
          {title}
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
  entry,
  sx,
  sy,
  doto,
  spaceMono,
  pad,
  bookTitle,
  bookSubtitle,
  offsetX = 0,
  offsetY = 0,
  width,
  height,
  iconRem,
  titleRem,
  subtitleRem,
  defaultIconRem = 14.5,
  defaultTitleRem = 4.5,
  defaultSubtitleRem = 3.25,
}: {
  entry: (typeof DEV_DESIGNS)[number];
  sx: (inches: number) => number;
  sy: (inches: number) => number;
  doto: string;
  spaceMono: string;
  pad: number;
  bookTitle: string;
  bookSubtitle: string;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
  iconRem?: number;
  titleRem?: number;
  subtitleRem?: number;
  defaultIconRem?: number;
  defaultTitleRem?: number;
  defaultSubtitleRem?: number;
}) {
  const positioned = width !== undefined && height !== undefined;
  const Icon = icons[toPascalCase(entry.icon) as IconName];
  const iconScale = iconRem && defaultIconRem ? iconRem / defaultIconRem : 1;
  const titleScale = titleRem && defaultTitleRem ? titleRem / defaultTitleRem : 1;
  const subtitleScale = subtitleRem && defaultSubtitleRem ? subtitleRem / defaultSubtitleRem : 1;
  const iconSize = sy(2.2 * iconScale);

  return (
    <div
      data-lc-front="1"
      style={{
        position: positioned ? 'absolute' : 'relative',
        left: positioned ? offsetX : undefined,
        top: positioned ? offsetY : undefined,
        width: positioned ? width : '100%',
        height: positioned ? height : '100%',
        background: NIGHT_OWL_BG,
        color: NIGHT_OWL_WHITE,
        fontFamily: spaceMono,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', left: sx(pad), right: sx(pad), top: sy(pad), bottom: sy(pad), display: 'flex', flexDirection: 'column' }}>
        {Icon ? (
          <div style={{ marginTop: sy(0.4), display: 'flex', justifyContent: 'center' }}>
            <Icon
              style={{
                width: iconSize,
                height: iconSize,
                color: NIGHT_OWL_ACCENT,
                filter: `drop-shadow(0 0 ${sy(0.06 * iconScale)}px ${NIGHT_OWL_ACCENT})`,
              }}
              strokeWidth={2}
              aria-hidden
            />
          </div>
        ) : null}
        <h1
          style={{
            margin: `${sy(0.35)}px 0 0`,
            fontFamily: doto,
            fontWeight: 900,
            fontSize: sy(0.58 * titleScale),
            lineHeight: 1.05,
            color: NIGHT_OWL_ACCENT,
            textAlign: 'center',
            wordBreak: 'break-word',
          }}
        >
          {entry.title}
        </h1>
        <p
          style={{
            margin: `${sy(0.2)}px 0 0`,
            fontFamily: spaceMono,
            fontWeight: 400,
            fontSize: sy(0.2 * subtitleScale),
            lineHeight: 1.4,
            color: NIGHT_OWL_WHITE,
            textAlign: 'center',
            opacity: 0.85,
          }}
        >
          {entry.subtitle}
        </p>
        <div style={{ flex: 1 }} />
        <div
          style={{
            borderTop: `${Math.max(sy(0.01), 1)}px solid ${NIGHT_OWL_ACCENT}`,
            paddingTop: sy(0.2),
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: doto,
              fontWeight: 600,
              fontSize: sy(0.18),
              color: NIGHT_OWL_WHITE,
              letterSpacing: '0.06em',
              textAlign: 'center',
            }}
          >
            {bookTitle}
          </p>
          <p
            style={{
              margin: `${sy(0.08)}px 0 0`,
              fontFamily: spaceMono,
              fontWeight: 400,
              fontSize: sy(0.12),
              color: NIGHT_OWL_WHITE,
              opacity: 0.6,
              textAlign: 'center',
            }}
          >
            {bookSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function Back({
  geometry,
  sx,
  sy,
  spaceMono,
  bookTitle,
  bookSubtitle,
  pageCount,
}: {
  geometry: CoverGeometry;
  sx: (n: number) => number;
  sy: (n: number) => number;
  spaceMono: string;
  bookTitle: string;
  bookSubtitle: string;
  pageCount: number;
}) {
  const pad = geometry.safeInsetIn;
  const textBottom = geometry.barcode.y - 0.2;
  const height = Math.max(0.5, textBottom - (geometry.back.y + pad));
  return (
    <div
      style={{
        position: 'absolute',
        left: sx(geometry.back.x + pad),
        top: sy(geometry.back.y + pad),
        width: sx(geometry.back.width - pad * 2),
        height: sy(height),
        overflow: 'hidden',
        color: NIGHT_OWL_WHITE,
        fontFamily: spaceMono,
        fontWeight: 400,
      }}
    >
      <p style={{ margin: 0, fontSize: sy(0.2), fontWeight: 600, color: NIGHT_OWL_ACCENT }}>{bookTitle}</p>
      <p style={{ margin: `${sy(0.16)}px 0 0`, fontSize: sy(0.15), lineHeight: 1.4, opacity: 0.85 }}>{bookSubtitle}</p>
      <p style={{ margin: `${sy(0.2)}px 0 0`, fontSize: sy(0.13), opacity: 0.6 }}>{pageCount} pages &middot; lined &amp; dot grid</p>
    </div>
  );
}
