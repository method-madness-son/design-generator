# Low-content KDP pipeline

Print-ready interiors and wrap covers for Amazon KDP low-content paperbacks: journals, planners, logbooks, trackers, and notebooks. Publishing on KDP is free. This pipeline does not call a paid API.

It is a separate product from two other book paths in this workspace:

| Path | What it is |
|---|---|
| `lowcontent/` | This pipeline. Themed fill-in books, interiors, wrap covers, wireframe previews. |
| `kdp/` | The earlier interior wireframe (`docs/KDP-WIREFRAME.md`). Grayscale pages, including a few cheat-sheet sheets. Left as it was. |
| `usefulcheatsheets-web` | The content-heavy cheat-sheet engine. Private repo, not readable from here, not copied. |

This work sits on `cursor/tee-print-pipeline-f884`, which already contains the merged KDP wireframe from pull request #1 (`cursor/kdp-interior-wireframe-feb0`). The low-content pipeline does not copy those `kdp/` files. It is a separate product.

Palettes, the font allow-list, and banned faces come from the shared theme: `theme/global.json`, `lib/theme.ts` (`fontIssue`, `getPalette`, `getMarket`, `fontFamilyCss`), `lib/themeFontFaces.ts`, and `app/themeFonts.ts`. The exporter uses `scripts/shared/previewServer.ts` for the Next preview server and Chromium launch options. Interior colors (paper, ink, accent) are chosen in `lib/lowcontent/theme.ts` from that shared palette.

## Layout

| Path | Role |
|---|---|
| `lowcontent/<project>/project.json` | Project name and market |
| `lowcontent/<project>/<id>.json` | One book |
| `theme/global.json` | Shared palette and font catalog (tee pipeline) |
| `types/lowcontent.ts` | Manifest types |
| `lib/lowcontent/specs.ts` | Trim, bleed, gutter, spine, cover math |
| `lib/lowcontent/theme.ts` | Palette and font lookup |
| `lib/lowcontent/metadata.ts` | Keyword, title, price, and age checks |
| `lib/lowcontent/books.ts` | Load and validate |
| `lib/lowcontent/templates.ts` | Page template catalog |
| `components/lowcontent/` | Interior, cover, scaled preview |
| `app/(browse)/lowcontent/` | `/lowcontent` and `/lowcontent/<id>` |
| `app/(print)/lowcontent/` | Sheets the exporter screenshots |
| `scripts/lowcontent.ts` | The four commands |
| `exports/lowcontent/` | PDFs, front PNG, preview PNGs |

## Commands

```bash
npm run lc:check
npm run lc:interior -- adhd-planner
npm run lc:cover -- adhd-planner
npm run lc:preview -- adhd-planner
npm run lc:interior -- --all
npm run lc:cover -- --all
npm run lc:preview -- --all
```

`lc:check` does not launch a browser. It checks every manifest, the reference trim sizes, the spine formula, the banned-font rule, and a few metadata fixtures.

`lc:interior` writes `exports/lowcontent/<id>-interior.pdf`.

`lc:cover` writes `exports/lowcontent/<id>-cover.pdf` (full wrap) and `exports/lowcontent/<id>-front.png` (front trim only, for the listing image).

`lc:preview` writes `exports/lowcontent/previews/index.png` and `exports/lowcontent/previews/<id>.png`.

The renderer starts `next dev` on port 4314 unless you pass `--base-url`. Chromium is installed once with `npx playwright install chromium`. Screenshots are 300 pixels per inch and placed on a PDF page of the exact point size. Text is rasterized, so the PDF has no font objects left to embed. That meets the 300 DPI image rule. It does not produce selectable type.

Preview in the app:

```bash
npm run dev
```

Open `/lowcontent`, then a book. `/lowcontent/<id>/print`, `/cover`, and `/front` are the unscaled sheets.

Wireframe guides (trim line, safe-zone dash, spine line, barcode label) are drawn on `/lowcontent/<id>` only. The print PDFs do not include them. The barcode area is still painted white on the cover PDF so the back cover stays empty there. The words "Barcode keep-out" and the dashed outline are preview-only.

