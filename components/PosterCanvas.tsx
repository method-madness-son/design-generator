import type { CSSProperties } from 'react';
import { Fractal } from '@/components/Fractal';
import { IconRenderer } from '@/components/IconRenderer';
import { cn } from '@/lib/utils';
import type { ResolvedPoster } from '@/types/poster';

// On-screen width of the canvas in px. Export scales this up to the print size.
export const CANVAS_WIDTH = 480;

export function PosterCanvas({ poster, id }: { poster: ResolvedPoster; id?: string }) {
  const paletteVars = Object.fromEntries(
    Object.entries(poster.colorPalette).map(([key, value]) => [`--poster-${key}`, value]),
  );

  const icon = poster.icon && (
    <IconRenderer
      name={poster.icon.name}
      sizeRem={poster.iconRem}
      className={cn('shrink-0', poster.icon.className)}
    />
  );
  const graphic = poster.graphic && (
    <Fractal type={poster.graphic.type} sizeRem={poster.iconRem} className={cn('shrink-0', poster.graphic.className)} />
  );
  // graphic replaces icon when both are set; position follows whichever one is active.
  const visual = graphic ?? icon;
  const visualPosition = poster.graphic?.position ?? poster.icon?.position;

  return (
    <div
      id={id}
      // p-12 is the safety margin for the print cut tolerance; containerClasses may widen it.
      className={cn('flex shrink-0 flex-col overflow-hidden p-12', poster.bgClass, poster.containerClasses)}
      style={
        {
          width: CANVAS_WIDTH,
          aspectRatio: poster.aspectRatio.replace('/', ' / '),
          fontFamily: poster.bodyFont,
          ...paletteVars,
        } as CSSProperties
      }
    >
      {visualPosition === 'top' && visual}
      <h1 className={poster.titleClasses} style={{ fontFamily: poster.titleFont, fontSize: `${poster.titleRem}rem` }}>
        {poster.title}
      </h1>
      <p className={poster.subtitleClasses} style={{ fontSize: `${poster.subtitleRem}rem` }}>
        {poster.subtitle}
      </p>
      {poster.body.length > 0 && (
        <ul className={poster.bodyClasses}>
          {poster.body.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {visualPosition === 'bottom' && visual}
    </div>
  );
}
