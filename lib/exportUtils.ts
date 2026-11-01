import { toBlob, toCanvas } from 'html-to-image';
import JSZip from 'jszip';

const PRINT_DPI = 300;
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

// Downloads the PNG alone when there's no listing copy to bundle; otherwise zips the PNG together
// with a text file of the listing copy so the two always travel together.
async function downloadPngOrPack(pngBlob: Blob, pngFilename: string, listingText: string | undefined, listingFilename: string, zipFilename: string) {
  if (!listingText) {
    triggerDownload(pngBlob, pngFilename);
    return;
  }
  const zip = new JSZip();
  zip.file(pngFilename, pngBlob);
  zip.file(listingFilename, listingText);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, zipFilename);
}

export async function downloadCanvasAs300DPI(elementId: string, filename: string, printWidthInches: number) {
  const node = getNode(elementId);
  // Render at whatever multiple of the on-screen size yields 300 pixels per printed inch.
  const pixelRatio = (printWidthInches * PRINT_DPI) / node.offsetWidth;
  const blob = await nodeToPngBlob(node, pixelRatio);
  triggerDownload(blob, `${filename}-300dpi.png`);
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
  const blob = await new Promise<Blob | null>((resolve) => exact.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to render poster to PNG');
  return blob;
}

// Saves the current preview as this poster's print file for one listing size, into
// posters/<projectId>/exports/ via the local studio API. The Etsy copy is not bundled: the poster
// JSON holds the single listing for every size.
export async function saveListingExport(
  elementId: string,
  target: { projectId: string; posterId: string; size: string; widthPx: number; heightPx: number },
  selection: Record<string, string>,
): Promise<{ sizes: string[] }> {
  const blob = await nodeToExactPng(getNode(elementId), target.widthPx, target.heightPx);
  const form = new FormData();
  form.append('size', target.size);
  form.append('selection', JSON.stringify(selection));
  form.append('file', blob, `${target.posterId}-${target.size}.png`);
  const response = await fetch(`/api/poster-exports/${target.projectId}/${target.posterId}`, { method: 'POST', body: form });
  const result = (await response.json()) as { sizes?: string[]; error?: string };
  if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status})`);
  return { sizes: result.sizes ?? [] };
}

// The Pinterest pin image, plus the Pinterest listing copy as a text file when the poster has one.
export async function downloadPinterestPack(elementId: string, filename: string, listingText?: string) {
  const node = getNode(elementId);
  const pixelRatio = PINTEREST_PIN_WIDTH / node.offsetWidth;
  const blob = await nodeToPngBlob(node, pixelRatio);
  await downloadPngOrPack(
    blob,
    `${filename}-pinterest-pin.png`,
    listingText,
    'pinterest-listing.txt',
    `${filename}-pinterest-pack.zip`,
  );
}