## Data model

`author` is always `null`. This pipeline does not invent a pen name. KDP's details form still requires an author at upload ([Metadata Guidelines](https://kdp.amazon.com/en_US/help/topic/G201097560)).

```json
{
  "id": "adhd-planner",
  "project": "ND Books",
  "projectSlug": "nd-books",
  "market": "nd",
  "title": "ADHD-Friendly Daily Planner",
  "subtitle": "Weekly pages, a month grid, habits, and gratitude",
  "trim": "6x9",
  "pageCount": 24,
  "paper": "white",
  "ink": "premium-color",
  "bleed": true,
  "author": null,
  "theme": {
    "palette": "calm_sensory_pastel",
    "displayFont": "Fredoka",
    "supportingFont": "Work Sans"
  },
  "pages": [{ "template": "weekly-planner", "repeat": 2, "config": { "dated": true } }],
  "kdp": {
    "title": "...",
    "subtitle": "...",
    "keywords": ["seven", "phrases", "go", "in", "these", "seven", "slots"],
    "description": "...",
    "categories": [{ "label": "..." }, { "label": "..." }],
    "priceUsd": 9.99,
    "readingAge": null,
    "lowContent": true,
    "isbn": "none",
    "sexuallyExplicit": false
  }
}
```

`pageCount` must equal the sum of `repeat`. `theme.palette` is a name in the global theme (`calm_sensory_pastel`) or a market override id (`hockey`, `rally`, `cooking`). Fonts are named the same way.

`project` is an internal grouping name. The `/lowcontent` index shows it. The cover, spine, headers, and page text do not.

## nd-planner design system

The Design Bot spec (`nd-planner-design-spec.md`, 2026-10-30) was applied on top of the locked 120-page order. The bot did not open this repo and did not view competitor cover images, so the cover art is a judgment call.

Cover concepts, all at the computed wrap size (120 × 0.002252" spine, about 0.2702", full cover about 12.5202" × 9.25"):

| Variant | Command | What it draws |
|---|---|---|
| A Brain Tabs (default) | `npm run lc:cover -- nd-planner` | Browser tabs today / later / ideas / wins. Active tab pink. Navy `#1D3557` Fredoka title. Powder-blue back and spine. |
| B Bold brain dump | `npm run lc:cover -- nd-planner --variant b` | Type-only "brain dump" on butter `#FFE8A3`. |
| C Now / next / later | `npm run lc:cover -- nd-planner --variant c` | Three rounded bars. |

No project name is printed. Spine text is "ADHD Planner" at 8 pt. Finish in the spec is matte. This pipeline does not send a finish to KDP.

Fonts added to `theme/global.json` and loaded with `next/font`: Lexend (already on the poster layout, used for interior headers at 600) and Atkinson Hyperlegible Next (400 and 700) for labels and the time column. Fredoka and Work Sans stay on the cover. Licenses are OFL.

Interior margins on `nd-planner` only, measured from the trim: inside 0.625", outside 0.5", top 0.5", bottom 0.55". Those are above the KDP minimums for 120 pages with no bleed (inside 0.375", outside at least 0.25"), so `lc:check` accepts them. Other books keep the KDP minimums.

Line weights: frames 1 pt, emphasis boxes 2 pt. The spec asked for 0.5 pt writing lines. KDP's submission guidelines require lines of at least 0.75 pt ([Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950)). Writing lines and dots are 0.75 pt. Grey is only a 15% fill in a large battery cell, not under small type.

The spec's alternate 120-page allocation (56 daily pages, 8 weekly pages, and so on) was not applied. It disagrees with the research lineup already bound into `nd-planner.json`. Page order stays the table above.

`energy-check` is still built and not given its own sheet. Water, meals, and a medication log are still v2.

`market` is `nd`, `hockey`, `cooking`, or `rally`, matching `per_market_overrides` in the theme file.

