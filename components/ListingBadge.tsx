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

export function ListingBadge({ sizes, hasEtsy, status }: { sizes: string[]; hasEtsy: boolean; status?: Status }) {
  const resolved: Status = status ?? (sizes.length === 0 ? 'not-saved' : hasEtsy ? 'ready' : 'needs-listing');
  if (resolved === 'not-saved') return <p className="text-xs text-neutral-400">{LABEL[resolved]}</p>;
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', STYLE[resolved])}>
      {LABEL[resolved]}
    </span>
  );
}
