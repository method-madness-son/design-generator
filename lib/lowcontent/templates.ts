import type { LcOutlineEntry, LcPageConfig, LcPageRef, LcTemplateId, RenderedLcPage } from '@/types/lowcontent';
import { LC_TEMPLATES } from '@/types/lowcontent';

export const TEMPLATE_LABELS: Record<LcTemplateId, string> = {
  title: 'Title',
  'belongs-to': 'This book belongs to',
  contents: 'Contents',
  'weekly-planner': 'Weekly planner',
  'monthly-planner': 'Monthly planner',
  'habit-tracker': 'Habit tracker',
  lined: 'Lined page',
  'dot-grid': 'Dot grid',
  graph: 'Graph page',
  gratitude: 'Gratitude',
  'stats-tracker': 'Stats tracker',
  recipe: 'Recipe',
  'meal-planner': 'Meal planner',
  logbook: 'Stage log',
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DEFAULT_GRATITUDE_PROMPTS = [
  'One thing that went well',
  'Someone I appreciate',
  'A small thing I noticed',
];

export const DEFAULT_HABITS = ['Water', 'A meal', 'Move', 'One start', 'Lights out'];

export const DEFAULT_STATS_COLUMNS = ['Date', 'Opponent', 'Goals', 'Assists', 'Shots', 'Notes'];

export const DEFAULT_LOG_FIELDS = [
  { label: 'Stage', lines: 1 },
  { label: 'Distance', lines: 1 },
  { label: 'Time', lines: 1 },
  { label: 'Surface', lines: 1 },
  { label: 'Car', lines: 1 },
];

export function isTemplateId(value: string): value is LcTemplateId {
  return (LC_TEMPLATES as readonly string[]).includes(value);
}

export function defaultConfig(template: LcTemplateId, config: LcPageConfig | undefined): LcPageConfig {
  const heading = config?.heading ?? TEMPLATE_LABELS[template];
  switch (template) {
    case 'weekly-planner':
      return { heading, dated: config?.dated ?? false, note: config?.note };
    case 'monthly-planner':
      return { heading, dated: config?.dated ?? false, note: config?.note };
    case 'habit-tracker':
      return {
        heading,
        habits: config?.habits ?? DEFAULT_HABITS,
        days: config?.days ?? 7,
        note: config?.note,
      };
    case 'gratitude':
      return { heading, prompts: config?.prompts ?? DEFAULT_GRATITUDE_PROMPTS, note: config?.note };
    case 'stats-tracker':
      return {
        heading,
        columns: config?.columns ?? DEFAULT_STATS_COLUMNS,
        rows: config?.rows ?? 10,
        note: config?.note,
      };
    case 'logbook':
      return { heading, fields: config?.fields ?? DEFAULT_LOG_FIELDS, rows: config?.rows ?? 8, note: config?.note };
    case 'recipe':
      return { heading, note: config?.note };
    case 'meal-planner':
      return { heading, dated: config?.dated ?? false, note: config?.note };
    case 'title':
    case 'belongs-to':
    case 'contents':
    case 'lined':
    case 'dot-grid':
    case 'graph':
      return { heading, note: config?.note };
    default:
      return { heading };
  }
}

export function expandPages(refs: LcPageRef[]): RenderedLcPage[] {
  const pages: RenderedLcPage[] = [];
  for (const ref of refs) {
    const count = ref.repeat;
    for (let index = 0; index < count; index += 1) {
      pages.push({
        template: ref.template,
        config: defaultConfig(ref.template, ref.config),
        entryIndex: index + 1,
        entryCount: count,
        pageNumber: pages.length + 1,
      });
    }
  }
  return pages;
}

export function buildOutline(pages: RenderedLcPage[]): LcOutlineEntry[] {
  const groups: LcOutlineEntry[] = [];
  for (const page of pages) {
    const label = page.config.heading || TEMPLATE_LABELS[page.template];
    const last = groups[groups.length - 1];
    if (last && last.template === page.template && last.label === label) {
      last.end = page.pageNumber;
    } else {
      groups.push({ template: page.template, label, start: page.pageNumber, end: page.pageNumber });
    }
  }
  return groups;
}

export function pageCopy(page: RenderedLcPage): string[] {
  const config = page.config;
  return [
    config.heading ?? '',
    config.note ?? '',
    ...(config.columns ?? []),
    ...(config.prompts ?? []),
    ...(config.habits ?? []),
    ...(config.fields ?? []).map((field) => field.label),
  ];
}

export const WEEKDAY_LABELS = WEEKDAYS;
