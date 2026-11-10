import { toBlob, toCanvas } from 'html-to-image';
import JSZip from 'jszip';
import { posterSizePixels, type PosterSizeName } from '@/lib/posterSizes';
import { STICKER_TYPES, type StickerType } from '@/lib/stickerSizes';
import { WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX } from '@/lib/wrapSizes';

// Pinterest's recommended Pin width in px; height follows from the element's own 2:3 aspect ratio.
const PINTEREST_PIN_WIDTH = 1000;

function getNode(elementId: string) {
  const node = document.getElementById(elementId);
  if (!node) throw new Error(`Element #${elementId} not found`);
  return node;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

async function nodeToPngBlob(node: HTMLElement, pixelRatio: number): Promise<Blob> {
  const blob = await toBlob(node, { pixelRatio });
  if (!blob) throw new Error('Failed to render poster to PNG');
  return blob;
}

export async function downloadPinterestPin(elementId: string, filename: string) {
  const node = getNode(elementId);
  const pixelRatio = PINTEREST_PIN_WIDTH / node.offsetWidth;
  const blob = await nodeToPngBlob(node, pixelRatio);
  triggerDownload(blob, `${filename}-pinterest-pin.png`);
}

// Renders the canvas at exactly widthPx × heightPx. html-to-image sizes its output from the
// element's rounded on-screen box, which can land a pixel off the 300 DPI size, so the render is
// redrawn onto a canvas of the exact print dimensions.
async function nodeToExactPng(node: HTMLElement, widthPx: number, heightPx: number): Promise<Blob> {
  const rendered = await toCanvas(node, { pixelRatio: widthPx / node.offsetWidth });
  const exact = document.createElement('canvas');
  exact.width = widthPx;
  exact.height = heightPx;
  const context = exact.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  context.imageSmoothingQuality = 'high';
  context.drawImage(rendered, 0, 0, widthPx, heightPx);
  rendered.width = rendered.height = 0; // release the full-resolution render before encoding
  const blob = await new Promise<Blob | null>((resolve) => exact.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to render poster to PNG');
  return blob;
}

function colorSlug(selection: Record<string, string>): string {
  const bg = selection.backgroundColor;
  if (!bg) return '';
  return bg.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Saves the current preview as this poster's print file for one listing size, into
// posters/<projectId>/<posterId>/exports/ via the local studio API, and returns the poster's saved sizes.
// The Etsy copy is not bundled: the poster JSON holds the single listing for every size.
export async function saveListingExport(
  elementId: string,
  poster: { projectId: string; id: string },
  size: PosterSizeName,
  selection: Record<string, string>,
): Promise<string[]> {
  const { width, height } = posterSizePixels(size);
  const variant = colorSlug(selection);
  const suffix = variant ? `-${variant}` : '';
  const form = new FormData();
  form.append('size', size);
  form.append('selection', JSON.stringify(selection));
  form.append('file', await nodeToExactPng(getNode(elementId), width, height), `${poster.id}-${size}${suffix}.png`);
  const response = await fetch(`/api/poster-exports/${poster.projectId}/${poster.id}`, { method: 'POST', body: form });
  const result = (await response.json()) as { sizes?: string[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
  return result.sizes ?? [];
}

export async function downloadStickerPng(elementId: string, id: string, type: StickerType, selection?: Record<string, string>) {
  const { widthPx, heightPx } = STICKER_TYPES[type];
  const variant = selection ? colorSlug(selection) : '';
  const suffix = variant ? `-${variant}` : '';
  triggerDownload(await nodeToExactPng(getNode(elementId), widthPx, heightPx), `${id}${suffix}-sticker.png`);
}

// Saves the current sticker preview and the choices behind it via the local studio API.
export async function saveStickerExport(elementId: string, projectId: string, id: string, type: StickerType, selection: Record<string, string>): Promise<void> {
  const { widthPx, heightPx } = STICKER_TYPES[type];
  const variant = colorSlug(selection);
  const suffix = variant ? `-${variant}` : '';
  const form = new FormData();
  form.append('type', type);
  form.append('selection', JSON.stringify(selection));
  form.append('file', await nodeToExactPng(getNode(elementId), widthPx, heightPx), `${id}${suffix}.png`);
  const response = await fetch(`/api/sticker-exports/${projectId}/${id}`, { method: 'POST', body: form });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
}

// The Pinterest pin image, zipped with the Pinterest listing copy when the poster has one.
export async function downloadPinterestPack(elementId: string, filename: string, listingText?: string) {
  const node = getNode(elementId);
  const blob = await nodeToPngBlob(node, PINTEREST_PIN_WIDTH / node.offsetWidth);
  const pngFilename = `${filename}-pinterest-pin.png`;
  if (!listingText) return triggerDownload(blob, pngFilename);
  const zip = new JSZip();
  zip.file(pngFilename, blob);
  zip.file('pinterest-listing.txt', listingText);
  triggerDownload(await zip.generateAsync({ type: 'blob' }), `${filename}-pinterest-pack.zip`);
}

async function wrapTileBlob(): Promise<Blob> {
  const node = document.querySelector<HTMLElement>('[data-wrap-art]');
  if (!node) throw new Error('[data-wrap-art] element not found');
  return nodeToExactPng(node, WRAP_TILE_WIDTH_PX, WRAP_TILE_HEIGHT_PX);
}

function wrapColorSuffix(bg?: string, fg?: string): string {
  const parts: string[] = [];
  if (bg) parts.push(bg.replace('#', ''));
  if (fg) parts.push(fg.replace('#', ''));
  return parts.length > 0 ? `-${parts.join('-')}` : '';
}

export async function downloadWrapTilePng(id: string, bg?: string, fg?: string) {
  const suffix = wrapColorSuffix(bg, fg);
  triggerDownload(await wrapTileBlob(), `${id}${suffix}-wrap-tile.png`);
}

export async function saveWrapExport(id: string, bg?: string, fg?: string): Promise<void> {
  const suffix = wrapColorSuffix(bg, fg);
  const form = new FormData();
  form.append('file', await wrapTileBlob(), `${id}${suffix}.png`);
  if (bg) form.append('bg', bg);
  if (fg) form.append('fg', fg);
  const response = await fetch(`/api/wrap-exports/${id}`, { method: 'POST', body: form });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
}
