# Etsy listing research agent

`.claude/agents/etsy-listing-researcher.md` is a Claude Code subagent. It researches Etsy and Amazon for a poster, rewrites the poster's `etsy` block, and writes its evidence to a `research` block. A listing it leaves behind passes `npm run listing:check -- --strict`, and the Printify sync (`docs/PRINTIFY-PIPELINE.md`) uploads it as is.

## Using it

In Claude Code, from this repo:

> Use the etsy-listing-researcher agent on dev-realities

> Use the etsy-listing-researcher agent on zodiac-signs sagittarius

If you name no posters, the agent works on the ones `listing:brief --needs-work` lists. Those are posters that fail the check or have no research yet. The agent edits only `etsy` and `research`. It never syncs, commits, or pushes, so review its diff before you run `printify:sync`.

## Which posters it works on

- **Saved and listed:** the poster was saved with **Save for Etsy listing** and has `etsy` copy. It is checked and researched.
- **Saved, no `etsy` block:** `listing:check` fails with "Saved for listing but has no etsy block". `--needs-work` lists it, and the agent writes its listing from scratch.
- **Not saved, no `etsy` block:** skipped; it is not for sale yet.
- **Sizes:** `listing:brief` reports the saved sizes, and the agent keeps the description's size bullets to those.

## Tools it runs

```bash
npm run listing:brief -- dev-realities --needs-work   # what to work on
npm run listing:brief -- dev-realities vim-wq         # artwork, product facts, current listing
npm run listing:check -- --all                        # errors fail; warnings shown
npm run listing:check -- dev-realities vim-wq --strict  # warnings fail too (the agent's gate)
npm run listing:check -- --all --json                 # machine-readable
```

`lib/etsyListing.ts` holds the one set of rules. `listing:check` and `printify:check` / `printify:sync` both use it.

| Rule | Level |
|---|---|
| `etsy` has exactly `title`, `description`, `tags`, `category`, with the right types | error |
| Title is 1–140 characters, with no stray or double spaces | error |
| 1–13 tags; each tag 1–20 characters of letters, numbers, spaces, `'` and `-`; tags unique ignoring case | error |
| Description and category are not empty | error |
| `research` matches the structure below, has at least one source URL, and has a YYYY-MM-DD date | error |
| Fewer than 13 tags; `%` `:` `&` used more than once in the title; more than 3 all-caps words; a word repeated 3+ times | warning |
| Primary keyword missing from the first 60 title characters; no `research`; research older than 180 days | warning |

## The `research` block

It lives in the poster JSON next to `etsy`, and it is typed as `PosterResearch` in `types/poster.ts`. It is never uploaded.

```json
"research": {
  "researchedAt": "2026-11-01",
  "method": "search-results",
  "primaryKeyword": "vim poster",
  "etsy":   { "searchPhrases": [], "competitorNotes": [], "priceRange": { "min": 0, "max": 0, "currency": "USD" } },
  "amazon": { "searchPhrases": [], "competitorNotes": [] },
  "sources": ["https://www.etsy.com/market/vim_poster"],
  "notes": "optional"
}
```

- `method` is `pages` when the agent could read listing pages, and `search-results` when it only had web-search snippets.
- `priceRange` is optional. The agent fills it in only when it saw at least two prices for comparable physical posters.
- The agent treats Etsy `/market/<phrase>` URLs as search phrases Etsy has indexed. Amazon is used only for buyer vocabulary and positioning.

`posters/dev-realities/vim-wq.json` is a worked example.

## Network

The session that built this could run web search, but `www.etsy.com` and `www.amazon.com` were not on its network allow-list. The agent detects that, does not retry, and records `method: "search-results"`. Allow those hosts if you want it to read listing pages directly.
