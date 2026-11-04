'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { type ReactNode, useCallback } from 'react';

export function Tabs({ tabs, children }: { tabs: string[]; children: ReactNode[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = searchParams.get('tab') ?? tabs[0];
  const activeIndex = Math.max(0, tabs.indexOf(current));

  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === tabs[0]) params.delete('tab');
      else params.set('tab', tab);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname, tabs],
  );

  return (
    <>
      <div className="mt-4 flex gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === tabs[activeIndex]
                ? 'border-b-2 border-neutral-900 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6">{children[activeIndex]}</div>
    </>
  );
}
