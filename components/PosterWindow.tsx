import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PosterWindowConfig } from '@/types/poster';

// Pixel-notched corners, as in the tee pipeline's tabs window (components/tees/TabsOpenWindow.tsx).
const PX = 6;
const PIXEL_CORNERS = `polygon(0 ${PX}px, ${PX}px ${PX}px, ${PX}px 0, calc(100% - ${PX}px) 0, calc(100% - ${PX}px) ${PX}px, 100% ${PX}px, 100% calc(100% - ${PX}px), calc(100% - ${PX}px) calc(100% - ${PX}px), calc(100% - ${PX}px) 100%, ${PX}px 100%, ${PX}px calc(100% - ${PX}px), 0 calc(100% - ${PX}px))`;

function Control({ kind }: { kind: NonNullable<PosterWindowConfig['controls']> }) {
  const cross = <path d="M6 6 L18 18 M18 6 L6 18" strokeWidth="3.5" strokeLinecap="square" />;
  const icon = (children: ReactNode, key?: string) => (
    <svg key={key} viewBox="0 0 24 24" className="size-[1em]" fill="none" stroke="currentColor" aria-hidden>
      {children}
    </svg>
  );
  if (kind === 'close') return icon(cross);
  if (kind === 'close-box') return icon(<><rect x="1.5" y="1.5" width="21" height="21" strokeWidth="3" />{cross}</>);
  if (kind === 'alert') {
    return (
      <svg viewBox="0 0 24 24" className="size-[1em] text-[var(--poster-alert,#F5C842)]" fill="currentColor" aria-hidden>
        <rect x="8" y="1" width="8" height="15" />
        <rect x="8" y="18" width="8" height="5" />
      </svg>
    );
  }
  // min-max-close: minimise on the left of the title, maximise + close on the right.
  return <span className="flex gap-[0.3em]">{icon(<rect x="2" y="2" width="20" height="20" strokeWidth="3.5" />, 'max')}{icon(cross, 'close')}</span>;
}

// A retro dialog window around the poster's content: title bar, controls, optional offset shadow.
export function PosterWindow({ config, children }: { config: PosterWindowConfig; children: ReactNode }) {
  const { title, controls = 'close', bar = 'dark', shadow, className, barClassName } = config;
  const minimise = controls === 'min-max-close' && (
    <svg viewBox="0 0 24 24" className="size-[1em]" aria-hidden>
      <rect x="1" y="1" width="22" height="22" fill="var(--poster-background)" />
      <rect x="5" y="16" width="12" height="3" fill="var(--poster-ink)" />
    </svg>
  );
  return (
    <div className="relative w-full">
      {shadow && <div aria-hidden className="absolute inset-0 translate-x-[14px] translate-y-[14px]" style={{ background: shadow, clipPath: PIXEL_CORNERS }} />}
      <div
        className="relative border-[6px] border-[var(--poster-ink)] bg-[var(--poster-background)] text-[var(--poster-ink)]"
        style={{ clipPath: PIXEL_CORNERS } as CSSProperties}
      >
        <div
          className={cn(
            'flex items-center gap-4 px-5 py-2 text-[2.4rem] leading-none',
            bar === 'dark' ? 'bg-[var(--poster-ink)] text-[var(--poster-background)]' : 'border-b-[6px] border-[var(--poster-ink)]',
            barClassName,
          )}
        >
          {minimise}
          <span className="flex-1 text-left [.text-center>&]:text-center">{title}</span>
          <Control kind={controls} />
        </div>
        <div className={cn('flex flex-col', className)}>{children}</div>
      </div>
    </div>
  );
}
