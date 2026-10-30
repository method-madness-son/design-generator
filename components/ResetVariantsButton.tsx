'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const VARIANT_PARAMS = [
  'palette',
  'titleFont',
  'subtitleFont',
  'bodyFont',
  'titleColor',
  'subtitleColor',
  'iconColor',
  'bodyColor',
  'backgroundColor',
  'iconRem',
  'titleRem',
  'subtitleRem',
  'bodyRem',
  'printSize',
  'align',
];

export function ResetVariantsButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasAnySelection = VARIANT_PARAMS.some((param) => searchParams.get(param));

  if (!hasAnySelection) return null;

  return (
    <button
      type="button"
      onClick={() => router.push(pathname, { scroll: false })}
      className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
    >
      Reset
    </button>
  );
}
