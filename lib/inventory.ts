/**
 * Poster inventory for the /inventory page. Every status is derived from what the pipeline already
 * records, so there is nothing to keep in sync by hand:
 *
 *   saved sizes     posters/<projectId>/exports/   (studio "Save for Etsy listing")
 *   listing check   lib/etsyListing.ts             (the poster's etsy block)
 *   Printify state  printify/state.json            (written by `npm run printify:sync`)
 */
import { checkListing } from '@/lib/etsyListing';
import { savedSizesByPoster } from '@/lib/posterExports';
import { getPosterFile, getPosterIds, getProjects } from '@/lib/posterResolver';
import type { PosterSizeName } from '@/lib/posterSizes';
import { loadState } from '@/lib/printify/posters';

export type InventoryStatus = 'listed' | 'draft' | 'ready' | 'needs-listing' | 'needs-export' | 'idea';

export const STATUS_INFO: Record<InventoryStatus, { label: string; next: string; stocked: boolean }> = {
  listed: { label: 'Live on Etsy', next: 'Published. Re-run sync with --publish after edits.', stocked: true },
  draft: { label: 'Printify draft', next: 'Run printify:sync with --publish to put it on Etsy.', stocked: true },
  ready: { label: 'Ready to upload', next: 'Run printify:sync to create the product.', stocked: true },
  'needs-listing': { label: 'Saved · needs Etsy copy', next: 'Run the etsy-listing-researcher agent.', stocked: false },
  'needs-export': { label: 'Copy written · not saved', next: 'Open it in the studio and Save for Etsy listing.', stocked: false },
  idea: { label: 'Idea', next: 'Design it, save it, then write the listing.', stocked: false },
};

export type InventoryItem = {
  projectId: string;
  projectTitle: string;
  posterId: string;
  posterTitle: string;
  etsyTitle?: string;
  sizes: PosterSizeName[];
  listingErrors: string[];
  status: InventoryStatus;
  productId?: string;
  publishedAt?: string;
};

function statusOf(item: Omit<InventoryItem, 'status'>, hasEtsy: boolean): InventoryStatus {
  if (item.publishedAt) return 'listed';
  if (item.productId) return 'draft';
  if (item.sizes.length > 0) return item.listingErrors.length === 0 ? 'ready' : 'needs-listing';
  return hasEtsy ? 'needs-export' : 'idea';
}

export function getInventory(): InventoryItem[] {
  // Products from every shop in the state file, keyed "<projectId>/<posterId>".
  const printify = Object.assign({}, ...Object.values(loadState().shops).map((shop) => shop.posters));
  return getProjects().flatMap((project) => {
    const saved = savedSizesByPoster(project.id);
    return getPosterIds(project.id).map((posterId) => {
      const poster = getPosterFile(project.id, posterId)!;
      const sizes = saved.get(posterId) ?? [];
      const synced = printify[`${project.id}/${posterId}`];
      const item = {
        projectId: project.id,
        projectTitle: project.title,
        posterId,
        posterTitle: poster.title,
        etsyTitle: poster.etsy?.title,
        sizes,
        listingErrors: poster.etsy || sizes.length > 0 ? checkListing(poster, sizes).errors : [],
        productId: synced?.productId,
        publishedAt: synced?.publishedAt,
      };
      return { ...item, status: statusOf(item, !!poster.etsy) };
    });
  });
}
