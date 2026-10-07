import { toPng } from 'html-to-image';

const PRINT_DPI = 300;

function getCanvas(elementId: string) {
  const node = document.getElementById(elementId);
  if (!node) throw new Error(`Element #${elementId} not found`);
  return node;
}

async function downloadNode(node: HTMLElement, filename: string, printWidthInches: number) {
  // Render at whatever multiple of the on-screen size yields 300 pixels per printed inch.
  const pixelRatio = (printWidthInches * PRINT_DPI) / node.offsetWidth;
  const dataUrl = await toPng(node, { pixelRatio });

  const link = document.createElement('a');
  link.download = `${filename}-300dpi.png`;
  link.href = dataUrl;
  link.click();
}

export async function downloadCanvasAs300DPI(elementId: string, filename: string, printWidthInches: number) {
  await downloadNode(getCanvas(elementId), filename, printWidthInches);
}

// Downloads one PNG per palette by swapping the canvas's --poster-* variables, then restores them.
export async function downloadAllPalettes(
  elementId: string,
  filename: string,
  printWidthInches: number,
  palettes: Record<string, Record<string, string>>,
) {
  const node = getCanvas(elementId);
  const originalStyle = node.getAttribute('style');
  try {
    for (const [name, colors] of Object.entries(palettes)) {
      for (const [key, color] of Object.entries(colors)) {
        node.style.setProperty(`--poster-${key}`, color);
      }
      await downloadNode(node, `${filename}-${name}`, printWidthInches);
    }
  } finally {
    if (originalStyle === null) node.removeAttribute('style');
    else node.setAttribute('style', originalStyle);
  }
}
