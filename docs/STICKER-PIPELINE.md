# Sticker pipeline

Stickers are existing poster designs reflowed onto a square or rectangle, sold as Printify Kiss-Cut, Square, or Bumper stickers.

## Product

| | Kiss-cut (default) | Square |
|---|---|---|
| Blueprint | `400` | `384` |
| Print provider | `99`, Printify Choice | `99`, Printify Choice |
| 3" × 3" white, $4.50 | variant `45750` | variant `45742` |
| 4" × 4" white, $5.50 | variant `45752` | variant `45744` |
| Print areas | 832 and 1113 px | 832 and 1113 px |
| US shipping | $4.29 first, $0.09 extra | $4.29 first, $0.09 extra |

Both types and sizes use one 1113 × 1113 PNG.

The rectangular layouts are both Printify Bumper Stickers, each its own product and print file:

| | Rectangle | Bumper |
|---|---|---|
| Blueprint | `598` | `598` |
| Print provider | `99`, Printify Choice | `99`, Printify Choice |
| Size and variant | 7.5" × 3.75", `71929` | 11" × 3", `71930` |
| Price | $9.00 | $11.00 |
| Print file | 2321 × 1196 px | 3371 × 971 px |
| US shipping | $5.29 first, $0.07 extra | $5.29 first, $0.07 extra |

Printify also offers 15" × 3.75" (`71931`, 4571 × 1196 px). It is nearly the same shape as 11" × 3", so it isn't set up.

Shipping is from the catalog on 2026-11-01.

These settings are in `printify/stickers.json`. The shop id and publish flags come from `printify/config.json`.

The prices are an estimate. Printify only shows the production cost once a product exists, so check the first draft and adjust.

Printify describes Kiss-cut and Square as glossy vinyl for indoor use, **not waterproof**. It describes Bumper Stickers as matte, laminated, water-resistant vinyl for indoor or outdoor use, with a waterproof adhesive. `sticker:check` and `sticker:sync` reject a listing that says waterproof, so call bumper stickers water-resistant.

## Files

```
stickers/<projectId>/<posterId>/sticker.json   type and studio choices: fonts, colors, sizes, alignment; `layouts` holds each rectangle's own sizes
stickers/<projectId>/<posterId>/etsy.json      its own listing: { etsy, research }, null until written
stickers/<projectId>/<posterId>/exports/       <posterId>.png
```

The folder names point at the poster, `posters/<projectId>/<posterId>/`, which supplies the text and graphics. The look comes from the studio's URL, then `sticker.json`, then the poster's saved export, then the poster's defaults.

Colors and fonts carry across types. Sizes and alignment don't: Kiss-cut and Square share one set, and Rectangle and Bumper each have their own.

A kiss-cut sticker with a window design is cut around the window, not the canvas: its print file has a transparent background, the window fills more of the canvas, and the background color control has no effect. Printify's cut follows the transparency. A design with separate pieces, such as a row of pictograms, can get the same tight cut around a solid panel with `"cut": "panel"` in `sticker.json`. Other kiss-cut designs have an opaque background, so they are cut around the whole canvas. Confirm the line on a Printify mockup before publishing.

On a rectangle, an icon or a compact graphic sits to the left of the text. Windows, overlays, and full-width graphics stay stacked, and windows lose their offset shadow.

To add a sticker, create the folder with `{}` in `sticker.json`, run `npm run sticker:fit -- <projectId> <posterId>`, then customize it in the studio. `sticker:fit` measures the largest sizes that fit each rectangle and never replaces sizes it finds saved.

## Workflow

1. **Customize:** run `npm run dev` and open `/stickers`, then a sticker. Choose Kiss-cut, Square, Rectangle, or Bumper and adjust fonts, colors, and sizes. The dashed kiss-cut line is an estimate until a Printify mockup confirms it.
2. **Save:** use **Export Sticker → Save for Etsy listing**, which writes the print file and your choices. **Download PNG** only saves a copy to your computer. Art too close to the edge is not exported. `npm run sticker-art -- --all` rebuilds every print file from the saved choices.
3. **Write listings:** fill in each `etsy.json`, in the same format as a poster's.
4. **Check:** `npm run sticker:check`.
5. **Draft:** `npm run sticker:sync -- <projectId> [id...] --dry-run`, then again without `--dry-run`.
6. **Publish:** review the draft in Printify, then publish there or add `--publish`.

Synced stickers are kept in `printify/state.json` under `stickers/<projectId>/<posterId>`, so a re-run updates the same draft. A sticker has one type, one print file, and one product at a time. A product can't change type: to switch, delete it in Printify and clear its entry.

## Deleting

**Delete** on a sticker or poster page removes the item's folder after a confirmation. It is local only. If the item has a Printify product, a second warning says the product and any Etsy listing stay up, and confirming drops the pipeline's record of it, so delete the product in Printify first. A poster with a sticker can't be deleted until the sticker is. Git can restore tracked files until the deletion is committed, but print files that were never committed are gone.
