This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## KDP interior wireframe

Grayscale paperback interiors live under `kdp/`. Low-content books (log books, trackers, journals, notebooks) are a first-class section: set `content` to `low-content`, repeat a template from `lib/kdpTemplates.ts`, and build the same way as any other interior. They are separate from the poster projects. See [docs/KDP-WIREFRAME.md](docs/KDP-WIREFRAME.md) for trim, bleed, gutter, the low-content rules, and what is intentionally missing (branding, cover, EPUB).

```bash
npm run kdp:check
npm run book-pdf -- generic-log-book
npm run book-pdf -- mileage-maintenance-log
npm run book-pdf -- gratitude-habit-tracker
```

Preview at `/kdp` while `npm run dev` is running. Sample PDFs are written to `exports/kdp/`.

## Tee print pipeline

Tee designs live under `tees/` and use the shared theme in `theme/global.json`. They are separate from poster projects. See [docs/TEE-PIPELINE.md](docs/TEE-PIPELINE.md).

```bash
npm run tee:check
npm run tee-art -- --all
npm run tee-preview -- --all
npm run tee-preview -- brain-tabs --shirt Black
```

Preview at `/tees` while `npm run dev` is running. Print PNGs go to `exports/tees/`. Wireframes go to `exports/tees/previews/`.

## Printify → Etsy poster sync

Uploads poster PNGs from `exports/posters/<project>/<poster>-<size>.png` to Printify, creates a product per poster using its `etsy` copy, and publishes to the connected Etsy shop. Token goes in `.env.local` as `PRINTIFY_API_TOKEN`; shop, blueprint, variants, and prices go in `printify/config.json`. See [docs/PRINTIFY-PIPELINE.md](docs/PRINTIFY-PIPELINE.md).

```bash
npm run printify:shops
npm run printify:catalog -- --search poster
npm run printify:check -- dev-realities
npm run printify:sync -- dev-realities vim-wq --dry-run
npm run printify:sync -- dev-realities vim-wq --publish
```

## Etsy listing research

A Claude Code subagent (`.claude/agents/etsy-listing-researcher.md`) researches Etsy and Amazon for a poster, rewrites its `etsy` block, and records the evidence in `research`. `listing:check` enforces the structure the Printify upload expects. See [docs/LISTING-RESEARCH.md](docs/LISTING-RESEARCH.md).

```bash
npm run listing:check -- --all
npm run listing:brief -- dev-realities --needs-work
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
