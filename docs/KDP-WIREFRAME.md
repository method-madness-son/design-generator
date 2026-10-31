# KDP interior wireframe

Unbranded paperback interiors for logbooks, journals, and cheat-sheet books. This is a first wireframe: grayscale pages, labeled blanks, and placeholder copy. It does not list a book, upload a file, or apply a brand.

Poster, Etsy, and Pinterest code is unchanged aside from a home-page link and a layout split so the print route is not padded by the poster chrome. Sample poster projects were not edited.

## What was reused, and what was not

`method-madness-son/usefulcheatsheets-web` was **not readable** from this environment. The GitHub API returned 404 for that private repo, so none of its source was copied.

The module follows the pipeline that repo is described as having, and the sizes published by KDP:

| Piece | In this repo | From the other repo |
|---|---|---|
| `npm run book-pdf` | `scripts/book-pdf.ts` screenshots `/kdp/[bookId]/print` with Playwright and builds a PDF with pdf-lib | Same job as `lib/book-pdf.mjs`. The script itself was not readable, so it was rewritten |
| Browser launch and PDF boxes | `scripts/book-pdf.ts` plus `printBoxes()` in `lib/kdpSizes.ts` | Described as `launchBrowser`, `createPdf`, and `setPrintBoxes` in `lib/shared.mjs`. Those functions were not readable |
| Page size | Per-manifest trim. 8.5×11 with bleed is 621×810 pt, which matches the size that repo hardcoded | That repo hardcoded 8.5×11. The point size was the check that this formula matches it |
| Manifest | One JSON file per book in `kdp/` | Described as `lib/books.ts`. The type was not readable |
| Metadata | `kdp` block: title, subtitle, description, categories, 7 keywords | Described as `lib/kdp-metadata.ts` (title, subtitle, BISAC, categories, 7 keywords). The validator was rewritten against KDP Help |
| Cover, wraparound, back cover, Kindle EPUB | Not built | The other repo emits them. Left as a follow-up |
| Puzzle PDFs, video stills, Pinterest promo | Not built | Left in the other repo |

## Layout

| Path | Role |
|---|---|
| `kdp/<bookId>.json` | Book manifest |
| `types/kdp.ts` | Manifest and page types |
| `lib/kdpSizes.ts` | Trim, bleed, gutter, PDF boxes |
| `lib/kdpMetadata.ts` | Metadata validator |
| `lib/kdpBooks.ts` | Load, expand `repeat` and templates, validate |
| `lib/kdpTemplates.ts` | Low-content page template catalog |
| `components/kdp/BookSheet.tsx` | One interior page |
| `app/(browse)/kdp/` | Index and on-screen preview |
| `app/(print)/kdp/[bookId]/print/` | Sheets the PDF renderer screenshots |
| `scripts/book-pdf.ts` | `npm run book-pdf` |
| `exports/kdp/*-interior.pdf` | Generated sample interiors |

## Render a sample

```bash
npm run kdp:check
npm run book-pdf -- generic-log-book
npm run book-pdf -- mileage-maintenance-log
npm run book-pdf -- gratitude-habit-tracker
npm run book-pdf -- track-day-logbook
npm run book-pdf -- hockey-stats-tracker
npm run book-pdf -- --all
```

`kdp:check` confirms the published point sizes and that every manifest validates. It does not launch a browser.

`book-pdf` starts `next dev` on port 4312 (unless you pass `--base-url`), opens the print route, screenshots each sheet at 300 pixels per inch, and writes `exports/kdp/<bookId>-interior.pdf`.

Preview in the app:

```bash
npm run dev
```

Open `/kdp`, then a book. The print route (`/kdp/<bookId>/print`) is the unscaled sheet stack; it is there for the renderer, not for reading.

Chromium has to be installed once:

```bash
npx playwright install chromium
```

## Sample books