Page templates: `title`, `belongs-to`, `contents`, `weekly-planner`, `monthly-planner`, `habit-tracker`, `lined`, `dot-grid`, `graph`, `gratitude`, `stats-tracker`, `recipe`, `meal-planner`, `logbook`, plus the ADHD planner templates below. Weekly, monthly, and meal pages take `config.dated`. Every template draws rules or text, so a page is not a blank sheet. Rules are at least 0.75 pt. Type is at least 7 pt. Black-ink books draw the interior in black on white. The cover still uses the named palette.

Samples:

| Id | Project | Trim | Interior |
|---|---|---|---|
| `adhd-planner` | ND Books | 6×9 | Dated and undated weeks and months, habits, gratitude, lined, dot grid |
| `stats-tracker` | Hockey Books | 8.5×11 | Stats tables and graph paper |
| `recipe-journal` | Kitchen Books | 8×10 | Recipe forms and a meal week |
| `pace-notes` | Rally Books | 5×8 | Stage log (distance, time, surface, car, notes) |

Copy is generic. No league, club, series, or manufacturer names. No puzzle piece. No diagnosis or treatment language. The ND books speak to ADHD adults without a cure or a care plan.

## 12-week planner (`nd-planner`)

`lowcontent/nd-books/nd-planner.json` is the full book. It does not replace the 24-page `adhd-planner` sample. That sample stays so the earlier templates still have a short book. `nd-planner` is the one to publish.

