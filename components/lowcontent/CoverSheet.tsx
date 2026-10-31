import { contrastRatio } from '@/lib/lowcontent/theme';
import {
  COVER_SAFE_INSET_IN,
  inchesToPixels,
  ptToPx,
  scaleX,
  scaleY,
  type CoverGeometry,
} from '@/lib/lowcontent/specs';
import type { ResolvedInteriorTheme } from '@/types/lowcontent';

type CoverProps = {
  title: string;
  subtitle: string;
  description: string;
  pageCount: number;
  geometry: CoverGeometry;
  theme: ResolvedInteriorTheme;
  mode: 'print' | 'preview';
  /** `wrap` is the full cover. `front` is the trimmed front panel for the listing image. */
  variant: 'wrap' | 'front';
};

export function CoverSheet({ title, subtitle, description, pageCount, geometry, theme, mode, variant }: CoverProps) {
  if (variant === 'front') {
    const widthPx = inchesToPixels(geometry.trimWidthIn);
    const heightPx = inchesToPixels(geometry.trimHeightIn);
    return (
      <div data-lc-front-ready="1" style={{ position: 'relative', width: widthPx, height: heightPx }}>
        <FrontPanel
          title={title}
          subtitle={subtitle}
          theme={theme}
          widthPx={widthPx}
          heightPx={heightPx}
          widthIn={geometry.trimWidthIn}
          heightIn={geometry.trimHeightIn}
        />
      </div>
    );
  }

  const sx = (inches: number) => scaleX(geometry.fullWidthIn, geometry.fullWidthPx, inches);
  const sy = (inches: number) => scaleY(geometry.fullHeightIn, geometry.fullHeightPx, inches);
  const guide = Math.max(ptToPx(geometry.fullHeightIn, geometry.fullHeightPx, 1.25), 2);

  return (
    <article
      data-lc-cover={mode === 'print' ? '1' : undefined}
      style={{
        position: 'relative',
        width: geometry.fullWidthPx,
        height: geometry.fullHeightPx,
        background: theme.paper,
        overflow: 'hidden',
        color: theme.ink,
        fontFamily: theme.supportingFontCss,
      }}
    >
      <FrontPanel
        title={title}
        subtitle={subtitle}
        theme={theme}
        widthPx={sx(geometry.front.width)}
        heightPx={sy(geometry.front.height)}
        widthIn={geometry.front.width}
        heightIn={geometry.front.height}
        offsetX={sx(geometry.front.x)}
        offsetY={sy(geometry.front.y)}
      />
      <BackPanel
        title={title}
        description={description}
        pageCount={pageCount}
        geometry={geometry}
        theme={theme}
        sx={sx}
        sy={sy}
      />
      {geometry.allowSpineText ? (
        <SpineTitle title={title} geometry={geometry} theme={theme} sx={sx} sy={sy} />
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
          color: '#b91c1c',
          fontSize: sy(0.14),
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: sy(0.06),
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {mode === 'preview' ? 'Barcode keep-out' : null}
      </div>
      {mode === 'preview' ? <WrapGuides geometry={geometry} sx={sx} sy={sy} guide={guide} /> : null}
    </article>
  );
}

function FrontPanel({
  title,
  subtitle,
  theme,
  widthPx,
  heightPx,
  widthIn,
  heightIn,
  offsetX = 0,
  offsetY = 0,
}: {
  title: string;
  subtitle: string;
  theme: ResolvedInteriorTheme;
  widthPx: number;
  heightPx: number;
  widthIn: number;
  heightIn: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const sx = (inches: number) => scaleX(widthIn, widthPx, inches);
  const sy = (inches: number) => scaleY(heightIn, heightPx, inches);
  const pad = COVER_SAFE_INSET_IN;
  const onAccent = (contrastRatio('#ffffff', theme.accent) ?? 0) >= 3 ? '#ffffff' : theme.ink;
  return (
    <div
      data-lc-front="1"
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        width: widthPx,
        height: heightPx,
        background: theme.paper,
        color: theme.ink,
        fontFamily: theme.supportingFontCss,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: sx(pad),
          right: sx(pad),
          top: sy(pad),
          bottom: sy(pad),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ background: theme.accent, color: onAccent, padding: `${sy(0.28)}px ${sx(0.22)}px` }}>
          <h1
            style={{
              margin: 0,
              fontFamily: theme.displayFontCss,
              fontSize: sy(0.62),
              lineHeight: 0.95,
              fontWeight: 400,
            }}
          >
            {title}
          </h1>
        </div>
        <p style={{ margin: `${sy(0.28)}px 0 0`, fontSize: sy(0.22), lineHeight: 1.3, maxWidth: '95%' }}>{subtitle}</p>
        <p style={{ marginTop: 'auto', marginBottom: 0, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: sy(0.14) }}>
          Low-content paperback
        </p>
      </div>
    </div>
  );
}

function BackPanel({
  title,
  description,
  pageCount,
  geometry,
  theme,
  sx,
  sy,
}: {
  title: string;
  description: string;
  pageCount: number;
  geometry: CoverGeometry;
  theme: ResolvedInteriorTheme;
  sx: (inches: number) => number;
  sy: (inches: number) => number;
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
        color: theme.ink,
        fontFamily: theme.supportingFontCss,
      }}
    >
      <p style={{ margin: 0, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: sy(0.14) }}>{title}</p>
      <p style={{ margin: `${sy(0.18)}px 0 0`, fontSize: sy(0.16), lineHeight: 1.35 }}>{description}</p>
      <p style={{ margin: `${sy(0.22)}px 0 0`, fontSize: sy(0.13) }}>{pageCount} write-in pages</p>
    </div>
  );
}

