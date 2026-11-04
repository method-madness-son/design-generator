/**
 * Deletes a poster or sticker folder: its design, Etsy listing, and exports. Node only.
 *
 * This is local. A Printify product or Etsy listing is never touched, so an item with a product
 * needs `force`, and its entry in printify/state.json goes with it. Files git tracks can be restored
 * until the deletion is committed; print files that were never committed cannot.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadState, saveState } from '@/lib/printify/posters';
import { isSlug, posterDir, POSTER_FILE } from '@/lib/posterResolver';

export type ItemKind = 'poster' | 'sticker';
export type DeleteResult = { deleted: boolean; reason?: 'missing' | 'has-sticker' | 'has-product'; productIds?: string[]; stickerPath?: string };

const stickerDir = (projectId: string, id: string) => path.join(process.cwd(), 'stickers', projectId, id);

export function deleteItem(kind: ItemKind, projectId: string, id: string, force = false): DeleteResult {
  if (!isSlug(projectId) || !isSlug(id)) return { deleted: false, reason: 'missing' };
  const dir = kind === 'poster' ? posterDir(projectId, id) : stickerDir(projectId, id);
  // Only a folder holding the design it should is an item.
  if (!fs.existsSync(path.join(dir, kind === 'poster' ? POSTER_FILE : 'sticker.json'))) return { deleted: false, reason: 'missing' };
  // A sticker is drawn from its poster. When force is set, delete both; otherwise warn.
  const stickerPath = kind === 'poster' ? stickerDir(projectId, id) : null;
  const hasSticker = stickerPath && fs.existsSync(stickerPath);
  if (hasSticker && !force) return { deleted: false, reason: 'has-sticker', stickerPath };

  const keys = [kind === 'poster' ? `${projectId}/${id}` : `stickers/${projectId}/${id}`];
  if (hasSticker) keys.push(`stickers/${projectId}/${id}`);
  const state = loadState();
  const productIds = keys.flatMap((key) =>
    Object.values(state.shops).flatMap((shop) => shop.posters[key]?.productId ?? []),
  );
  if (productIds.length > 0 && !force) return { deleted: false, reason: 'has-product', productIds };

  fs.rmSync(dir, { recursive: true });
  if (hasSticker) fs.rmSync(stickerPath, { recursive: true });
  const changed = keys.some((key) =>
    Object.values(state.shops).some((shop) => { if (shop.posters[key]) { delete shop.posters[key]; return true; } return false; }),
  );
  if (changed) saveState(state);
  return { deleted: true };
}

// The answer for an API route. The studio asks again before sending `force`.
export function deleteResponse(result: DeleteResult): Response {
  if (result.deleted) return Response.json({ deleted: true });
  if (result.reason === 'missing') return Response.json({ error: 'No such item.' }, { status: 404 });
  if (result.reason === 'has-sticker') return Response.json({ hasSticker: true }, { status: 409 });
  return Response.json({ productIds: result.productIds }, { status: 409 });
}
