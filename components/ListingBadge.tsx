import { cn } from '@/lib/utils';

type Status = 'published' | 'ready' | 'draft' | 'idea';

// Mirrors STATUS_INFO in lib/inventory.ts, which can't be imported here because it reads the filesystem.
const STYLE: Record<Status, string> = {
  published: 'bg-emerald-100 text-emerald-800',
  ready: 'bg-violet-100 text-violet-800',
  draft: 'bg-sky-100 text-sky-800',
  idea: 'bg-neutral-100 text-neutral-600',
};

const LABEL: Record<Status, string> = {
  published: 'Published',
  ready: 'Ready to publish',
  draft: 'Draft',
  idea: 'Idea',
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
  const resolved: Status = status ?? (sizes.length > 0 && hasEtsy ? 'ready' : sizes.length > 0 || hasEtsy ? 'draft' : 'idea');
  const missing = resolved === 'draft' ? (hasEtsy ? 'needs export' : sizes.length > 0 ? 'needs metadata' : null) : null;
  const missingSizes = listedSizes ? sizes.filter((s) => !listedSizes.includes(s)) : [];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', STYLE[resolved])}>
        {LABEL[resolved]}
        {listedSizes && listedSizes.length > 0 && <span className="ml-1 opacity-70">· {listedSizes.join(', ')}</span>}
      </span>
      {missing && (
        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{missing}</span>
      )}
      {missingSizes.length > 0 && (
        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          missing {missingSizes.join(', ')}
        </span>
      )}
    </span>
  );
}
