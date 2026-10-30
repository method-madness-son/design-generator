'use client';

import { useState, type ReactNode } from 'react';
import { EtsyPromoContent } from '@/components/EtsyPromo';
import { PinterestPromoContent } from '@/components/PinterestPromo';
import { PinterestTeaser } from '@/components/PinterestTeaser';
import { PosterVariantSelects } from '@/components/PosterVariantSelects';
import { ResetVariantsButton } from '@/components/ResetVariantsButton';
import { cn } from '@/lib/utils';
import type { ProjectConfig, ResolvedPoster } from '@/types/poster';

type Props = {
  nav: ReactNode;
  project: ProjectConfig;
  poster: ResolvedPoster;
  query: {
    palette: string;
    titleFont: string;
    subtitleFont: string;
    bodyFont: string;
    titleColor: string;
    subtitleColor: string;
    iconColor: string;
    bodyColor: string;
    backgroundColor: string;
    iconRem: string;
    titleRem: string;
    subtitleRem: string;
    bodyRem: string;
    printSize: string;
    align: string;
  };
  exportFilename: string;
};

export function PosterControlsPanel({ nav, project, poster, query, exportFilename }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'pinterest' | 'etsy'>('controls');

  return (
    <>
      {/* Hidden off-screen Pinterest teaser so ExportButton can find the DOM element when not on Pinterest tab */}
      {poster.pinterest && activeTab !== 'pinterest' && (
        <div aria-hidden className="pointer-events-none fixed top-0 overflow-hidden" style={{ left: '-99999px' }}>
          <PinterestTeaser poster={poster} filename={exportFilename} />
        </div>
      )}

      {nav}
      <div className="mt-1 rounded-lg border border-neutral-200 bg-white shadow-sm">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (isOpen && activeTab === 'controls') {
                  setIsOpen(false);
                } else {
                  setActiveTab('controls');
                  setIsOpen(true);
                }
              }}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                isOpen && activeTab === 'controls'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              Customize
            </button>

            {poster.pinterest && (
              <button
                type="button"
                onClick={() => {
                  if (isOpen && activeTab === 'pinterest') {
                    setIsOpen(false);
                  } else {
                    setActiveTab('pinterest');
                    setIsOpen(true);
                  }
                }}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  isOpen && activeTab === 'pinterest'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                Pinterest Promo
              </button>
            )}

            {poster.etsy && (
              <button
                type="button"
                onClick={() => {
                  if (isOpen && activeTab === 'etsy') {
                    setIsOpen(false);
                  } else {
                    setActiveTab('etsy');
                    setIsOpen(true);
                  }
                }}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  isOpen && activeTab === 'etsy'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                Etsy Listing
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ResetVariantsButton />
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
              className="flex size-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <svg
                className={cn('size-4 transition-transform duration-150', isOpen && 'rotate-180')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="mt-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 shadow-sm">
          {activeTab === 'controls' && <PosterVariantSelects project={project} poster={poster} query={query} compact />}
          {activeTab === 'pinterest' && poster.pinterest && (
            <PinterestPromoContent poster={poster} pinterest={poster.pinterest} filename={exportFilename} />
          )}
          {activeTab === 'etsy' && poster.etsy && <EtsyPromoContent etsy={poster.etsy} />}
        </div>
      )}
    </>
  );
}

