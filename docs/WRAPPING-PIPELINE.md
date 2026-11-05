# Wrapping paper pipeline

Wrapping paper designs are tiled patterns printed on 90gsm fine art paper, sold through Printify as rolls or sheets on Etsy. A design is either a standalone pattern or derived from an existing poster.

## Product

| | Wrapping Papers |
|---|---|
| Blueprint | `1367` |
| Print provider | `99`, Printify Choice |
| Print area | **9075 × 10800 px** (one tile, tiled by Printify across all sizes) |
| DPI | 300 (9075 / 30.25″ = 300) |
| Material | 90gsm fine art paper, recyclable |
| Finish | Matte or glossy (separate variants) |

Confirmed from the Printify catalog API on 2026-11-04.

### Variants

All 6 variants share the same 9075×10800 print area. Upload one PNG per design; Printify tiles it.

| Variant | Size | Finish |
|---|---|---|
| 102987 | 30″ × 36″ | Glossy |
| 102988 | 30″ × 36″ | Matte |
| 102989 | 30″ × 72″ | Glossy |
| 102990 | 30″ × 72″ | Matte |
| 102991 | 30″ × 180″ | Glossy |
| 102992 | 30″ × 180″ | Matte |

Other blueprints found: 845 (Gift Wrapping Paper Rolls, Prodigi only) and 848 (Gift Wrapping Paper Sheets, Prodigi only). Blueprint 1367 with Printify Choice matches the rest of the shop's products.

## Files

```
wrapping/<designId>/
  wrap.json      design config: source, tile settings, colors, sizes
  etsy.json      Etsy listing: { etsy, research }
  exports/       <designId>.png (one 9075×10800 tile)
```

### wrap.json

```json
{
  "id": "retro-icons",
  "title": "Retro Tech Icons",
  "source": { "kind": "standalone" },
  "sizes": ["30x36", "30x72", "30x180"],
  "tile": {
    "widthIn": 6,
    "heightIn": 6,
    "rotate": 0,
    "scale": 1
  },
  "colors": {
    "background": "#FAF3E0",
    "foreground": "#2D2D2D",
    "accent": "#E8573A"
  }
}
```

`sizes` controls which variants are enabled for this design. All variants use the same print file. The tile dimensions (`widthIn`, `heightIn`) are the logical size of one repeating unit within the 30.25″ × 36″ tile image.

For a poster-derived design:

```json
{
  "id": "doom-pile-wrap",
  "title": "Doom Pile Pattern",
  "source": { "kind": "poster", "projectId": "adhd-brain", "posterId": "doom-pile" },
  "sizes": ["30x36", "30x72", "30x180"],
  "tile": { "widthIn": 4, "heightIn": 4 },
  "colors": {
    "background": "#FFFFFF",
    "foreground": "#000000"
  }
}
```

### etsy.json

Same format as posters and stickers:

```json
{
  "etsy": {
    "title": "Retro Tech Icons Wrapping Paper | Programmer Gift Wrap",
    "description": "...",
    "tags": ["wrapping paper", "tech gift wrap"],
    "category": "Paper & Party Supplies > Gift Wrapping > Wrapping Paper"
  },
  "research": {}
}
```

## Design approach

You upload one 9075×10800 PNG and Printify tiles it across the roll. The image is 30.25″ × 36″ at 300 DPI. The extra 0.25″ width is bleed that ensures seamless tiling — the left and right edges meet when the tile repeats horizontally.

**Standalone patterns:** built from scratch — icons, shapes, text arranged in a repeating grid or scatter.

**Poster-derived patterns:** pull the graphic elements (icons, fractals, windows) from an existing poster and arrange them as a repeating motif. The poster's color palette carries over.

The tile must be seamless: the left edge continues into the right, the top into the bottom. The art route renders the tile at 9075×10800 px.

## Workflow

1. **Create a design:** add a folder under `wrapping/` with `wrap.json`.
2. **Build the print route:** the art page at `app/(print)/wrapping/[id]/art/page.tsx` renders the tile at 9075×10800. *(Not yet built — needs a React component.)*
3. **Preview in the studio:** browse at `/wrapping` to see the designs. *(Not yet built.)*
4. **Export:** `npm run wrap-art -- <designId>` captures the tile PNG via Playwright.
5. **Write Etsy listing:** fill in `wrapping/<designId>/etsy.json`.
6. **Check:** `npm run wrap:check`.
7. **Sync:** `npm run wrap:sync -- <designId> --dry-run`, then without `--dry-run`.
8. **Publish:** review in Printify, then `npm run wrap:sync -- <designId> --publish`.

## What's built

| Path | Role |
|---|---|
| `types/wrap.ts` | Design and resolved wrap types |
| `lib/wrapSizes.ts` | Confirmed tile dimensions (9075×10800), DPI, size definitions |
| `lib/wrapDesigns.ts` | Load/resolve designs from disk, export paths, listing access |
| `scripts/wrapping.ts` | CLI: `check`, `catalog`, `art`, `sync` |
| `printify/wrapping.json` | Blueprint 1367, provider 99, all 6 variants (prices TBD) |
| `package.json` | `wrap:check`, `wrap:catalog`, `wrap-art`, `wrap:sync` scripts |

## What's not built yet

These need to be added before the pipeline is fully functional:

- **Print route** (`app/(print)/wrapping/[id]/art/page.tsx`): a Next.js page that renders the tile at 9075×10800 px. The export script screenshots this page with `[data-wrap-art]`.
- **Browse routes** (`app/(browse)/wrapping/`): studio pages for previewing and customizing wrapping paper designs.
- **Pattern tile component**: the React component that draws a seamless tile. For poster-derived designs, this pulls the poster's graphic and re-renders it in a grid/scatter layout.
- **Inventory integration**: add wrapping paper to `lib/inventory.ts` and the `/inventory` page.
- **Pricing**: set `priceCents` for each variant in `printify/wrapping.json`. Create one draft first and check Printify's production cost.

## State tracking

Synced wrapping paper designs are stored in `printify/state.json` under `wrapping/<designId>`, following the same pattern as stickers. One image (keyed `master`) is stored per design with a SHA-256 hash, so unchanged tiles aren't re-uploaded.

## Notes

- Printify adds white edges at the top and bottom of each roll for a barcode and QR code.
- The tile PNG will be large (~9075×10800 at 300 DPI). Base64 upload should work within Printify's limits, but if a design produces an unusually large file, consider `--image-base-url`.
- Matte and glossy are separate variants with separate prices.
