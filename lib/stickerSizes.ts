// Printify's Kiss-Cut (blueprint 400), Square (384) and Bumper (598) stickers. Variants and prices live
// in printify/stickers.json. Each type's sizes share one shape, so one file serves them all, built for
// the largest size on sale at that shape.
// PosterCanvas's CANVAS_WIDTH. Kept here so the export script doesn't load React components.
export const STICKER_CANVAS_PX = 640;

export const STICKER_TYPES = {
  'kiss-cut': {
    label: 'Kiss-cut',
    sizes: '3″ and 4″',
    widthIn: 3,
    widthPx: 1113,
    heightPx: 1113,
    aspectRatio: '1/1',
    padding: 'p-16',
    note: 'Peels off a backing sheet. The cut line shown is an estimate until a Printify mockup confirms it.',
  },
  square: { label: 'Square', sizes: '3″ and 4″', widthIn: 3, widthPx: 1113, heightPx: 1113, aspectRatio: '1/1', padding: 'p-16', note: 'Straight-cut square with the design edge to edge.' },
  rectangle: { label: 'Rectangle', sizes: '7.5″ × 3.75″', widthIn: 7.5, widthPx: 2321, heightPx: 1196, aspectRatio: '2321/1196', padding: 'p-5', note: 'Printify bumper sticker, straight-cut with the design edge to edge.' },
  bumper: { label: 'Bumper', sizes: '11″ × 3″', widthIn: 11, widthPx: 3371, heightPx: 971, aspectRatio: '3371/971', padding: 'p-3', note: 'Printify bumper sticker, long and narrow, straight-cut with the design edge to edge.' },
} as const;
export type StickerType = keyof typeof STICKER_TYPES;
export const DEFAULT_STICKER_TYPE: StickerType = 'kiss-cut';
export const isStickerType = (value: unknown): value is StickerType => typeof value === 'string' && value in STICKER_TYPES;
export const isWideSticker = (type: StickerType) => STICKER_TYPES[type].widthPx !== STICKER_TYPES[type].heightPx;
export const WIDE_STICKER_TYPES = (Object.keys(STICKER_TYPES) as StickerType[]).filter(isWideSticker);

// 7 pt in canvas px: the smallest text that stays readable at the type's smallest size.
export const stickerMinTextPx = (type: StickerType) => (7 / 72) * (STICKER_CANVAS_PX / STICKER_TYPES[type].widthIn);

// Text and graphics stay 0.15" inside the edge, clear of the cut line.
export const stickerSafePx = (type: StickerType) => 0.15 * (STICKER_CANVAS_PX / STICKER_TYPES[type].widthIn);

// Printify doesn't describe any of these stickers' vinyl as waterproof, so a listing must not claim it.
export const STICKER_BANNED_CLAIM = /water\s*-?\s*proof/i;