Each sample is 24 pages, the paperback minimum, so the gutter is the 24–150 page band (0.375"). The first three are built only from the low-content template catalog. The last two are the original wireframe interiors, now classified as low-content because they are log books.

| File | Idea it stands in for | Trim | ISBN choice |
|---|---|---|---|
| `kdp/generic-log-book.json` | Generic log book: dated log, undated log, checklist, lined, dot-grid, square-grid | 5.5×8.5, with bleed | `none` |
| `kdp/mileage-maintenance-log.json` | Mileage log and maintenance log | 6×9, with bleed | `own` |
| `kdp/gratitude-habit-tracker.json` | Gratitude log and weekly habit tracker | 6×9, with bleed | `none` |
| `kdp/track-day-logbook.json` | Sim-racing track day / HPDE logbook | 6×9, with bleed | `none` |
| `kdp/hockey-stats-tracker.json` | Hockey stats tracker | 8.5×11, with bleed | `none` |

Titles, subtitles, descriptions, and keywords are placeholders. No league, team, or manufacturer names.

`5.5x8.5` with bleed is 405×630 pt. `generic-log-book` uses it. Change a manifest's `trim` and re-run `book-pdf` to try another size. The page count, and the gutter that follows it, come from the expanded templates.

## Page types

A manifest `pages` array expands in order. `repeat` duplicates that template.

| `type` | What it draws |
|---|---|
| `title` | Title page. Uses the metadata title and subtitle unless the page overrides them |
| `copyright` | Placeholder rights page. Not a real copyright notice |
| `log` | Dated (`dated: true`) or undated log. Labeled blank fields and an optional ruled grid |
| `stats` | Stats tracker table with blank write-in cells |
| `notes` | Ruled notes page |
| `cheatsheet` | Sections of label / placeholder-value rows |
| `checklist` | Checkbox list |
| `paper` | Notebook paper. `style` is `lined`, `dot`, or `grid` |
| `habit` | Habit names down the side, day columns across (1–31) |

A page may instead be a template reference. The loader copies the catalog page, then applies `repeat` and an optional `heading`.

```json
{ "template": "mileage-log", "repeat": 40, "heading": "Placeholder trip log" }
```

Template ids live in `lib/kdpTemplates.ts`: `title`, `copyright`, `dated-log`, `undated-log`, `checklist`, `lined`, `dot-grid`, `square-grid`, `habit-tracker`, `mileage-log`, `maintenance-log`, `gratitude-log`. To change the fields, write a `type` page instead of a template reference. A template reference accepts only `template`, `repeat`, and `heading`.

## Trim, bleed, and margins

Sources, fetched 2026-10-30, are cited in `lib/kdpSizes.ts`:

- [Set Trim Size, Bleed, and Margins](https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6)
- [Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950)

With bleed, every page is `(trim width + 0.125") × (trim height + 0.25")`. Bleed sits on the top, bottom, and outside edge. The binding edge has no bleed. Odd pages (recto) bleed on the right. Even pages (verso) bleed on the left. The PDF media box is that full page. The trim box is the finished page, mirrored the same way.

Outside margins are measured from the **trim** edge: 0.375" with bleed, 0.25" without. KDP's Word instructions type that same number into a page that is already enlarged by the bleed, which places text 0.125" closer to the knife. This wireframe keeps the full minimum inside the trim so type is not in the strip that gets cut off. A larger margin still meets the "at least" rule.

Gutter (inside margin), from the trim's binding edge, by page count:

| Pages | Gutter |
|---|---|
| 24–150 | 0.375" |
| 151–300 | 0.5" |
| 301–500 | 0.625" |
| 501–700 | 0.75" |
| 701–828 | 0.875" |

Black-ink page caps encoded here: 6×9 and 5.5×8.5 are 828 pages on white and 776 on cream. 8.5×11 is 590 on white and 550 on cream. 8.5×11 is a large trim (wider than 6.12" or taller than 9"). Color ink is not modeled.

Screenshots are `round(inches × 300)` pixels, so a half-pixel size such as 6.125" becomes 1838 px instead of 1837.5. The PDF page is the exact point size, and the image is scaled to that page. The difference is a fraction of a percent.

The gray band outside the white rectangle is the bleed. It is meant to be cut off. A dashed line marks the safe box. Both are wireframe guides.

## Low-content books

Sources below were fetched 2026-10-31.

A low-content book has minimal or no content on the interior pages. The pages are generally repetitive and designed to be filled in by the reader. KDP's examples include notebooks, planners, diaries and journals, prompt journals, and log books for habits, activity, or thankfulness, plus coupon books, score cards, crafting templates, and blank sheet music. Puzzle books, coloring books, novels, nonfiction, manuals, and textbooks are not generally low-content. KDP notes that the lists have exceptions. Source: [Low-Content Books](https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM).

This repo records that choice as `content` on the manifest:

| `content` | Meaning |
|---|---|
| `low-content` | The book is a fill-in interior. `isbn` is required and must be `none` or `own`. |
| `standard` | Any other interior. Leave `isbn` off. A paperback still needs an ISBN at upload, and this wireframe still does not store the number. |

`npm run kdp:check` rejects a low-content book whose `isbn` is `kdp` or missing. A free KDP ISBN is not eligible ([Low-Content Books](https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM), [Get an ISBN](https://kdp.amazon.com/en_US/help/topic/GTJ8LBXL6Z4WV5QX)). The same check still runs trim, bleed, gutter, the 24-page minimum, the paper page cap, and the metadata validator.

### Define a book

Put a JSON file at `kdp/<id>.json`. The filename, the `id`, and the slug rules are unchanged. Point `pages` at templates and set `repeat` high enough that the expanded interior has at least 24 pages. The gutter band is chosen from that expanded count.

```json
{
  "id": "mileage-maintenance-log",
  "market": "generic",
  "format": "kdp-logbook",
  "content": "low-content",
  "isbn": "own",
  "trim": "6x9",
  "bleed": true,
  "paper": "white",
  "ink": "black",
  "kdp": { "title": "...", "subtitle": "...", "description": "...", "categories": [], "keywords": [] },
  "pages": [
    { "template": "title" },
    { "template": "copyright" },
    { "template": "mileage-log", "repeat": 40 },
    { "template": "maintenance-log", "repeat": 8 }
  ]
}
```

The `kdp` object in that snippet is abbreviated. A real file needs one or two categories and exactly seven keywords. Then:

```bash
npm run kdp:check
npm run book-pdf -- mileage-maintenance-log
```

The PDF is `exports/kdp/mileage-maintenance-log-interior.pdf`. Preview at `/kdp`.

### No separate no-content type

KDP's current help does not list a separate no-content product. The low-content article is the page that covers interiors with minimal or no content, and notebooks are in its examples. This pipeline uses one value, `low-content`, for that whole set.

Blank pages are still limited. KDP allows no more than 4 consecutive blank pages at the beginning or middle of a manuscript, and no more than 10 at the end ([Fix Paperback and Hardcover Formatting Issues](https://kdp.amazon.com/en_US/help/topic/G201834260), and the same line on [Save Your Manuscript File](https://kdp.amazon.com/en_US/help/topic/G202145060)). The lined, dot-grid, and square-grid templates draw marks on every page, so they are not blank pages. The catalog has no empty page, and `repeat` should not be used to pad a book with empty sheets.

Manuscript lines should be at least 0.75 pt ([Save Your Manuscript File](https://kdp.amazon.com/en_US/help/topic/G202145060)). Checklist boxes, habit rules, and the notebook-paper templates use that weight. Older page types, the dashed safe box, and the gray bleed band are still wireframe guides.

### The Low-content box, ISBN, and metadata

On the bookshelf, under Categories, check the Low-content box. KDP says the book is rejected if that box is left clear or a different box is selected ([Low-Content Books](https://kdp.amazon.com/en_US/help/topic/GGE5T76TWKA85DJM)). `content: "low-content"` is the local record of that flag. Nothing in this repo checks the box.

Print ISBN, from the same page:

| Manifest `isbn` | Bookshelf choice | What else changes |
|---|---|---|
| `none` | Publish without an ISBN | Look Inside and the back-cover thumbnail are unavailable. KDP places a barcode in a 2 in (50.8 mm) by 1.2 in (30.5 mm) white box at the lower right of the back cover. Leave that area empty once a cover exists. Transparency codes are not offered. Those codes are also retired for books created after November 2025. |
| `own` | Use my own ISBN | The cover can include a barcode or omit one. Look Inside can be available. The number is typed at upload and must match the manuscript if the manuscript prints it. This file does not store the number. |

The choice cannot be changed after publishing. Changing it means unpublishing the book and publishing it again. Release Date is not offered. Expanded Distribution is not supported for low-content books on either ISBN choice. Series are not eligible on either choice. The series rule is repeated in [Metadata Guidelines for Books](https://kdp.amazon.com/en_US/help/topic/G201097560): public domain and low-content books, such as notebooks and journals, are not eligible for a series.

That metadata page also says a paperback or hardcover needs an ISBN, except for low-content books. Title, subtitle, description, and keyword limits are unchanged. The title field should not repeat generic keywords such as "notebook" or "journal". Sample titles use the product name once. An author is still required at upload. This wireframe still does not store an author, an imprint, or an ISBN number. A cheat-sheet page inside a low-content manifest produces a warning, because manuals and nonfiction are in KDP's "not generally low-content" column.

`mileage-maintenance-log` uses `isbn: "own"` so both choices appear in the samples. The other low-content samples use `isbn: "none"`.

### Public domain is a different program

These templates are original fill-in pages. They are not public-domain reprints, and a blank interior does not make a book a public-domain work.

[Publishing Public Domain Content](https://kdp.amazon.com/help/topic/G200743940), fetched 2026-10-31:

- Choose "This is a public domain work" under Publishing Rights when the book is a public-domain text that meets the differentiation rules. Copyright length differs by country.
- If a free version is already in the store, KDP only accepts a differentiated edition: an original translation, original annotations (study guide, critique, biography, or historical context), or 10 or more original illustrations relevant to the book.
- The title has to include `(Translated)`, `(Annotated)`, or `(Illustrated)`. A different parenthetical, such as an introduction credit, does not qualify.
- The description has to open with a bullet summary of what is original. The help page caps that summary at 80 characters.
- A linked table of contents, formatting changes, a collection, price, sales rank, and freely available internet content do not count as differentiation.
- Contributors are required. A translation credits the translator and the original author. An unknown translator is entered as "Anonymous".
- KDP may ask for proof that the content is in the public domain, and may refuse a text that is already available.
- Public-domain content is not eligible for every eBook royalty option or for KDP Select.

[Content Guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390) allow public-domain text and repeat the undifferentiated-title rule. [Expanded Distribution](https://kdp.amazon.com/en_US/help/topic/GQTT4W3T5AYK7L45) says distributors currently do not accept public-domain content, and also do not accept paperbacks of frequent lined or blank pages such as journals, notebooks, planners, and similar works. A low-content log is ineligible for Expanded Distribution either way.

## Metadata validator

`lib/kdpMetadata.ts` checks the `kdp` object:

| Field | Rule | Source |
|---|---|---|
| Title + subtitle | Together fewer than 200 characters | [Metadata guidelines](https://kdp.amazon.com/en_US/help/topic/G201097560) |
| Description | 1–4,000 characters, no URL or email | [Book description](https://kdp.amazon.com/en_US/help/topic/G201189630) |
| Keywords | Exactly 7, each at most 50 characters | [Keywords](https://kdp.amazon.com/en_US/help/topic/G201298500) and the [2020 metadata companion](https://m.media-amazon.com/images/G/01/kindle-publication/webinars/Companion_for_Discovering_Metadata_2020.pdf) |
| Categories | 1 or 2 labels, optional BISAC (`SPO020000`). A third is a warning | Bookshelf picker allows two |

A combined keyword length over 210 UTF-8 bytes is a **warning**. The 2020 companion states that cap. The current keyword help page does not.

A short licensing watch list (NHL, NASCAR, iRacing, Traxxas, and a few others) adds a warning. It is not a legal review.

## Intentionally missing

- Brand names, logos, colors, fonts, and cover art
- Full wraparound cover, spine math, and back-cover copy
- Kindle EPUB and cover image
- Author, imprint, and the ISBN number (low-content manifests store only the `none` / `own` choice)
- Vector text in the PDF (pages are 300 DPI screenshots, same approach as the other repo's book PDF)
- Series and contributor fields. Low-content books are ineligible for a series, so the field stays off those manifests on purpose
- Submitting the Low-content box, the ISBN choice, or the manuscript to KDP
- Color interiors
- Any change to Pinterest promo code

## Decisions for the owner

1. **Could not read usefulcheatsheets-web.** If that repo should be the source of the PDF helper, someone with access needs to diff `lib/shared.mjs` and `lib/book-pdf.mjs` against `scripts/book-pdf.ts`.
2. **Margins are measured from the trim**, which is stricter than typing 0.375" into Word's enlarged page. Say if the Word interpretation is the one you want instead.
3. **The 210-byte keyword total is a warning**, not a failure. The live help page no longer states it.
4. **Gray bleed and the dashed safe box print in the file.** They should come out before a real upload.
5. **Samples are 24 pages** so they meet the paperback minimum. Real logbooks will be longer, and the gutter steps up on its own from the expanded page count.
6. **5.5×8.5 is used by `generic-log-book`.** The other samples stay on 6×9 and 8.5×11.
7. **Books live in `kdp/<id>.json`**, the path from the working spec, rather than under `posters/`.
8. **No author field.** KDP requires one at upload time. It was left out so this pass stays unbranded.
9. **The original logbooks are classified `low-content` with `isbn: "none"`.** KDP's examples include log books. Say if the track-day or hockey tracker should be a standard paperback instead. Both files still have one cheat-sheet page, and `kdp:check` warns about that.
10. **`isbn` is the bookshelf choice, not the number.** `mileage-maintenance-log` is the sample that uses `own`. Say if every sample should use the same choice.
11. **Category count is unchanged.** The metadata guidelines page fetched 2026-10-31 says title setup offers up to three categories. This validator still warns on a third, from the earlier pass. Say if that warning should become the third allowed category.
12. **Notebook lines on the new templates are 0.75 pt.** The older page types and the dashed safe box are still 1 px hairlines, and the gray bleed still prints. Both should come out before a real upload.
13. **There is no `no-content` value.** Current KDP help folds blank interiors into low-content, and the blank-page cap still applies. Say if you want a separate manifest value anyway.
