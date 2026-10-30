# Printify export specs

Print requirements for the poster sizes this app exports, and how the export pipeline (`lib/exportUtils.ts`, `lib/posterSizes.ts`) meets them.

## What's confirmed vs. convention

Printify's own [print file help article](https://help.printify.com/hc/en-us/articles/4483617936657) states:

- **Resolution:** JPEG/PNG artwork should be **300 DPI**. Lower-resolution files may still be accepted (Printify will auto-upscale), but 300 DPI is what's required for a crisp, full-quality print.
- **File size limits:** 100 MB max for JPEG/PNG, 20 MB max for SVG.
- **Pre-flight checklist** (from Printify's [file prep / bleed guidance](https://printify.com/knowledge-hub/file-prep-blueprint-for-bleeds/)): confirm 300 DPI, keep important content inside the **Safe Zone**, and extend full-bleed backgrounds all the way to the **bleed edge**.

Printify does **not** publish a single universal bleed/safe-zone measurement that applies to every product — it varies per product template inside their Product Creator. The **0.125" (1/8") bleed** and **~0.2"–0.25" safe-zone inset** used below are the standard print-industry convention (cited by multiple third-party print guides), not a number pulled from a Printify poster template. **Before placing a real production order, re-check the exact bleed/safe-zone figures for your chosen poster product inside Printify's Product Creator** — they can differ by print provider.

## How this app handles it

- Every export (`downloadCanvasAs300DPI`, `downloadEtsyPack`, `downloadPinterestPack` in `lib/exportUtils.ts`) renders at **exactly 300 DPI**: pixel dimensions = print inches × 300, computed per export rather than hardcoded.
- `PosterCanvas` (`components/PosterCanvas.tsx`) uses `p-12` padding as an internal safety margin so title/subtitle/icon content never sits at the literal edge of the canvas — functioning as the Safe Zone. This is an *inset* safe margin, not an outward bleed extension: the exported file is exactly the trim size (e.g. 2400×3000px for 8×10), with backgrounds already filling edge-to-edge (full bleed) inside that same canvas.
- This app does **not** currently add extra canvas beyond the trim size for physical bleed (e.g. exporting 11.25"×17.25" artwork for an 11"×17" trim). If your print provider's template requires oversized bleed artwork rather than exact-trim artwork, extend `printWidthInches`/`printHeightInches` in `lib/posterSizes.ts` by the bleed amount and verify against the live Product Creator template first.

## Poster sizes

Defined in `lib/posterSizes.ts`. "Default" (no `printSize` selected) is 8×10 — every project's own layout already matches it.

| Size | Aspect ratio | Export resolution (300 DPI) | Notes |
|---|---|---|---|
| **8" × 10" (Vertical)** — default | 4:5 | 2400 × 3000 px | Matches every project's existing default layout. |
| **11" × 17" (Vertical)** | 11:17 | 3300 × 5100 px | Selectable via the "Print Size" control in the poster customize panel. |

Both figures match the standard 300 DPI formula (`inches × 300 = pixels`) cited across multiple print-size guides (e.g. [4over4's poster pixel guide](https://www.4over4.com/.well-known/okf/guide/poster-printing-resolution-guide.md)).

## Picking a size in the app

The "Print Size" picker (`components/PrintSizePicker.tsx`) sets a `printSize` query param (`8x10` or `11x17`), validated and resolved in `lib/posterResolver.ts`. Selecting a size overrides that poster's `aspectRatio` and `printWidthInches` for both the on-screen preview and every export (high-res PNG, Etsy pack, Pinterest pack) — the canvas reflows to the new aspect ratio and all exports compute pixel dimensions from the selected size automatically.

## Adding another size

Add an entry to `POSTER_SIZES` in `lib/posterSizes.ts` with a `label`, `aspectRatio` (add the ratio to `AspectRatioOption` in `types/poster.ts` if it's new), `printWidthInches`, and `printHeightInches`. No other code changes are needed — the picker, resolver, and every export path all read from that one map.
