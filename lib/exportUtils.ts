import { toBlob, toCanvas } from 'html-to-image';
import JSZip from 'jszip';
import { posterSizePixels, type PosterSizeName } from '@/lib/posterSizes';

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

// Saves the current preview as this poster's print file for one listing size, into
// posters/<projectId>/exports/ via the local studio API, and returns the poster's saved sizes.
// The Etsy copy is not bundled: the poster JSON holds the single listing for every size.
export async function saveListingExport(
  elementId: string,
  poster: { projectId: string; id: string },
  size: PosterSizeName,
  selection: Record<string, string>,
): Promise<string[]> {
  const { width, height } = posterSizePixels(size);
  const form = new FormData();
  form.append('size', size);
  form.append('selection', JSON.stringify(selection));
  form.append('file', await nodeToExactPng(getNode(elementId), width, height), `${poster.id}-${size}.png`);
  const response = await fetch(`/api/poster-exports/${poster.projectId}/${poster.id}`, { method: 'POST', body: form });
  const result = (await response.json()) as { sizes?: string[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
  return result.sizes ?? [];
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
