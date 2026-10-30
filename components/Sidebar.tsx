import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Shared right-hand column layout used by both the project page (next to the poster grid) and
// the poster detail page (next to the canvas), so the two stay visually consistent.
export function Sidebar({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn('flex w-1/3 shrink-0 flex-col gap-4', className)}>{children}</aside>;
}

// A plain bordered card for a sidebar section that isn't already self-styled (like
// PosterVariantSelects, which brings its own card).
export function SidebarCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border border-neutral-200 bg-white p-4', className)}>{children}</div>;
}
