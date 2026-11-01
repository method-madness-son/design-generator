import type { CSSProperties } from 'react';
import { Fractal } from '@/components/Fractal';
import { IconRenderer } from '@/components/IconRenderer';
import { PosterWindow } from '@/components/PosterWindow';
import { cn } from '@/lib/utils';
import type { ResolvedPoster } from '@/types/poster';

// On-screen width of the canvas in px. Export scales this up to the print size.
export const CANVAS_WIDTH = 640;

export function PosterCanvas({ poster, id }: { poster: ResolvedPoster; id?: string }) {
  const paletteVars = Object.fromEntries(
    Object.entries(poster.colorPalette).map(([key, value]) => [`--poster-${key}`, value]),
  );

  // Inline style beats the className's text-[...] color regardless of specificity, so this is
  // what actually lets an explicit iconColor override the icon's/graphic's own default color.
  const colorStyle = poster.iconColor ? { color: poster.iconColor } : undefined;
  const icon = poster.icon && (
    <IconRenderer
      name={poster.icon.name}
      sizeRem={poster.iconRem}
      className={cn('shrink-0', poster.icon.className)}
      style={colorStyle}
    />
  );
  const graphic = poster.graphic && (
    <Fractal
      type={poster.graphic.type}
      sizeRem={poster.iconRem}
      className={cn('shrink-0', poster.graphic.className)}
      style={colorStyle}
    />
  );
  // graphic replaces icon when both are set; position follows whichever one is active.
  const visual = graphic ?? icon;
  const visualPosition = poster.graphic?.position ?? poster.icon?.position;

  const content = (
    <>
      {visualPosition === 'top' && visual}
      {/* break-words/min-w-0: a long run with no spaces (e.g. "console.log('here');") can't wrap
          at a space, so without this it overflows the canvas instead of shrinking to fit. */}
      <h1
        className={cn('min-w-0 w-full break-words', poster.titleClasses)}
        style={{ fontFamily: poster.titleFont, fontSize: `${poster.titleRem}rem`, color: poster.titleColor }}
      >
        {poster.title}
      </h1>
      {/* mt-3 on top of the container's own gap, specifically widening the title-subtitle gap
          without touching the icon-title or subtitle-body spacing. */}
      <p
        className={cn('mt-3 min-w-0 w-full whitespace-pre-line break-words', poster.subtitleClasses)}
        style={{ fontFamily: poster.subtitleFont, fontSize: `${poster.subtitleRem}rem`, color: poster.subtitleColor }}
      >
        {poster.subtitle}
      </p>
      {poster.body.length > 0 && (
        <ul
          className={cn('min-w-0 w-full', poster.bodyClasses)}
          style={{ fontFamily: poster.bodyFont, fontSize: `${poster.bodyRem}rem`, color: poster.bodyColor }}
        >
          {poster.body.map((line) => (
            <li key={line} className="whitespace-pre-line break-words">
              {line}
            </li>
          ))}
        </ul>
      )}
      {visualPosition === 'bottom' && visual}
    </>
  );

  return (
    <div
      id={id}
      // p-16 is the safety margin for bleed/frame-mat tolerance; containerClasses may widen it.
      className={cn('flex shrink-0 flex-col overflow-hidden p-16', poster.bgClass, poster.containerClasses)}
      style={
        {
          width: CANVAS_WIDTH,
          aspectRatio: poster.aspectRatio.replace('/', ' / '),
          fontFamily: poster.subtitleFont,
          ...paletteVars,
          backgroundColor: poster.backgroundColor,
        } as CSSProperties
      }
    >
      {poster.window ? <PosterWindow config={poster.window}>{content}</PosterWindow> : content}
    </div>
  );
}
