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
| `lib/kdpBooks.ts` | Load, expand `repeat`, validate |
| `components/kdp/BookSheet.tsx` | One interior page |
| `app/(browse)/kdp/` | Index and on-screen preview |
| `app/(print)/kdp/[bookId]/print/` | Sheets the PDF renderer screenshots |
| `scripts/book-pdf.ts` | `npm run book-pdf` |
| `exports/kdp/*-interior.pdf` | Generated sample interiors |

## Render a sample

```bash
npm run kdp:check
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

Both are 24 pages, the paperback minimum, so the gutter is the 24–150 page band (0.375").

| File | Idea it stands in for | Trim |
|---|---|---|
| `kdp/track-day-logbook.json` | Sim-racing track day / HPDE logbook | 6×9, with bleed |
| `kdp/hockey-stats-tracker.json` | Hockey stats tracker | 8.5×11, with bleed |

Titles, subtitles, descriptions, and keywords are placeholders. No league, team, or manufacturer names.

`5.5x8.5` is a third trim in `lib/kdpSizes.ts` (with-bleed page 405×630 pt). Neither sample uses it. Change a manifest's `trim` and re-run `book-pdf` to try it.

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
- Author, imprint, and ISBN fields
- Vector text in the PDF (pages are 300 DPI screenshots, same approach as the other repo's book PDF)
- Low-content checkbox, series, and contributor fields
- Color interiors
- Any change to Pinterest promo code

## Decisions for the owner

1. **Could not read usefulcheatsheets-web.** If that repo should be the source of the PDF helper, someone with access needs to diff `lib/shared.mjs` and `lib/book-pdf.mjs` against `scripts/book-pdf.ts`.
2. **Margins are measured from the trim**, which is stricter than typing 0.375" into Word's enlarged page. Say if the Word interpretation is the one you want instead.
3. **The 210-byte keyword total is a warning**, not a failure. The live help page no longer states it.
4. **Gray bleed and the dashed safe box print in the file.** They should come out before a real upload.
5. **Samples are 24 pages** so they meet the paperback minimum. Real logbooks will be longer, and the gutter steps up on its own from the expanded page count.
6. **5.5×8.5 is supported but unused** by the two samples.
7. **Books live in `kdp/<id>.json`**, the path from the working spec, rather than under `posters/`.
8. **No author field.** KDP requires one at upload time. It was left out so this pass stays unbranded.
