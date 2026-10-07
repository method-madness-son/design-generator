import { CopyAllButton } from '@/components/CopyAllButton';
import type { ResolvedPoster } from '@/types/poster';

type Etsy = NonNullable<ResolvedPoster['etsy']>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-neutral-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-neutral-900">{value}</p>
    </div>
  );
}

export function EtsyPromo({ etsy }: { etsy: Etsy }) {
  const fullText = [
    `Title: ${etsy.title}`,
    `Description:\n${etsy.description}`,
    `Category: ${etsy.category}`,
    `Tags (${etsy.tags.length}/13): ${etsy.tags.join(', ')}`,
  ].join('\n\n');

  return (
    <details className="group rounded-lg border border-neutral-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        Etsy listing
        <span className="text-neutral-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-4 border-t border-neutral-200 px-4 py-4 text-sm">
        <Field label="Title" value={etsy.title} />
        <Field label="Description" value={etsy.description} />
        <Field label="Category" value={etsy.category} />
        <Field label={`Tags (${etsy.tags.length}/13)`} value={etsy.tags.join(', ')} />
        <CopyAllButton text={fullText} />
      </div>
    </details>
  );
}