Trim 6×9, black ink, white paper, no interior bleed, 120 pages. Gutter is the 24–150 band (0.375"). Spine text is allowed because 120 is more than 79. The project name stays in the manifest.

The research lineup in `adhd-planner-pages.md` sums to 140 before the trim. Cutting 4 daily pages per 4-week block (12 pages) and 4 dot-grid notes leaves 124, not the 120 the note claims (140 − 12 − 4 = 124). This book keeps the 12-week shape the note asked for after that trim: 48 daily pages, 12 weekly overviews, and 12 weekly resets. Four more sheets are left out so the total is even and exactly 120:

- the two extra brain-dump pages at the back (two full dumps remain in the toolkit)
- one of the two habit trackers (one 14-day tracker remains)
- one of the three remaining dot-grid notes (two remain)

The optional mood-and-sleep page stays. `energy-check` is built and is not given its own sheet: the daily page has an energy box, and two low-energy pages follow. Water, meals, and a medication log are not built (v2).

Black-ink interiors are high contrast. Fonts still come from the theme (`Fredoka` and `Work Sans` on `calm_sensory_pastel`). `/lowcontent/nd-planner` shows every page as a thumbnail, grouped by heading.

| Order | Section | Template | Pages |
|---|---|---|---|
| 1 | Front matter | `title`, `belongs-to` | 2 |
| 2 | Quick start | `quick-start` (loop, then skip-ahead) | 2 |
| 3 | Toolkit | `dopamine-menu` example + blank, `task-reward`, `launch-shutdown` launch + shutdown, `day-routine` morning + evening, `low-energy` ×2, `decision-helper`, `body-double` | 11 |
| 4 | Capture | `brain-dump` ×2, `sort-page` ×2, `urgent-important` ×2 | 6 |
| 5 | Month and people | undated `monthly-planner` ×3, `appointments` ×2 | 5 |
| 6 | Projects | `project-planner` ×2, `tiny-step` ×4, `parking-lot` ×2 | 8 |
| 7 | Weeks 1–4 | each week: `weekly-overview`, `daily-plan` ×4, `weekly-reset` | 24 |
| 8 | Fresh start | `fresh-start` | 1 |
| 9 | Weeks 5–8 | same week pattern | 24 |
| 10 | Fresh start | `fresh-start` | 1 |
| 11 | Weeks 9–12 | same week pattern | 24 |
| 12 | Fresh start | `fresh-start` | 1 |
| 13 | Monthly reviews | `monthly-review` ×3 | 3 |
| 14 | Back matter | `habit-tracker` (14 days, 5 habits), `mood-sleep`, `focus-log` ×2, `wins-list` ×2, `dot-grid` ×2 | 8 |
| | **Total** | | **120** |

| Template | v1 in `nd-planner` | Notes |
|---|---|---|
| `quick-start`, `brain-dump`, `sort-page`, `daily-plan`, `weekly-overview`, `weekly-reset`, `tiny-step`, `dopamine-menu`, `task-reward`, `launch-shutdown`, `urgent-important`, `monthly-review`, `fresh-start`, `low-energy`, `body-double`, `decision-helper`, `parking-lot`, `wins-list`, `day-routine`, `focus-log`, `appointments`, `project-planner`, `mood-sleep` | yes | New. Existing `title`, `belongs-to`, `monthly-planner`, `habit-tracker`, and `dot-grid` are reused. |
| `energy-check` | built, not bound in | Daily energy box plus the low-energy pages cover this job. |
| Water, meals, medication log | no | v2. Not built. |

## Specs

Fetched 2026-10-31 unless noted. Page caps below are only the four trims this pipeline renders.

### Trim and page count

Source: [Set Trim Size, Bleed, and Margins](https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6) and the same table on [Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950).

A large trim is wider than 6.12 inches or taller than 9 inches. That changes printing cost. It does not, by itself, change the page cap. 8×10 is a large trim and still allows 828 white pages. 8.5×11 is the size with the 590 / 550 caps.

| Trim | Black, white | Black, cream | Black, groundwood | Standard color, white | Premium color, white |
|---|---|---|---|---|---|
| 5×8 | 24–828 | 24–776 | 24–812 | 72–600 | 24–828 |
| 6×9 | 24–828 | 24–776 | 24–812 | 72–600 | 24–828 |
| 8×10 | 24–828 | 24–776 | 24–812 | 72–600 | 24–828 |
| 8.5×11 | 24–590 | 24–550 | 24–578 | 72–600 | 24–590 |

Color columns are headed "white paper". Cream or groundwood with color ink is rejected. KDP rounds an odd manuscript up to an even page count ([Fix Paperback and Hardcover Formatting Issues](https://kdp.amazon.com/en_US/help/topic/G201834260)). An odd `pageCount` is a warning.

Hardcover page caps are a different table (minimum 75 on the sizes that were listed). This pipeline does not render hardcovers.

### Bleed and interior page size

Bleed is 0.125 inches on the top, bottom, and outside edge. The binding edge has no bleed. With bleed, page width is trim + 0.125" and page height is trim + 0.25". If any interior page bleeds, the whole file must ([trim help](https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6)).

| Trim | With-bleed page | Points |
|---|---|---|
| 5×8 | 5.125" × 8.25" | 369 × 594 |
| 6×9 | 6.125" × 9.25" | 441 × 666 |
| 8×10 | 8.125" × 10.25" | 585 × 738 |
| 8.5×11 | 8.625" × 11.25" | 621 × 810 |

The help page prints 5.5×8.5 with bleed as 5.626" × 8.75". This pipeline does not offer 5.5×8.5. For the four sizes above, the published with-bleed size matches trim + 0.125" / + 0.25" exactly.

### Margins and gutter

From the trim edge ([trim help](https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6)):

| Pages | Inside (gutter) | Outside, no bleed | Outside, with bleed |
|---|---|---|---|
| 24–150 | 0.375" | at least 0.25" | at least 0.375" |
| 151–300 | 0.5" | at least 0.25" | at least 0.375" |
| 301–500 | 0.625" | at least 0.25" | at least 0.375" |
| 501–700 | 0.75" | at least 0.25" | at least 0.375" |
| 701–828 | 0.875" | at least 0.25" | at least 0.375" |

Outside margins do not have to match each other. This renderer uses the minimum on the top, bottom, and outside, measured from the trim, then adds the bleed strip outside that. Odd pages bind on the left. Even pages bind on the right. The same help page says to enter the inside value in both the inside-margin field and the gutter field when a program has both.

### Spine and cover

[Create a Paperback Cover](https://kdp.amazon.com/en_US/help/topic/G201953020) and [Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950):

- Cover width = 0.125" + back + spine + front + 0.125"
- Cover height = 0.125" + trim height + 0.125"
- White paper: page count × 0.002252"
- Cream paper: page count × 0.0025"
- Groundwood: page count × 0.00235" (submission page)
- Premium color: page count × 0.002347"
- Standard color: page count × 0.002252" on the cover page

The submission page states one color factor, 0.002347", and does not split standard and premium. `lc:check` warns on standard-color books. Samples use premium color, where both pages agree.

Spine text is drawn only when the page count is greater than 79. The cover page says both "at least 79" and "more than 79", and Cover Creator uses 80. The submission page says "more than 79". Staying above 79 satisfies all three. Spine text keeps 0.0625" (1.6 mm) from each spine edge. The samples are 24 pages, so they have a spine and no spine text.

Cover text sits at least 0.25" inside the trim. The submission page requires 0.25" from the outside edge. The cover page's text section says 0.125". This pipeline uses 0.25".

The cover page also says spine shift of 0.0125" (3.2 mm) is acceptable. 0.0125 inches is about 0.3 mm, not 3.2 mm. 3.2 mm is 0.125". The inch/millimeter pair on that line does not match. It is not used as a layout inset.

### Barcode

[Low-Content Books](https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM): if you publish without an ISBN, or you do not supply a barcode, KDP places one in a 2" × 1.2" white box in the lower right of the back cover. Text or objects there can be rejected.

[Barcodes](https://kdp.amazon.com/en_US/help/topic/G5HDYGP4BXLX4RUW): a barcode you supply yourself is at least 0.25" from the spine and the trim, on a solid white field. Suggested size 2" × 1.2". Minimum 1.4" × 0.8". This pipeline does not draw a barcode. It reserves the 2" × 1.2" box, inset 0.25" from the bottom trim and 0.25" from the spine (the back cover's right edge on a left-to-right wrap).

### PDF

From the submission guidelines, unless noted:

- Interior with bleed must be PDF. Cover is one PDF of back + spine + front ([cover help](https://kdp.amazon.com/en_US/help/topic/G201953020)).
- Single pages, not spreads.
- No crop marks, trim marks, bookmarks, comments, annotations, or file security.
- Images at least 300 DPI. Recommended maximum 600 DPI.
- File size at most 650 MB. Cover recommendation is 40 MB or less.
- Fonts embedded, transparencies flattened. These raster PDFs have no font objects and no transparency.
- Minimum type 7 pt. Minimum rule 0.75 pt.
- Even page numbers on the left, odd on the right.
- No more than 4 consecutive blank pages in the middle, or 10 at the end ([formatting help](https://kdp.amazon.com/en_US/help/topic/G201834260)).
- Gray backgrounds on black ink should be at least 10% gray. Samples are premium color, not black ink.

### Low-content rules

[Low-Content Books](https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM), fetched 2026-10-31:

- Minimal or no interior content, generally repetitive, filled in by the reader. Examples include notebooks, planners, journals, prompt journals, and log books.
- Check the Low-content box under Categories. A different box, or no box, gets the book rejected. `kdp.lowContent: true` is the local record of that checkbox. Nothing here clicks it.
- ISBN is optional. Choose "Publish without an ISBN" (`isbn: "none"`) or "Use my own ISBN" (`isbn: "own"`). A free KDP ISBN is not eligible.
- No release date. No series. No Expanded Distribution. Look Inside is not offered without your own ISBN.
- The ISBN choice cannot be changed after publishing without unpublishing.
- The metadata page agrees that paperbacks need an ISBN except for low-content books ([G201097560](https://kdp.amazon.com/en_US/help/topic/G201097560)).

[Content Guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390): the publisher is responsible for copyright and trademark. The validator rejects a short watch list (league and series names, car makes, puzzle piece, diagnosis and treatment words). It is not a clearance search.

### Metadata

| Field | Rule | Source |
|---|---|---|
| Title + subtitle | Fewer than 200 characters | [G201097560](https://kdp.amazon.com/en_US/help/topic/G201097560) |
| Long title | Warning over 60 characters | [G201298500](https://kdp.amazon.com/en_US/help/topic/G201298500) |
| Description | 4,000 characters. No URL, email, phone, review, testimonial, or price | [G201189630](https://kdp.amazon.com/en_US/help/topic/G201189630) |
| Keywords | 7 boxes. Live page does not state the character cap | [G201298500](https://kdp.amazon.com/en_US/help/topic/G201298500) |
| Keyword length | 50 characters per box, error. 210 UTF-8 bytes combined, warning | [2020 companion PDF](https://m.media-amazon.com/images/G/01/kindle-publication/webinars/Companion_for_Discovering_Metadata_2020.pdf). The live page no longer prints these numbers |
| Categories | This pipeline stores 2. The form allows up to 3 | [G201097560](https://kdp.amazon.com/en_US/help/topic/G201097560) |
| Price | Amazon.com paperback maximum 250 USD. Minimum is printing cost / royalty (50% or 60%), not calculated here | [G201834340](https://kdp.amazon.com/en_US/help/topic/G201834340) |
| Reading age | Optional. Null in the samples. The old 18+ maximum was removed | [G201506310](https://kdp.amazon.com/en_US/help/topic/G201506310), [G200652170](https://kdp.amazon.com/en_US/help/topic/G200652170) |
| Sexually explicit | Required Yes/No on the form. Samples are false | [G201097560](https://kdp.amazon.com/en_US/help/topic/G201097560) |

Category labels are not checked against the live picker. BISAC codes are optional and unchecked against the BISAC list.

## How it sits in the multi-bot flow

1. Research bot picks a project and a market (`ND Books`, `Hockey Books`, `Kitchen Books`, `Rally Books`) and writes the seven keywords, two categories, description, and price.
2. Designer names a palette and two fonts from the global theme. No hex codes in the book manifest.
3. Metadata writer fills the `kdp` block and sets `isbn` to `none` or `own`.
4. Exporter runs `lc:check`, then `lc:interior`, `lc:cover`, and `lc:preview`.

The tee renderer and the mug renderer share the theme file. This pipeline does not render shirts or mugs.

## Differences from the books pipeline

- Own folder, types, commands, routes, and export directory.
- No cheat-sheet pages and no `content: "standard"`.
- Theme colors and named fonts, instead of the grayscale wireframe.
- Wrap cover, spine math, and a front PNG. The wireframe doc left covers as a follow-up.
- Price, reading age, and the sexually-explicit flag are in the metadata block.
- Print PDFs omit the dashed guides. The wireframe still draws them on the sheet.
- Page caps include 5×8 and 8×10, and the color-ink columns. The wireframe modeled black ink on three trims.

## Gaps and open decisions

1. Author. Manifests store `null`. The upload form still requires a name. Decide the pen name, or confirm a publisher name that is allowed to stand in.
2. ISBN. Samples use `none`. Say if any title should use an ISBN you already own. The choice locks after publish.
3. Standard-color spine factor. Cover page 0.002252", submission page 0.002347" for all color. Confirm in the cover calculator if a book uses standard color.
4. Spine text at exactly 79 pages. Sources disagree. This code allows spine text only above 79.
5. Keyword caps of 50 characters and 210 bytes come from the 2020 companion, not the live keyword page.
6. Two categories are stored. KDP currently allows three. Say if the block should grow to three.
7. Prices are placeholders. The minimum depends on the printing-cost calculator, which is not called.
8. Reading age is empty. Say if a book should set one. Do not use the removed 18+ maximum without checking the form.
9. Category strings must be picked in the KDP picker for the primary marketplace. Samples assume Amazon.com and do not store the marketplace.
10. Cover finish (matte or glossy) is not stored.
11. Raster PDFs are 300 DPI images. Selectable text and a smaller file would need a vector exporter.
12. `fontIssue` allows every face in the shared catalog, including market override faces, on every book. It does not limit Graduate to hockey or Racing Sans One to rally.
13. The cover page's "0.0125 inch (3.2 mm)" spine-shift line is internally inconsistent. Not used.
14. Groundwood is in the spec tables and not used by a sample.
15. Trademark clearance is a word list, not a search. "NEUROSPICY" is a watch item in the theme file and is not used in the samples.
16. A+ Content images and the Look Inside limitation (no ISBN) are upload steps, not files this repo builds.
