# Printify → Etsy poster sync

Uploads poster print files to Printify, creates one product per poster (one variant per size), and publishes it to the connected Etsy shop. Listing copy comes from each poster's `etsy` block in `posters/<project>/<poster>.json`.

| Path | Role |
|---|---|
| `scripts/printify.ts` | CLI: `shops`, `catalog`, `check`, `sync` |
| `lib/printify/client.ts` | REST client: auth, retries on 429/5xx, the endpoints below |
| `lib/printify/posters.ts` | Config/state files, print-file discovery, Etsy copy checks, product payload |
| `types/printify.ts` | Config, state, and API types |
| `printify/config.json` | Shop, blueprint, provider, variant id and price per size, publish flags |
| `printify/state.json` | Written by `sync`: image ids (with file hashes), product ids, publish times |

## One-time setup

1. In Printify, open **Manage my stores** and connect Etsy.
2. In Printify, open **My account → Connections** and create a Personal Access Token. Put it in `.env.local`, which is gitignored:

   ```
   PRINTIFY_API_TOKEN=eyJ...
   ```

3. Get the shop id (`GET /v1/shops.json`), then set `shopId` in `printify/config.json`. You can set `PRINTIFY_SHOP_ID` instead, and it takes precedence:

   ```bash
   npm run printify:shops
   ```

4. Choose the poster product. Nothing is hardcoded, because blueprint and provider ids have to come from your own catalog:

   ```bash
   npm run printify:catalog -- --search poster              # blueprint ids
   npm run printify:catalog -- --blueprint <id>             # print providers
   npm run printify:catalog -- --blueprint <id> --provider <id>   # variant ids + placeholder px
   ```

   Fill in `blueprintId` and `printProviderId`. For each size, set `variantId` to the variant whose placeholder matches that size, and set `priceCents` to the retail price in cents (`2400` is $24.00). A size you remove from `sizes` is not listed.

## Print files

`sync` reads `exports/posters/<projectId>/<posterId>-<size>.png`. Sizes are the keys of `lib/posterSizes.ts` (`8x10`, `11x17`). An example is `exports/posters/dev-realities/vim-wq-11x17.png`.

The studio's **Download current Etsy item** button saves `<project>-<poster>[-palette]-300dpi.png`. Choose the size with the Print Size picker, export, then rename the file into the layout above. Use `--dir <path>` to read from another folder that uses the same layout.

Each file must be exactly print inches × 300 px: 2400 × 3000 for 8×10 and 3300 × 5100 for 11×17. Files under 100 MB are accepted. Before uploading, `sync` also confirms that each variant's `front` placeholder has the same aspect ratio as the file.

## Running it

```bash
npm run printify:check -- dev-realities              # offline: config, files, Etsy copy
npm run printify:sync -- dev-realities vim-wq --dry-run --publish   # print payloads, send nothing
npm run printify:sync -- dev-realities vim-wq        # upload + create draft (review in Printify)
npm run printify:sync -- dev-realities vim-wq --publish   # ...and push to Etsy
npm run printify:sync -- dev-realities --publish     # every poster in the project
```

When you leave out poster ids, the whole project is synced. If any poster fails a check, the run stops before anything is sent.

## What each step sends

| Step | Endpoint | Payload / notes |
|---|---|---|
| 1 | `GET /v1/shops.json` | Lists shops. The Etsy shop has `sales_channel: "etsy"`. |
| 2 | `POST /v1/uploads/images.json` | `{ file_name, contents }` with base64 by default, or `{ file_name, url }` with `--image-base-url https://cdn.example.com/posters`, which resolves to `<base>/<projectId>/<file>`. Printify suggests URL uploads for files over about 5 MB, and the script warns when a file is larger. The response `id` is saved together with the file's SHA-256, so an unchanged file is never uploaded again. |
| 3 | `POST /v1/shops/{shop_id}/products.json` | `title`, `description`, and `tags` come from the poster's `etsy` block. Also sent: `blueprint_id`, `print_provider_id`, `variants: [{ id, price, is_enabled }]` with price in cents, and one `print_areas` entry per size, each with that size's image at `x: 0.5, y: 0.5, scale: 1, angle: 0`. If `state.json` already holds a product id for the poster, the product is updated with `PUT /v1/shops/{shop_id}/products/{product_id}.json` instead of being created again. |
| 4 | `POST /v1/shops/{shop_id}/products/{product_id}/publish.json` | The `publish` flags from the config: `title`, `description`, `images`, `variants`, `tags`, `keyFeatures`, and `shipping_template`, all `true`. **These fields are booleans, not content.** They tell Printify which product fields to push to Etsy. The actual title, description, tags, and mockup images are the ones set in step 3. |

When you edit a poster's copy or art and run `sync` without `--publish`, only the Printify draft changes. Run it again with `--publish` to push the change to Etsy.

## Checks

These match the mug and tee pipelines:

- Etsy title is 140 characters or fewer.
- There are 1 to 13 tags, each 1 to 20 characters, with no duplicates.
- Title and description are not empty.

`check` and `sync` refuse to run on a poster that fails any of these.

## Unverified

`developers.printify.com` could not be reached from the session that wrote this, so the field names come from the published API reference as remembered, not from a fresh read. The run was tested against a local mock only. Before the first real run, do a `--dry-run`, then a single poster without `--publish`, and inspect the draft in Printify.

- Rate limits are handled generically: on a 429 or 5xx, the script honors `Retry-After` or backs off exponentially. Printify's per-endpoint publishing limits are not encoded.
- The ~5 MB base64 guidance is a recommendation, not a confirmed hard limit.
- Etsy-side fields (shipping profile, production partner, category) are set in Printify/Etsy, not by this script.
