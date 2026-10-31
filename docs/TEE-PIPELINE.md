# Tee print pipeline

Front-print artwork for unisex tees, plus a wireframe preview. Poster, Etsy, and Pinterest code is unchanged aside from a home-page link. Sample poster JSON was not edited. Pinterest stays as it is.

The tee renderer does not import the KDP module. It follows the same shape: JSON manifests, a `scripts/*.ts` Playwright export, a browse route, and a print route.

## Shared theme

Colors and fonts are global. Tee designs name a palette and a font; they do not define their own hex values or font files.

| Path | Role |
|---|---|
| `theme/global.json` | Source of truth. Copied from the Design Bot handoff, plus the preview shirts and the Granite fallback noted below |
| `types/theme.ts` | Types for that file |
| `lib/theme.ts` | Load, validate, resolve shirts, palettes, inks, and the font allow-list |
| `lib/themeFontFaces.ts` | CSS `font-family` for every allowed face |
| `app/themeFonts.ts` | `next/font` loads. Playwright and the browser both get these files |

`lib/theme.ts` also exposes `mapPosterColorPalette`. A later poster pipeline can map `colorPalette.background`, `ink`, and `accent` into theme roles. `posters/dev-realities/project.json` is not rewritten. `npm run tee:check` prints that file's palette and font stack so the bridge stays visible. The reader only opens files under `posters/`. Tee **Dev** designs do not use that poster palette. They use `per_market_overrides.dev` from the theme (Space Mono + JetBrains Mono).

### What the theme file says

Fetched from the Design Bot handoff on 2026-10-31. The file's own `meta.verification` is the status:

- Font licenses were checked by the Design Bot against `github.com/google/fonts` on 2026-10-30. Permanent Marker is Apache-2.0. Every other listed face is OFL-1.1.
- WCAG contrast in the named palettes was computed against **Ivory** and **Pepper** only. Inks under 3.0 are omitted from `ink.on_light_shirt` and `ink.on_dark_shirt`.
- Palette hexes are `guide_proposed_unverified_sales`.
- Shirt hexes are **approximate**. Confirm them against a Comfort Colors chart.
- `per_market_overrides` for **dev, hockey, rally, and cooking** are `proposed_unverified`. **nd** is `from_guide`. The preview page and `tee:check` print that status.

Named palettes: Rainbow Infinity Retro, Gold Infinity, Calm Sensory Pastel, Dopamine Chaos, Earthy Vintage. Each has role colors, a display font, a supporting font, and the two ink lists.

The renderer picks ink from the list that matches the shirt's `is_dark` flag (`on_dark_shirt` or `on_light_shirt`). If a design names an ink that is not on that list, the check warns and the render uses the first listed ink instead. Low-contrast colors stay off the lists, so they are never chosen.

Market override palettes (dev, hockey, rally, cooking) do not have those ink lists. `lib/theme.ts` builds them from `contrast_vs_ivory` / `contrast_vs_pepper`, keeping only ratios at or above 3.0. `syntax_purple` on the dev override fails that floor and is not an ink.

### Shirts added for the preview

The handoff lists nine Comfort Colors 1717 colors. These four were added in `shirt_colors.colors` with `source: "added_for_preview"` because the preview toggle needs them and they are not in that list. Their hex values are approximate too.

| Name | Hex | Treated as |
|---|---|---|
| Black | `#111111` | dark |
| White | `#FFFFFF` | light |
| Heather Gray | `#9A9A9A` | light (dark ink) |
| Navy | `#14213D` | dark |

Dopamine Chaos recommends **Black**. That name now resolves.

**Granite** is on the hockey override and is not a shirt color. `shirt_colors.fallbacks` maps it to **Pepper** (`#4F4F4F`). Pepper is the closest listed dark heather, and it may be darker than a real Granite blank. Do not use that fallback for a production listing until the blank is confirmed.

Heather Gray above is a separate preview swatch. It is not the Granite fallback.

## Tee data model

```
tees/<project>/project.json
tees/<project>/<id>.json
```

`project.json` is the folder title and market (`nd`, `dev`, `hockey`, `rally`, `cooking`). Each design JSON has:

