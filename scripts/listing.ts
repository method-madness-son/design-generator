/**
 * Etsy listing tools for posters, used by the etsy-listing-researcher agent and by hand.
 *
 *   npm run listing:check -- --all                     # saved posters and posters with an etsy block
 *   npm run listing:check -- dev-realities [vim-wq]    # one project or poster
 *   npm run listing:check -- --all --strict            # warnings fail too (agent's gate)
 *   npm run listing:brief -- dev-realities vim-wq      # what the poster shows + current listing
 *   npm run listing:brief -- dev-realities --needs-work   # posters that fail or lack research
 */
import { parseArgs } from 'node:util';
import { checkListing } from '@/lib/etsyListing';
import { savedSizesByPoster } from '@/lib/posterExports';
import { getPosterFile, getProject, getProjects, resolvePosterIds } from '@/lib/posterResolver';
import { POSTER_SIZES, type PosterSizeName } from '@/lib/posterSizes';
import type { PosterFile } from '@/types/poster';

type Target = { key: string; projectId: string; poster: PosterFile; sizes: PosterSizeName[] };

function targets(args: string[], all: boolean): Target[] {
  const projectIds = all ? getProjects().map((project) => project.id) : args.slice(0, 1);
  if (projectIds.length === 0) throw new Error('Pass a project id (and optional poster ids), or --all.');
  return projectIds.flatMap((projectId) => {
    const saved = savedSizesByPoster(projectId);
    return resolvePosterIds(projectId, all ? [] : args.slice(1)).map((id) => ({
      key: `${projectId}/${id}`,
      projectId,
      poster: getPosterFile(projectId, id)!,
      sizes: saved.get(id) ?? [],
    }));
  });
}

// Unsaved posters with no listing are ideas, not products, so they are skipped.
const forSale = (target: Target) => !!target.poster.etsy || target.sizes.length > 0;

function check(list: Target[], strict: boolean, json: boolean): boolean {
  const results = list.filter(forSale).map((target) => {
    const report = checkListing(target.poster, target.sizes);
    const ok = report.errors.length === 0 && (!strict || report.warnings.length === 0);
    return { poster: target.key, ok, savedSizes: target.sizes, ...report };
  });
  const failed = results.filter((result) => !result.ok).length;
  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return failed === 0;
  }
  for (const result of results) {
    if (result.ok && result.warnings.length === 0) continue;
    console.log(`\n${result.ok ? 'ok  ' : 'FAIL'} ${result.poster}`);
    for (const error of result.errors) console.log(`  error: ${error}`);
    for (const warning of result.warnings) console.log(`  warning: ${warning}`);
  }
  const saved = results.filter((result) => result.savedSizes.length > 0).length;
  console.log(
    `\n${results.length - failed}/${results.length} listings pass${strict ? ' (strict)' : ''}; ` +
      `${saved} saved for listing; ${list.length - results.length} ideas (unsaved, no etsy block) skipped.`,
  );
  return failed === 0;
}

// One line per poster the research agent should work on.
function needsWork(list: Target[]): void {
  for (const target of list.filter(forSale)) {
    const { errors } = checkListing(target.poster, target.sizes);
    if (target.poster.etsy && errors.length === 0 && target.poster.research) continue;
    const state = target.poster.etsy ? `${errors.length} errors\t${target.poster.research ? 'researched' : 'no research'}` : 'saved, no etsy block';
    console.log(`${target.key}\t${state}\t${target.sizes.length > 0 ? `saved ${target.sizes.join(',')}` : 'not saved'}`);
  }
}

function brief(list: Target[]): void {
  for (const { key, projectId, poster, sizes } of list) {
    const project = getProject(projectId);
    const brief = {
      poster: key,
      // The agent edits only the listing file; the design is poster.json beside it.
      file: `posters/${key}/etsy.json`,
      project: { title: project?.title, description: project?.description },
      // What a buyer actually sees on the print. Listing claims must match this.
      artwork: { title: poster.title, subtitle: poster.subtitle, body: poster.body, icon: poster.icon?.name, graphic: poster.graphic?.type },
      // Only saved sizes are offered; the listing must not promise others.
      product: { type: 'physical matte poster print via Printify', sizes: sizes.map((size) => POSTER_SIZES[size].label), savedForListing: sizes.length > 0 },
      etsy: poster.etsy ?? null,
      research: poster.research ?? null,
      pinterest: poster.pinterest ? { keywords: poster.pinterest.keywords } : null,
      check: checkListing(poster, sizes),
    };
    console.log(JSON.stringify(brief, null, 2));
  }
}

function main(): void {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      all: { type: 'boolean', default: false },
      strict: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      'needs-work': { type: 'boolean', default: false },
    },
  });
  const [command, ...args] = positionals;
  if (command !== 'check' && command !== 'brief') {
    console.log('Usage: npm run listing:check -- <project> [poster...] | --all [--strict] [--json]\n       npm run listing:brief -- <project> [poster...] [--needs-work]');
    process.exitCode = 1;
    return;
  }
  const list = targets(args, values.all);
  if (command === 'check') {
    if (!check(list, values.strict, values.json)) process.exitCode = 1;
  } else if (values['needs-work']) needsWork(list);
  else brief(list);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
