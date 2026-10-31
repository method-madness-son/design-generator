# Mug pipeline

White ceramic mugs for Etsy through Printify, built on the shared theme from the tee pipeline. This file matches the code on `cursor/tee-print-pipeline-f884`.

Shared modules this pipeline imports, and does not own:

| Module | Role |
|---|---|
| `theme/global.json` | Palettes, fonts, market overrides, banned faces |
| `types/theme.ts` | Theme types |
| `lib/theme.ts` | `getPalette`, `getMarket`, `inkListFor`, `fontIssue`, `fontFamilyCss`, `wcagBand` |
| `lib/themeFontFaces.ts` | CSS variables for allowed families |
| `app/themeFonts.ts` | `next/font` loads, already on the root layout |
| `scripts/shared/previewServer.ts` | Next dev spawn and Chromium launch options |

Mug-only files: `mugs/`, `components/mugs/`, `app/(browse)/mugs/`, `app/(print)/mugs/`, `lib/mugDesigns.ts`, `lib/mugSizes.ts`, `lib/mugLayout.ts`, `types/mug.ts`, `scripts/mug-export.ts`.

## Commands

```bash
npm run mug:check
npm run mug-art -- works-on-my-machine
npm run mug-art -- --all
npm run mug-preview -- works-on-my-machine
npm run mug-preview -- --all
npm run dev
```

`mug:check` does not start a browser. `mug-art` and `mug-preview` start `next dev` on port **4316** unless you pass `--base-url`. Dev is 4310, KDP is 4312, tees are 4313, and low-content books are 4314.

Preview in the app at `/mugs` and `/mugs/<id>`. The print route `/mugs/<id>/art?size=11oz` is the screenshot target. `/mugs/<id>/preview` is the wireframe screenshot target.

Art files: `exports/mugs/<id>-11oz.png` and `exports/mugs/<id>-15oz.png`.

Wireframe files: `exports/mugs/previews/<id>.png` (11 oz board).

## 1. Printify specs

Fetched 2026-10-31. Every number below has a source. **UNVERIFIED** means it is not on a Printify page we could open.

### Verified on printify.com or the help center

