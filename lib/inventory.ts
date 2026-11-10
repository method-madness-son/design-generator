/**
 * Unified inventory across all product types. Every status is derived from what each pipeline
 * already records, so there is nothing to keep in sync by hand:
 *
 *   Posters     posters/<proj>/<id>/exports/   + etsy.json  + printify/state.json
 *   Stickers    stickers/<proj>/<id>/exports/  + etsy.json  + printify/state.json
 *   Mugs        exports/mugs/<id>-<size>.png   + etsy in design JSON
 *   Tees        exports/tees/<id>-on-*.png     + etsy in design JSON
 *   Wrapping    wrapping/<id>/exports/         + etsy.json  + printify/state.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkListing } from '@/lib/etsyListing';
import { loadAllResolvedMugs } from '@/lib/mugDesigns';
import { savedSizesByPoster } from '@/lib/posterExports';
import { getPosterFile, getPosterIds, getProjects } from '@/lib/posterResolver';
import type { PosterSizeName } from '@/lib/posterSizes';
import { loadState } from '@/lib/printify/posters';
import { loadSticker, stickerExportPath, stickerIds, stickerListing, stickerProjects, stickerType } from '@/lib/stickerDesigns';
import { loadAllResolvedTees } from '@/lib/teeDesigns';
import { getWrapDesignIds, resolveWrap, wrapExportExists, wrapListing } from '@/lib/wrapDesigns';

export type ProductType = 'poster' | 'sticker' | 'mug' | 'tee' | 'wrapping';

export type InventoryStatus = 'published' | 'ready' | 'draft' | 'idea';

export const STATUS_ORDER: InventoryStatus[] = ['published', 'ready', 'draft', 'idea'];

export const STATUS_INFO: Record<InventoryStatus, { label: string; next: string; style: string }> = {
  published: { label: 'Published', next: 'Live on Etsy. Re-run sync with --publish after edits.', style: 'bg-emerald-100 text-emerald-800' },
  ready: { label: 'Ready to publish', next: 'Run sync with --publish.', style: 'bg-violet-100 text-violet-800' },
  draft: { label: 'Draft', next: 'Fill in what the Needs columns flag.', style: 'bg-sky-100 text-sky-800' },
  idea: { label: 'Idea', next: 'Design it, save it, then write the listing.', style: 'bg-neutral-100 text-neutral-600' },
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  poster: 'Poster',
  sticker: 'Sticker',
  mug: 'Mug',
  tee: 'Tee',
  wrapping: 'Wrapping paper',
};

export type InventoryItem = {
  productType: ProductType;
  key: string;
  href: string;
  title: string;
  project: string;
  etsyTitle?: string;
  detail?: string;
  status: InventoryStatus;
  needsMetadata: boolean;
  needsExport: boolean;
  productId?: string;
  publishedAt?: string;
  etsyUrl?: string;
};

type StatusInput = { hasExport: boolean; hasEtsy: boolean; hasErrors: boolean; productId?: string; publishedAt?: string };

// A Printify product already holds its art and copy, so it can be published without local files.
function statusOf(input: StatusInput): Pick<InventoryItem, 'status' | 'needsMetadata' | 'needsExport'> {
  const needsMetadata = !input.hasEtsy || input.hasErrors;
  const needsExport = !input.hasExport;
  if (input.publishedAt) return { status: 'published', needsMetadata: false, needsExport: false };
  if (input.productId) return { status: 'ready', needsMetadata: false, needsExport: false };
  const status = !needsMetadata && !needsExport ? 'ready' : input.hasEtsy || input.hasExport ? 'draft' : 'idea';
  return { status, needsMetadata, needsExport };
}

function posterItems(printify: Record<string, any>): InventoryItem[] {
  return getProjects().flatMap((project) => {
    const saved = savedSizesByPoster(project.id);
    return getPosterIds(project.id).map((posterId): InventoryItem => {
      const poster = getPosterFile(project.id, posterId)!;
      const sizes = saved.get(posterId) ?? [];
      const key = `${project.id}/${posterId}`;
      const synced = printify[key];
      const hasEtsy = !!poster.etsy;
      const listingErrors = hasEtsy || sizes.length > 0 ? checkListing(poster, sizes).errors : [];
      return {
        productType: 'poster',
        key,
        href: `/${project.id}/${posterId}`,
        title: poster.title,
        project: project.title,
        etsyTitle: poster.etsy?.title,
        detail: sizes.length > 0 ? sizes.join(', ') : undefined,
        ...statusOf({ hasExport: sizes.length > 0, hasEtsy, hasErrors: listingErrors.length > 0, productId: synced?.productId, publishedAt: synced?.publishedAt }),
        productId: synced?.productId,
        publishedAt: synced?.publishedAt,
        etsyUrl: synced?.etsyUrl,
      };
    });
  });
}

function stickerItems(printify: Record<string, any>): InventoryItem[] {
  const items: InventoryItem[] = [];
  for (const projectId of stickerProjects()) {
    for (const id of stickerIds(projectId)) {
      const sticker = loadSticker(projectId, id);
      if (!sticker) continue;
      const type = stickerType(projectId, id);
      const saved = fs.existsSync(stickerExportPath(projectId, id, type));
      const listing = stickerListing(projectId, id);
      const stateKey = `stickers/${projectId}/${id}`;
      const synced = printify[stateKey];
      items.push({
        productType: 'sticker',
        key: stateKey,
        href: `/stickers/${projectId}/${id}`,
        title: listing.etsy?.title ?? id,
        project: projectId,
        etsyTitle: listing.etsy?.title,
        detail: type,
        ...statusOf({ hasExport: saved, hasEtsy: !!listing.etsy, hasErrors: false, productId: synced?.productId, publishedAt: synced?.publishedAt }),
        productId: synced?.productId,
        publishedAt: synced?.publishedAt,
        etsyUrl: synced?.etsyUrl,
      });
    }
  }
  return items;
}

function mugItems(): InventoryItem[] {
  const mugsExportDir = path.join(process.cwd(), 'exports', 'mugs');
  return loadAllResolvedMugs().map((mug): InventoryItem => {
    const hasExport = mug.sizes.some((size) => fs.existsSync(path.join(mugsExportDir, `${mug.id}-${size}.png`)));
    const hasEtsy = !!mug.etsy?.title?.trim();
    return {
      productType: 'mug',
      key: `mugs/${mug.id}`,
      href: `/mugs/${mug.id}`,
      title: mug.lines.map((l) => l.text).join(' / ') || mug.id,
      project: mug.projectTitle,
      etsyTitle: mug.etsy?.title,
      detail: mug.sizes.join(', '),
      ...statusOf({ hasExport, hasEtsy, hasErrors: mug.errors.length > 0 }),
    };
  });
}

function teeItems(): InventoryItem[] {
  const teesExportDir = path.join(process.cwd(), 'exports', 'tees');
  return loadAllResolvedTees().map((tee): InventoryItem => {
    const hasExport = fs.existsSync(path.join(teesExportDir, `${tee.id}-on-light.png`)) || fs.existsSync(path.join(teesExportDir, `${tee.id}-on-dark.png`));
    const hasEtsy = !!tee.etsy?.title?.trim();
    return {
      productType: 'tee',
      key: `tees/${tee.id}`,
      href: `/tees/${tee.id}`,
      title: tee.lines.map((l) => l.text).join(' '),
      project: tee.projectTitle,
      etsyTitle: tee.etsy?.title,
      detail: `${tee.placement.label} · ${tee.shirts.length} shirts`,
      ...statusOf({ hasExport, hasEtsy, hasErrors: tee.errors.length > 0 }),
    };
  });
}

function wrappingItems(printify: Record<string, any>): InventoryItem[] {
  return getWrapDesignIds().map((id): InventoryItem => {
    const wrap = resolveWrap(id);
    if (!wrap) return null!;
    const listing = wrapListing(id);
    const exported = wrapExportExists(id);
    const stateKey = `wrapping/${id}`;
    const synced = printify[stateKey];
    return {
      productType: 'wrapping',
      key: stateKey,
      href: `/wrapping/${id}`,
      title: listing.etsy?.title ?? wrap.title,
      project: wrap.source.kind === 'poster' ? wrap.source.projectId : 'Standalone',
      etsyTitle: listing.etsy?.title,
      detail: wrap.sizes.map((s) => s).join(', '),
      ...statusOf({ hasExport: exported, hasEtsy: !!listing.etsy, hasErrors: wrap.errors.length > 0, productId: synced?.productId, publishedAt: synced?.publishedAt }),
      productId: synced?.productId,
      publishedAt: synced?.publishedAt,
      etsyUrl: synced?.etsyUrl,
    };
  }).filter(Boolean);
}

export function getInventory(): InventoryItem[] {
  const state = loadState();
  const printify: Record<string, any> = Object.assign({}, ...Object.values(state.shops).map((shop) => shop.posters));
  return [
    ...posterItems(printify),
    ...stickerItems(printify),
    ...mugItems(),
    ...teeItems(),
    ...wrappingItems(printify),
  ];
}
