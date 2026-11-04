import { STICKER_TYPES, stickerMinTextPx, stickerSafePx, type StickerType } from '@/lib/stickerSizes';

export type StickerLayoutReport = { errors: string[]; warnings: string[] };

// What a print file can't show by itself: art too near the cut line, split words, text too small.
// Runs in the browser, for the studio's preview and for `npm run sticker-art`.
export function stickerLayoutProblems(canvas: HTMLElement, type: StickerType): StickerLayoutReport {
  const box = canvas.getBoundingClientRect();
  // Zooming scales what the browser measures, but not the print file.
  const safe = stickerSafePx(type) * (box.width / canvas.offsetWidth);
  const errors: string[] = [];
  const warnings: string[] = [];
  const crossesMargin = (rect: DOMRect) =>
    rect.width > 0 && (rect.top < box.top + safe || rect.bottom > box.bottom - safe || rect.left < box.left + safe || rect.right > box.right - safe);

  for (const graphic of canvas.querySelectorAll('svg')) {
    if (crossesMargin(graphic.getBoundingClientRect())) errors.push('A graphic is too close to the edge.');
  }
  // A window's frame gets cut off just like its contents.
  for (const frame of canvas.querySelectorAll(':scope > div')) {
    const edge = frame.getBoundingClientRect();
    if (crossesMargin(edge)) errors.push('The window is too close to the edge.');
    // A floating graphic can spill past a panel, which the cut would slice through.
    for (const graphic of frame.querySelectorAll('svg')) {
      const rect = graphic.getBoundingClientRect();
      if (rect.top < edge.top || rect.bottom > edge.bottom || rect.left < edge.left || rect.right > edge.right) errors.push('A graphic runs past the panel.');
    }
  }
  const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.data.trim()) continue;
    const label = node.data.trim().slice(0, 30);
    const range = document.createRange();
    range.selectNodeContents(node);
    if (crossesMargin(range.getBoundingClientRect())) errors.push(`"${label}" is too close to the edge.`);
    const fontPx = Number.parseFloat(getComputedStyle(node.parentElement!).fontSize);
    if (fontPx < stickerMinTextPx(type)) warnings.push(`"${label}" may be too small to read at ${STICKER_TYPES[type].widthIn}" wide.`);
    for (const match of node.data.matchAll(/\S+/g)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const lines = new Set([...range.getClientRects()].map((part) => Math.round(part.top)));
      if (lines.size > 1) warnings.push(`"${match[0]}" breaks across lines.`);
    }
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}