function SpineTitle({
  title,
  geometry,
  theme,
  sx,
  sy,
}: {
  title: string;
  geometry: CoverGeometry;
  theme: ResolvedInteriorTheme;
  sx: (inches: number) => number;
  sy: (inches: number) => number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: sx(geometry.spine.x + geometry.spineMarginIn),
        top: sy(geometry.spine.y + geometry.safeInsetIn),
        width: sx(Math.max(0, geometry.spine.width - geometry.spineMarginIn * 2)),
        height: sy(geometry.spine.height - geometry.safeInsetIn * 2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        fontFamily: theme.displayFontCss,
        fontSize: sy(Math.min(0.14, Math.max(0.08, (geometry.spine.width - geometry.spineMarginIn * 2) * 0.72))),
        letterSpacing: '0.08em',
        overflow: 'hidden',
        color: theme.ink,
      }}
    >
      {title}
    </div>
  );
}

function WrapGuides({
  geometry,
  sx,
  sy,
  guide,
}: {
  geometry: CoverGeometry;
  sx: (inches: number) => number;
  sy: (inches: number) => number;
  guide: number;
}) {
  const trim = {
    left: sx(geometry.bleedIn),
    top: sy(geometry.bleedIn),
    width: sx(geometry.fullWidthIn - geometry.bleedIn * 2),
    height: sy(geometry.fullHeightIn - geometry.bleedIn * 2),
  };
  return (
    <>
      <div style={{ position: 'absolute', ...trim, outline: `${guide}px solid rgba(20, 20, 20, 0.55)`, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          left: sx(geometry.spine.x),
          top: sy(geometry.spine.y),
          width: sx(geometry.spine.width),
          height: sy(geometry.spine.height),
          outline: `${guide}px solid rgba(37, 99, 235, 0.8)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: sx(geometry.front.x + geometry.safeInsetIn),
          top: sy(geometry.front.y + geometry.safeInsetIn),
          width: sx(geometry.front.width - geometry.safeInsetIn * 2),
          height: sy(geometry.front.height - geometry.safeInsetIn * 2),
          outline: `${guide}px dashed rgba(185, 28, 28, 0.8)`,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
