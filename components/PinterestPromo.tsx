import { CopyAllButton } from '@/components/CopyAllButton';
import type { ResolvedPoster } from '@/types/poster';

type Pinterest = NonNullable<ResolvedPoster['pinterest']>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-neutral-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-neutral-900">{value}</p>
    </div>
  );
}

export function PinterestPromo({ pinterest }: { pinterest: Pinterest }) {
  const fullText = [
    `Pin title: ${pinterest.title}`,
    `Pin description: ${pinterest.description}`,
    `Board: ${pinterest.board}`,
    `Alt text: ${pinterest.altText}`,
    `Keywords: ${pinterest.keywords.join(', ')}`,
  ].join('\n\n');

  return (
    // <details> gives the expand/collapse behavior for free, no client JS needed to toggle it.
    <details className="group rounded-lg border border-neutral-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        Pinterest promo
        <span className="text-neutral-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-4 border-t border-neutral-200 px-4 py-4 text-sm">
        <Field label="Pin title" value={pinterest.title} />
        <Field label="Pin description" value={pinterest.description} />
        <Field label="Board" value={pinterest.board} />
        <Field label="Alt text" value={pinterest.altText} />
        <Field label="Keywords" value={pinterest.keywords.join(', ')} />
        <CopyAllButton text={fullText} />
      </div>
    </details>
  );
}
