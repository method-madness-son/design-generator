import { toBlob } from 'html-to-image';
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

// The currently previewed high-res print PNG and the Etsy listing copy when the poster has one.
export async function downloadEtsyPack(
  elementId: string,
  filename: string,
  printWidthInches: number,
  listingText?: string,
) {
  const node = getNode(elementId);
  const pixelRatio = (printWidthInches * PRINT_DPI) / node.offsetWidth;
  const blob = await nodeToPngBlob(node, pixelRatio);
  await downloadPngOrPack(
    blob,
    `${filename}-300dpi.png`,
    listingText,
    'etsy-listing.txt',
    `${filename}-etsy-pack.zip`,
  );
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
