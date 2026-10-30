import type { ResolvedPoster } from '@/types/poster';

type Etsy = NonNullable<ResolvedPoster['etsy']>;
type Pinterest = NonNullable<ResolvedPoster['pinterest']>;

// Shared with EtsyPromo's copy-all button and the Etsy pack's bundled listing text file, so the
// two always say the same thing.
export function formatEtsyListing(etsy: Etsy): string {
  return [
    `Title: ${etsy.title}`,
    `Description:\n${etsy.description}`,
    `Category: ${etsy.category}`,
    `Tags (${etsy.tags.length}/13): ${etsy.tags.join(', ')}`,
  ].join('\n\n');
}

// Shared with PinterestPromo's copy-all button and the Pinterest pack's bundled listing text file.
export function formatPinterestListing(pinterest: Pinterest): string {
  return [
    `Pin title: ${pinterest.title}`,
    `Pin description: ${pinterest.description}`,
    `Board: ${pinterest.board}`,
    `Alt text: ${pinterest.altText}`,
    `Keywords: ${pinterest.keywords.join(', ')}`,
  ].join('\n\n');
}