| Fact | Value | Source |
|---|---|---|
| File types | JPEG, PNG, SVG | [What type of print files does Printify require?](https://help.printify.com/hc/en-us/articles/4483617936657-What-type-of-print-files-does-Printify-require) |
| Resolution | 300 DPI recommended for JPEG/PNG. Large goods such as blankets can be 120–150 DPI. Mugs stay at 300. | Same article |
| File size | 100 MB JPEG/PNG, 20 MB SVG | Same article |
| Exact pixels | Per product, in Product Creator → Upload. Not one global size. | [What dimensions should my design be?](https://help.printify.com/hc/en-us/articles/4483601892497-What-dimensions-should-my-design-be) |
| 11 oz canvas | **2475 × 1155 px** for a standard 11 oz canvas | [Print on Demand Mugs](https://printify.com/knowledge-hub/how-to-design-and-sell-pod-mugs/) |
| 11 oz inches | 8.25 × 3.85 in is 2475/300 and 1155/300. The knowledge hub states pixels, not inches. | Derived from the pixel size at the recommended 300 DPI |
| Wrap | One full-bleed file. The knowledge hub says fill edge to edge and apply one wrap across the 11 oz / 15 oz ceramic, the accent mug, and the color-changing mug. | Same knowledge-hub article |
| Safe / print / bleed | Safe area is inside the dashed line. Print area should be covered. Bleed is the gray rim; do not put type there; cover it with background. | [What are safe areas and bleeds?](https://help.printify.com/hc/en-us/articles/4483626015889-What-are-safe-areas-and-bleeds) and the [design guide](https://printify.com/guide/design-guide/) |
| Position shift | Sublimation or all-over placement can move by up to **0.5 in (1.27 cm)** from the mockup. | Safe-area article |
| Seam | On drinkware, a seam can still show on a full-bleed wrap. Printify recommends keeping type, repeating patterns, and large details off the edges. | [Design guide, sublimation section](https://printify.com/guide/design-guide/) |
| Small detail | Avoid small detail on mugs. Strokes should be at least 5 px. | Design guide |
| Not on the handle, rim, or base | The print must reach the printable area and must not overlap the handle or the top or bottom of the mug. | [Printify mug quality standard PDF](https://printify.com/wp-content/uploads/2023/07/Printify-Mug-Quality-Standart.pdf) |
| Alignment | Full-bleed art is centered on the handle, or placed as the merchant submitted it. No skew. Parallel to the rim. Printed at the submitted size, not auto-scaled. | Same PDF |
| Color | Merchant PNG is RGB, no interlacing. Printify converts uploads to RGB. The quality PDF tells providers to print CMYK and avoid RGB. We export RGB PNG, which is what the design guide accepts. | [Design guide, export settings](https://printify.com/guide/design-guide/) and the quality PDF |
| White ceramic, accent, color-change | Accent mugs on the Canada page are 11 oz, white outside, colored interior and handle. Color-changing mugs are black outside and white inside and reveal the design with hot liquid. | [Custom mugs — Canada](https://printify.com/custom-mugs/canada/) |
| Method | Ceramic mugs are dye-sublimation. | Knowledge-hub article |

### UNVERIFIED

| Item | What the code does | Why |
|---|---|---|
| 15 oz pixels | 2475 × 1275, `verified: false` | Not on any Printify page we fetched. [POD Made Easy](https://www.podmadeeasy.com/blog/mug-design-size) claims this for Printify ceramic 15 oz. Do not upload until Product Creator → Upload shows the size. |
| Handle gutter | 0.5 in at both ends of the wrap | Printify does not publish this distance. The quality PDF only says "do not overlap the handle." |
| Safe inset | 0.5 in from the top and bottom of the print file | The 0.5 in figure is the sublimation shift, used here as an inset. It is not a mug template's dashed line. |
| Left file and right file | Not used. One wrap. | The knowledge hub describes one canvas. Product Creator slot count was behind login, so the slot count itself is UNVERIFIED. |
| Left-handed SKU | No separate product. `drinker-left` and `drinker-right` move type inside the one file. | Printify pages we fetched do not sell a left-hand mug. Which half faces a drinker is UNVERIFIED against the mockup generator. |
| White blank hex | `#FFFFFF` | Not published. |
| Interior, foot, and handle as print areas | Not printable in this pipeline | The quality PDF forbids overlap onto handle, top, and bottom. Interior artwork is not described for the white ceramic mug. Accent color is the blank's interior, not a second print. |
| Blueprint and provider | Not chosen | Catalog URLs such as `/app/products/478/...` returned a login shell. Do not treat those ids as confirmed. |
| Etsy category string | `Home & Living > Kitchen & Dining > Drinkware > Mugs` | Stored so the block matches posters. The taxonomy path was not confirmed in Etsy seller docs. |
| Dishwasher and microwave | Not claimed in listing copy | The quality PDF requires providers to use dishwasher-safe blanks. That is not a promise this shop has checked on a received sample. |

Etsy title and tags are verified: title up to 140 characters, up to 13 tags, each up to 20 characters, letters, numbers, spaces, and `'` or `-` not at the start. [Listing tags](https://help.etsy.com/hc/en-us/articles/360000336307-How-to-Use-Tags-to-Get-Found-in-Search), [Create a listing](https://help.etsy.com/hc/en-us/articles/115015628707-How-to-Create-a-Listing).

There are two official wrap instructions and they disagree. The knowledge hub wants a full-bleed wrap with no white gap. The design guide says a seam can show and tells you to keep type off the edges. This pipeline follows both: the PNG is a transparent spot print (unprinted areas stay the white mug), and type sits inside the safe rect, away from the handle ends.

## 2. Data model

```
mugs/<project>/project.json
mugs/<project>/<id>.json
```

`project.json`:

| Field | Rule |
|---|---|
| `id` | Folder name. `dev-mugs`, `nd-mugs`, `kitchen-mugs`, `rally-mugs` |
| `title` | `Dev Mugs`, `ND Mugs`, `Kitchen Mugs`, `Rally Mugs` |
| `description` | One line |
| `market` | `dev`, `nd`, `cooking`, or `rally`. Kitchen uses the theme key `cooking`. |
| `product` | `ceramic-white` for this pass |

Design JSON matches the tee file, with wrap and sizes instead of shirt placement:

| Field | Rule |
|---|---|
| `id` | File name, unique across mugs |
| `project` | Must equal `project.json` `title` |
| `market` | Must equal the project market |
| `palette` | Optional palette id (`dopamine_chaos`). Omit it to use `per_market_overrides[market]` |
| `fonts.display` / `fonts.supporting` | Optional family names. Checked with `fontIssue` |
| `lines[]` | `{ "text", "font": "display" \| "supporting" }` |
| `graphic` | Optional `cursor-block`, `tab-pips`, or `steam` |
| `wrap` | `front`, `full-wrap`, `drinker-left`, `drinker-right` |
| `sizes` | `11oz` and/or `15oz` |
| `product` | Optional. `accent` and `color-changing` fail validation until their print areas are known |
| `etsy` | Required. Same four fields as `PosterFile['etsy']` |

`front` centers type on the face opposite the handle. `full-wrap` repeats that lockup in the left and right halves of the safe rect. `drinker-left` and `drinker-right` park a short lockup in that half. Both ends of the file are the handle seam. The print file is not mirrored.

Ink comes from `inkListFor(paletteId, false)` because the blank is light. Text must be at least 4.5:1 against `#FFFFFF`. A second ink, if one exists at 3.0:1, colors the graphic. Ratios are recomputed for white; the theme's stored ratios are against Ivory and Pepper.

Rally Mugs has a project file and no designs.

## 3. Renderer

`scripts/mug-export.ts` follows `scripts/tee-export.ts`:

1. Playwright opens `/mugs/<id>/art?size=<size>` with `deviceScaleFactor: 1`.
2. The element is the pixel size of that canvas. Screenshot uses `omitBackground: true`.
3. Alpha below 128 becomes 0. Other pixels snap to the nearest allowed ink and alpha 255. The cutoff is ours, not Printify's.
4. A `pHYs` chunk is inserted at 300 DPI (11811 pixels per meter).
5. The file must be exactly the canvas size and at most 100 MB.

No guides, labels, or gradients on the art. `npm run mug:check` rejects banned fonts, unknown families, medical wording on the printed lines, a short denylist (including NEUROSPICY), puzzle-piece graphics, and type that does not fit the slot.

## 4. Wireframe

`/mugs` lists projects and a scaled 11 oz thumbnail.

`/mugs/<id>` shows four drawings: front (handle on the right, center of the wrap), handle left, handle right, and the flat wrap with print-area, safe-zone, seam, and slot outlines. `?size=15oz` switches the board. The handle mapping is labeled as unverified.

`npm run mug-preview` writes `exports/mugs/previews/<id>.png` from `/mugs/<id>/preview`.

## 5. Sample phrases

No logos, no brand names, no medical claims. ADHD on the ND listings is the joke, not a health claim.

| Project | Id | Printed lines | Wrap |
|---|---|---|---|
| Dev Mugs | `works-on-my-machine` | it works / on my machine | front |
| Dev Mugs | `one-more-bug` | one more / bug | full-wrap |
| Dev Mugs | `friday-deploy` | friday / deploy | drinker-right |
| ND Mugs | `too-many-tabs` | too many / tabs open | front |
| ND Mugs | `side-quest` | side / quest | drinker-left |
| ND Mugs | `forgot-why` | forgot why / I came in | front |
| Kitchen Mugs | `measure-twice` | measure twice / lick the spoon | front |
| Kitchen Mugs | `cookies-first` | cookies / first | full-wrap |
| Kitchen Mugs | `preheated` | preheated / emotionally | front |

Dev uses Space Mono and JetBrains Mono from the dev market override (`proposed_unverified`). ND uses the `dopamine_chaos` palette (Titan One and Permanent Marker). Kitchen uses Caprasimo and Work Sans from the cooking override (`proposed_unverified`).

## 6. Etsy and Printify mapping

Not implemented. When an exporter is added:

- One Printify product per design, variants 11 oz and 15 oz, white.
- One image slot per variant. Upload `exports/mugs/<id>-11oz.png` only. Hold `<id>-15oz.png` until the size is verified.
- Do not upload a second left/right file.
- Copy `etsy.title`, `etsy.description`, `etsy.tags`, and `etsy.category` onto the Etsy listing. Tags are already capped at 13 × 20.
- Do not send accent or color-changing variants until those print areas are copied out of Product Creator.
- Price, shipping, and provider are shop decisions. The knowledge hub's $18 / $21.99 / $24.99 ladder is marketing copy, not a spec.

## 7. Acceptance

- `npm run mug:check` exits 0.
- `npm run lint` and `npm run build` exit 0.
- Each 11 oz PNG is 2475 × 1155, binary alpha, and at most 100 MB.
- 15 oz PNGs match `MUG_CANVASES['15oz']` and the check prints UNVERIFIED.
- `/mugs` and `/mugs/<id>` render the nine designs. Rally Mugs shows an empty state.
- A banned font, a 14th tag, or a 21-character tag fails the check.

## 8. What is left

1. Paste the 15 oz Upload-section size into `lib/mugSizes.ts` and set `verified: true` only after editing `assertMugCanvases`.
2. Pick the Printify blueprint and provider, then order one 11 oz sample.
3. Accent and color-changing print areas, as their own size records.
4. An exporter that writes the Etsy/Printify payload. Do not add API keys to this repo.
5. Confirm the wireframe's handle-left / handle-right crop against a Printify mockup.

## 9. Risks

- Uploading the 15 oz file before Product Creator confirms it will crop or letterbox.
- Spot (transparent) art leaves the white mug showing. A full-bleed color field is a different design, not the default.
- Dev and cooking palettes are `proposed_unverified`. Dopamine Chaos is `guide_proposed_unverified_sales`.
- Shirt contrast ratios are against Ivory and Pepper. Mug checks recompute against `#FFFFFF`.
- The quality PDF and the design guide disagree on RGB vs CMYK. We follow the design guide.
- Theme trademark watch is not a USPTO search. A person still has to search Class 21 (drinkware) before a listing goes live.

## 10. Open decisions

1. Confirm or replace the 15 oz pixel size before any 15 oz order.
2. Which Printify blueprint and print provider.
3. Keep spot prints on white, or add an opaque full-bleed ground.
4. Whether `drinker-left` / `drinker-right` match the mockup once someone is logged into Product Creator.
5. Replace the Etsy category string if the shop's taxonomy differs.
6. When to add Rally Mugs phrases, still with no series or manufacturer marks.
7. Whether accent and color-changing mugs are in the first shop launch.