| Field | Meaning |
|---|---|
| `id`, `project` | Slug, and the project title (`ND Tees`, `Dev Tees`) |
| `market` | Theme market. Must match the project |
| `palette` | Named palette id. Omit it to use that market's override palette and fonts |
| `lines` | Text. Each line is `display` or `supporting` |
| `graphic` | Optional `browser-tabs` or `progress-bar`. No puzzle piece |
| `placement.side` | `front` or `back`. Only `front` is rendered |
| `placement.size` | `full-front` (12×14 in, centered) or `left-chest` (4×4 in, wearer's left) |
| `ink` | Optional ink **names** from the palette lists, per shirt lightness |
| `fonts` | Optional family overrides. Names must be on the allow-list |
| `shirts` | Shirt color names this design is meant for |
| `etsy` | Same shape as a poster `etsy` block: `title`, `description`, `category`, `tags` |

`tee:check` rejects a font on `fonts.banned`, any family that is not in the theme catalog or a market `alt_fonts` list, and the phrase "Zones of Regulation". Etsy tags: at most 13, each at most 20 characters. The category string is a placeholder for the exporter. Confirm it against the current Etsy taxonomy before listing.

Sample designs:

| File | Market / palette | Placement |
|---|---|---|
| `tees/nd-tees/brain-tabs.json` | nd / Rainbow Infinity Retro | Full front, browser tabs |
| `tees/nd-tees/side-quest.json` | nd / Earthy Vintage | Left chest |
| `tees/nd-tees/hyperfocus.json` | nd / Dopamine Chaos | Full front, bar at 99% |
| `tees/dev-tees/git-commit-wip.json` | dev override | Full front |
| `tees/dev-tees/rm-node-modules.json` | dev override | Full front |

Dev samples are `proposed_unverified`. ND palettes are `guide_proposed_unverified_sales`.

## Print specs

### Verified from Printify, 2026-10-31

- [What type of print files does Printify require?](https://help.printify.com/hc/en-us/articles/4483617936657-What-type-of-print-files-does-Printify-require) JPEG, PNG, or SVG. PNG/JPEG recommended at **300 DPI**. Max **100 MB** for PNG. Product-specific requirements are in the Product Creator.
- [What dimensions should my design be?](https://help.printify.com/hc/en-us/articles/4483601892497-What-dimensions-should-my-design-be) The recommended size **differs per product, print area, and sometimes size**. You do not have to fill the print area. Apparel is scaled **down** below L and **not scaled up** above L. Read the pixel size in the Product Creator Upload panel.
- [How are the print areas different?](https://help.printify.com/hc/en-us/articles/4483637776401-How-are-the-print-areas-different) Print providers do not share one print area. Each product has a maximum. The Catalog and Product Creator are the source for a given provider.
- [Will my design be scaled…](https://help.printify.com/hc/en-us/articles/4483635618961-Will-my-design-be-scaled-up-or-down-based-on-the-garment-size) The Product Creator shows the **L** print area. DTG/DTF art is scaled down for smaller sizes, same aspect ratio, and is not scaled up above L. Sleeve prints are not scaled. Pallet sizes differ by provider.
- [Can I use gradients for DTG products?](https://help.printify.com/hc/en-us/articles/4483625121681-Can-I-use-gradients-for-DTG-products) Dark garments get a white underbase. **Transparent gradients are not recommended** on dark garments because the underbase shows through. Halftone dots are the suggested fade.
- [Design guide](https://printify.com/guide/design-guide/) Avoid gradients that run all the way to transparency on DTG. PNG for transparent backgrounds. Export without interlacing.
- [DPI for printing](https://printify.com/knowledge-hub/dpi-for-printing/) (page `dateModified` 2026-10-30). Formula: pixels = inches × 300. The plug-and-play table lists **full-chest t-shirt 15×18 in = 4500×5400 px**. It also names Comfort Colors 1717 as a blank that uses that canvas. This is a knowledge-hub canvas, not a provider pallet measurement.
- [PNG file setup for t-shirts](https://printify.com/knowledge-hub/png-file-setup-for-tshirts/) Same **4500×5400**, transparent background, and no semi-transparent pixels (the underbase trap). It says that canvas maps onto Bella+Canvas 3001, Comfort Colors 1717, and Shaka Wear. It does not publish a per-provider pixel size.
- [Placement guide](https://printify.com/blog/t-shirt-design-placement-guide/) Editorial averages, and it says to confirm each product: full front about **10–12 in wide × 10–14 in tall**; left chest about **2.5–5 in**, with **4×4 in** called standard; some providers go up to **15×18 in** on larger adult tees. Placement varies by size and supplier.

### What this repo does with that

`lib/teeSizes.ts` exports a **4500×5400** transparent PNG (15×18 in at 300 DPI). That matches the knowledge-hub canvas. It is **not** verified against a Product Creator template for Bella+Canvas 3001 or Comfort Colors 1717, and those two blanks may not share a pallet. The help center says to read the Upload panel for the provider you actually buy.

Inside that canvas:

| Placement | Design box | Position |
|---|---|---|
| `full-front` | 12×14 in | Centered. About 1.5 in of print-area margin on the sides and 2 in top and bottom |
| `left-chest` | 4×4 in | 3.25 in toward the wearer's left and 5 in up from the center of the print area |

Both boxes were checked to sit inside the 15×18 canvas. The 12×14 box is the top of the blog's full-front range. The 4×4 box and the offset are from that same editorial guide, not from a downloaded template. Change them in `TEE_PLACEMENTS`.

There is no separate DTG "safe zone" number in the help articles above. The [safe area / bleed article](https://help.printify.com/hc/en-us/articles/4483626015889-What-are-safe-areas-and-bleeds) is about all-over print, not a tee pallet. This pipeline does not invent a bleed. It keeps type inside the design box, which is already inset from the canvas edge.

The PNG is RGB, transparent outside the art, with a `pHYs` chunk at 300 DPI. After the screenshot, every pixel is forced to alpha 0 or 255 and snapped to a listed ink color. That is how the export follows the "no semi-transparent pixels" guidance. Browser text is antialiased; the snap removes the halo. There are no gradients, glows, or soft shadows. Edges can look slightly hard because of that snap.

The print file has no shirt, no print-area box, and no size label.

### Not verified

- The live Product Creator pixel size for Bella+Canvas 3001 or Comfort Colors 1717, for any print provider (Monster Digital, SwiftPOD, Printify Choice, or anyone else). Third-party charts that quote 12×16 or 15×18 per provider were not used.
- Garment measurements on the wireframe. The tee outline is a flat drawing so you can see the art. It is not a graded pattern.
- Whether Heather Gray should take light ink instead of dark ink. It is treated as a light shirt.
- Comfort Colors hex accuracy, including the four preview colors.
- Etsy category path.
- Per-size art. One file is the L print area. Printify scales smaller sizes. This repo does not emit a separate PNG per size.

## Routes

| Path | Role |
|---|---|
| `/tees` | Index by project |
| `/tees/<id>?shirt=Black` | Wireframe. Shirt toggle includes White, Black, Heather Gray, Navy, then the Comfort Colors |
| `/tees/<id>/art?ink=on-light` | Transparent print canvas. `on-dark` for the other ink |
| `/tees/<id>/preview?shirt=White` | Wireframe card the preview script screenshots, with the print-area outline and size labels |

Guides are only on the wireframe. They are not on the art route.

## Commands

Chromium once:

```bash
npx playwright install chromium
```

Check manifests, the font ban list, ink lists, and the poster palette bridge. No browser.

```bash
npm run tee:check
```

Print PNGs, one per ink list, at `exports/tees/<id>-on-light.png` and `exports/tees/<id>-on-dark.png`:

```bash
npm run tee-art -- brain-tabs
npm run tee-art -- --all
npm run tee-art -- --all --base-url http://127.0.0.1:4310
```

Wireframe PNG at `exports/tees/previews/<id>-<shirt>.png`. Default shirt is White.

```bash
npm run tee-preview -- brain-tabs
npm run tee-preview -- --all
npm run tee-preview -- brain-tabs --shirt Black
```

`tee-art` and `tee-preview` start `next dev` on port 4313 unless you pass `--base-url`. App dev is `npm run dev` (port 4310).

## nd-shirts tabs windows

`tees/nd-shirts/` has two designs ported from the Design Bot file `tabs-open-windows.html` (not redrawn). The component is `components/tees/TabsOpenWindow.tsx`. It lays the reference out at 640 px, then scales that box to the front print area so the 6 px art pixel, the 24 px teal shadow, and the window widths stay in proportion.

Jersey 10 (`github.com/google/fonts/ofl/jersey10/METADATA.pb`, license field `OFL`, checked 2026-10-31) is the pixel face. It is weight 400 only. Press Start 2P is the fallback. Light shirts use ink `#111111` and white paper. Dark shirts use cream `#F5EEE1`, transparent paper, and the Warning title-bar text switches to `#111111` because the bar fill becomes cream. Pink `#E0529A`, teal `#4FB3B0`, and yellow `#F5C842` do not change.

## Pace-note CSS

`tees/rally-shirts/` has a stencil pace note and a handwritten one. The rally market stays `proposed_unverified`. Wording is generic pace-note language. No series, team, or manufacturer marks.

Font tokens in `theme/global.json` `fonts.role_tokens`:

| Token | Family | Use |
|---|---|---|
| `display_stencil` | Big Shoulders Stencil, weight 800 | `LEFT 4` and `OVER CREST` |
| `label_wide` | Barlow Condensed, weight 600 | `DON'T CUT` |
| `hand_note` | Kalam, weight 400 | The pen note |

At the 4500×5400 canvas the design box is 12 in wide (3600 px). Stencil caps are 1.55 in and 1.43 in (`3600/12 * inches`). The label is 0.48 in with `letter-spacing: 0.22em`. Handwritten lines are 0.95 in.

Orange accent token `pace_orange` is `#DA5A2A`, sampled from the stencil reference (the cluster around that hex; the brief's `#E8601C` was the starting guess). It does not change between light and dark shirts. Ink is `#111111` on light shirts and cream `#F5EEE1` on dark shirts.

Stencil distress is an SVG `feTurbulence` mask (`filterUnits="objectBoundingBox"`) composited with `operator="in"` on the two big lines only, so the grain stays vector and scales with the print. The road arrow is inline SVG: two lane strokes plus a short orange segment and an arrow head.

The handwritten "don't cut" highlight is a skewed CSS block at 60% opacity with `mix-blend-mode: multiply` on light shirts. On dark shirts the blend is `normal` and the opacity is 0.85 so the orange stays visible. The export keeps that orange alpha instead of forcing it to solid. "caution" has a solid pen underline in the ink color.

## Shared modules

Tee files stay under `tees/`, `types/tee.ts`, `lib/teeDesigns.ts`, `lib/teeSizes.ts`, `components/tees/`, `app/(browse)/tees/`, `app/(print)/tees/`, and `scripts/tee-export.ts`.

These are shared on purpose, so mug and KDP export scripts can import them without editing tee files:

| Module | What it is |
|---|---|
| `theme/global.json`, `types/theme.ts`, `lib/theme.ts`, `lib/themeFontFaces.ts`, `app/themeFonts.ts` | Global palettes, inks, shirt colors, and fonts |
| `scripts/shared/previewServer.ts` | `startNext`, `stopNext`, `waitForServer`, and `chromiumLaunchOptions` |

Root `package.json` holds every pipeline's npm script (`tee:check`, `tee-art`, `tee-preview`, and the KDP scripts). Add mug scripts there rather than a second package file.

## How this fits the other bots

1. Research and SEO bots write a JSON proposal (copy, tags, palette name, shirt names).
2. The design scaffolder drops a file in `tees/<project>/<id>.json` that points at `theme/global.json` by palette and font name.
3. This renderer (`tee-art`, `tee-preview`) makes the PNG and the wireframe.
4. An exporter, not built yet, would turn the `etsy` block into the listing file and map shirt names to Printify variants.

Replacing the theme is a drop-in of `theme/global.json`. Designs keep working as long as the palette ids, ink names, and font families they cite are still in the file.

## Left for later

- Hoodies and other blanks (the theme blank is Comfort Colors 1717; the original tee note was Bella+Canvas 3001).
- Back prints. The field exists. The renderer rejects `side: "back"` until a back pallet is verified.
- Mug and other product pipelines. The theme module is shared so they can call it without a tee import.
- Exporter mapping of the `etsy` block, Printify variant ids, and color-name mapping.
- A separate PNG per garment size. Printify already scales below L.
- Applying the Earthy Vintage `texture` note (`distressed halftone`). It is kept on the palette and not drawn. A halftone would have to be solid dots, not a transparent fade.
- Poster pipeline migration onto `lib/theme.ts`. The bridge reader is there; poster JSON is unchanged.
