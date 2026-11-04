'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { isWideSticker, STICKER_TYPES, type StickerType } from '@/lib/stickerSizes';
import { cn } from '@/lib/utils';

// Sizes and alignment chosen for one shape don't carry over to another.
const SHAPE_PARAMS = ['titleRem', 'subtitleRem', 'bodyRem', 'iconRem', 'align'];

export function StickerTypePicker({ value }: { value: StickerType }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setType(type: StickerType) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('type', type);
    if (type !== value && (isWideSticker(type) || isWideSticker(value))) for (const param of SHAPE_PARAMS) next.delete(param);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div role="group" aria-label="Sticker type" className="flex h-7 overflow-hidden rounded-md border border-neutral-300 bg-white shadow-sm">
      {(Object.entries(STICKER_TYPES) as [StickerType, (typeof STICKER_TYPES)[StickerType]][]).map(([type, { label, sizes }]) => (
        <button
          key={type}
          type="button"
          title={sizes}
          aria-pressed={value === type}
          onClick={() => setType(type)}
          className={cn(
            'px-2.5 text-xs font-medium transition-colors',
            value === type ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
