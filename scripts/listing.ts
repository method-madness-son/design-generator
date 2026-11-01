/**
 * Etsy listing tools for posters, used by the etsy-listing-researcher agent and by hand.
 *
 *   npm run listing:check -- --all                     # every poster with an etsy block
 *   npm run listing:check -- dev-realities [vim-wq]    # one project or poster
 *   npm run listing:check -- --all --strict            # warnings fail too (agent's gate)
 *   npm run listing:brief -- dev-realities vim-wq      # what the poster shows + current listing
 *   npm run listing:brief -- dev-realities --needs-work   # posters that fail or lack research
 */
import fs from 'node:fs';
import path from 'node:path';
import { checkListing } from '@/lib/etsyListing';
import { savedSizes } from '@/lib/posterExports';
import { getPosterIds, getProject, getProjects } from '@/lib/posterResolver';
import { POSTER_SIZES } from '@/lib/posterSizes';
import type { PosterFile } from '@/types/poster';

type Target = { projectId: string; posterId: string; poster: PosterFile };

function load(projectId: string, posterId: string): Target {
  const file = path.join(process.cwd(), 'posters', projectId, `${posterId}.json`);
  return { projectId, posterId, poster: JSON.parse(fs.readFileSync(file, 'utf8')) as PosterFile };
}

function targets(args: string[], all: boolean): Target[] {
  if (all) return getProjects().flatMap((project) => getPosterIds(project.id).map((id) => load(project.id, id)));
  const [projectId, ...posterIds] = args;
  if (!projectId) throw new Error('Pass a project id (and optional poster ids), or --all.');
  if (!getProject(projectId)) throw new Error(`No poster project "${projectId}".`);
  const known = getPosterIds(projectId);
  for (const id of posterIds) if (!known.includes(id)) throw new Error(`No poster "${id}" in ${projectId}.`);
  return (posterIds.length > 0 ? posterIds : known).map((id) => load(projectId, id));
}

function check(list: Target[], strict: boolean, json: boolean): boolean {
  // A poster becomes eligible for listing once the studio has saved an export for it. Unsaved
  // posters without an etsy block are skipped; saved ones must have a valid listing.
  let failed = 0;
  let skipped = 0;
  const results = [];
  for (const target of list) {
    const sizes = savedSizes(target.projectId, target.posterId);
    if (!target.poster.etsy && sizes.length === 0) {
      skipped += 1;
      continue;
    }
    const report = checkListing(target.poster);
    if (!target.poster.etsy) {
      report.errors = report.errors.filter((error) => !error.startsWith('Missing "etsy" block'));
      report.errors.unshift('Saved for listing but has no etsy block; run the etsy-listing-researcher agent.');
    }
    const ok = report.errors.length === 0 && (!strict || report.warnings.length === 0);
    if (!ok) failed += 1;
    results.push({ poster: `${target.projectId}/${target.posterId}`, ok, savedSizes: sizes, ...report });
  }
  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const result of results) {
      if (result.ok && result.warnings.length === 0) continue;
      console.log(`\n${result.ok ? 'ok  ' : 'FAIL'} ${result.poster}`);
      for (const error of result.errors) console.log(`  error: ${error}`);
      for (const warning of result.warnings) console.log(`  warning: ${warning}`);
    }
    const saved = results.filter((result) => result.savedSizes.length > 0).length;
    console.log(
      `\n${results.length - failed}/${results.length} listings pass${strict ? ' (strict)' : ''}; ` +
        `${saved} saved for listing; ${skipped} unsaved posters without an etsy block skipped.`,
    );
  }
  return failed === 0;
}

function brief(list: Target[], needsWork: boolean): void {
  for (const { projectId, posterId, poster } of list) {
    const report = checkListing(poster);
    const sizes = savedSizes(projectId, posterId);
    if (needsWork) {
      // Saved-but-unlisted posters first need a listing written from scratch.
      if (!poster.etsy && sizes.length === 0) continue;
      if (poster.etsy && report.errors.length === 0 && poster.research) continue;
      const state = !poster.etsy ? 'saved, no etsy block' : `${report.errors.length} errors\t${poster.research ? 'researched' : 'no research'}`;
      console.log(`${projectId}/${posterId}\t${state}\t${sizes.length > 0 ? `saved ${sizes.join(',')}` : 'not saved'}`);
      continue;
    }
    const project = getProject(projectId);
    console.log(
      JSON.stringify(
        {
          poster: `${projectId}/${posterId}`,
          file: `posters/${projectId}/${posterId}.json`,
          project: { title: project?.title, description: project?.description },
          // What a buyer actually sees on the print. Listing claims must match this.
          artwork: {
            title: poster.title,
            subtitle: poster.subtitle,
            body: poster.body,
            icon: poster.icon?.name,
            graphic: poster.graphic?.type,
          },
          product: {
            type: 'physical matte poster print via Printify',
            // Only saved sizes are offered; the listing must not promise others.
            sizes: sizes.map((size) => POSTER_SIZES[size].label),
            savedForListing: sizes.length > 0,
          },
          etsy: poster.etsy ?? null,
          research: poster.research ?? null,
          pinterest: poster.pinterest ? { keywords: poster.pinterest.keywords } : null,
          check: report,
        },
        null,
        2,
      ),
    );
  }
}

function main(): void {
  const [command, ...rest] = process.argv.slice(2);
  const flags = new Set(rest.filter((arg) => arg.startsWith('--')));
  const args = rest.filter((arg) => !arg.startsWith('--'));
  for (const flag of flags) {
    if (!['--all', '--strict', '--json', '--needs-work'].includes(flag)) throw new Error(`Unknown flag ${flag}`);
  }
  const list = targets(args, flags.has('--all'));
  if (command === 'check') {
    if (!check(list, flags.has('--strict'), flags.has('--json'))) process.exitCode = 1;
  } else if (command === 'brief') {
    brief(list, flags.has('--needs-work'));
  } else {
    console.log('Usage: npm run listing:check -- <project> [poster...] | --all [--strict] [--json]\n       npm run listing:brief -- <project> [poster...] [--needs-work]');
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
