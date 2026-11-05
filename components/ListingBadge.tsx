import { cn } from '@/lib/utils';

type Status = 'listed' | 'draft' | 'staged' | 'ready' | 'needs-listing' | 'not-saved';

const STYLE: Record<Status, string> = {
  listed: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-sky-100 text-sky-800',
  staged: 'bg-violet-200 text-violet-900',
  ready: 'bg-violet-100 text-violet-800',
  'needs-listing': 'bg-amber-100 text-amber-800',
  'not-saved': '',
};

const LABEL: Record<Status, string> = {
  listed: 'Live on Etsy',
  draft: 'Printify draft',
  staged: 'Staged',
  ready: 'Ready',
  'needs-listing': 'Needs listing',
  'not-saved': 'Not saved for listing',
};

export function ListingBadge({
  sizes,
  hasEtsy,
  status,
  listedSizes,
}: {
  sizes: string[];
  hasEtsy: boolean;
  status?: Status;
  listedSizes?: string[];
}) {
  const resolved: Status = status ?? (sizes.length === 0 ? 'not-saved' : hasEtsy ? 'ready' : 'needs-listing');
  if (resolved === 'not-saved') return <p className="text-xs text-neutral-400">{LABEL[resolved]}</p>;

  const showSizes = listedSizes && (resolved === 'listed' || resolved === 'draft');
  const missingSizes = showSizes ? sizes.filter((s) => !listedSizes.includes(s)) : [];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', STYLE[resolved])}>
        {LABEL[resolved]}
        {showSizes && listedSizes.length > 0 && (
          <span className="ml-1 opacity-70">· {listedSizes.join(', ')}</span>
        )}
      </span>
      {missingSizes.length > 0 && (
        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          missing {missingSizes.join(', ')}
        </span>
      )}
    </span>
  );
}
