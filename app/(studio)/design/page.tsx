import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { IconRenderer } from '@/components/IconRenderer';
import { Fractal, type FractalType } from '@/components/Fractal';
import { SvgGraphic, SVG_GRAPHIC_NAMES } from '@/components/SvgGraphic';
import { Tabs } from '@/components/Tabs';
import { TypographySpecimen } from '@/components/TypographySpecimen';
import { EDITOR_THEME_COLORS } from '@/lib/editorThemeColors';
import { DEFAULT_FONT_WEIGHTS, FONT_WEIGHTS } from '@/lib/fontWeights';
import { FONT_GROUPS, GLOBAL_FONTS } from '@/lib/fontOptions';
import { NEUTRAL_COLORS } from '@/lib/neutralColors';
import { PASTEL_COLORS } from '@/lib/pastelColors';
import { getProjects, getResolvedPosters } from '@/lib/posterResolver';

export const metadata = {
  title: 'Design system',
  description: 'Colors, typography, graphics, and icons available across all poster projects.',
};

function collectDesignAssets() {
  const projects = getProjects();
  const iconNames = new Set<string>();
  const graphicTypes = new Set<FractalType>();

  for (const project of projects) {
    const posters = getResolvedPosters(project.id, {});
    for (const poster of posters) {
      if (poster.icon?.name) iconNames.add(poster.icon.name);
      if (poster.graphic?.type) graphicTypes.add(poster.graphic.type);
    }
  }

  return {
    projects,
    icons: [...iconNames].sort(),
    graphics: [...graphicTypes].sort(),
  };
}

function ColorsPanel() {
  const groups = [
    { label: 'Pastels', colors: PASTEL_COLORS },
    { label: 'Editor themes', colors: EDITOR_THEME_COLORS },
    { label: 'Neutrals', colors: NEUTRAL_COLORS },
  ] as const;

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-lg font-semibold text-neutral-900">{group.label}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(group.colors).map(([name, { background, accent }]) => (
              <div key={name} className="overflow-hidden rounded-lg border border-neutral-200">
                <div className="flex h-20">
                  <div className="flex-1" style={{ backgroundColor: background }} />
                  <div className="w-10" style={{ backgroundColor: accent }} />
                </div>
                <div className="bg-white px-3 py-2">
                  <p className="text-sm font-medium text-neutral-900">{name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {background} · {accent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TypographyPanel({ projects }: { projects: ReturnType<typeof getProjects> }) {
  const specimens = Object.entries(GLOBAL_FONTS).map(([name, cssValue]) => {
    const usedBy = projects
      .filter(({ defaultTypography: t }) =>
        [t.fontFamily, t.titleFontFamily, t.subtitleFontFamily].includes(cssValue),
      )
      .map((project) => project.title);
    return { name, cssValue, usedBy, weights: FONT_WEIGHTS[name] ?? DEFAULT_FONT_WEIGHTS };
  });

  return (
    <>
      <p className="mb-6 max-w-2xl text-sm text-neutral-600">
        Every font available in the Title/Subtitle pickers, grouped by category. Title shows the boldest weight loaded; subtitle shows the closest to semibold.
      </p>
      {FONT_GROUPS.map((group) => {
        const groupSpecimens = specimens.filter((s) => group.fonts[s.name]);
        if (groupSpecimens.length === 0) return null;
        return (
          <section key={group.label} className="mt-8 first:mt-0">
            <h2 className="text-lg font-semibold text-neutral-900">{group.label}</h2>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {groupSpecimens.map((specimen) => (
                <TypographySpecimen key={specimen.name} {...specimen} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

const HIDDEN_GRAPHICS = new Set(['crossed-sticks', 'card-fan']);

const GRAPHIC_CATEGORIES: Record<string, { label: string; description: string; types: string[] }> = {
  'adhd-neuro': {
    label: 'ADHD & Neurodivergent',
    description: 'Spoon theory, executive function, and neurodivergent life.',
    types: ['pen-arrow', 'progress-bar', 'spoon-count', 'spoon-battery', 'spoon-badge', 'side-quest-fork', 'squiggles', 'three-cautions'],
  },
  rally: {
    label: 'Rally & Pace Notes',
    description: 'Roadbook tulips, pace note pictograms, and rally stage icons.',
    types: ['road-arrow', 'loop-arrow', 'tulip', 'left-right-oops', 'hairpin-square-flat', 'crest-jump-landing', 'surfaces', 'recce-rally-repair'],
  },
  mtg: {
    label: 'Tabletop & MTG',
    description: 'Magic: The Gathering, D&D, and tabletop gaming.',
    types: ['d20-life', 'tap-card', 'mana-shield', 'mana-wheel', 'lightning-bolt'],
  },
  hockey: {
    label: 'Hockey',
    description: 'Hockey culture and locker room humour.',
    types: ['goal-holes', 'three-hats', 'headstone'],
  },
  chaos: {
    label: 'Chaos Theory',
    description: 'Fractals, attractors, and mathematical beauty.',
    types: ['lorenz', 'tree', 'spiral'],
  },
};

function GraphicsPanel({ graphics }: { graphics: string[] }) {
  const available = new Set(graphics.filter((g) => !HIDDEN_GRAPHICS.has(g)));

  return (
    <>
      {SVG_GRAPHIC_NAMES.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900">SVG Graphics</h2>
          <p className="mb-4 text-sm text-neutral-600">
            Traced SVG files from graphics/. Support multi-color fills with accent and knockout classes.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {SVG_GRAPHIC_NAMES.map((name) => (
              <div key={name} className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-6"
                style={{ '--poster-accent': '#c0272d', '--poster-background': '#ffffff' } as React.CSSProperties}>
                <div className="flex h-28 w-28 items-center justify-center text-neutral-800">
                  <SvgGraphic name={name} sizeRem={6} />
                </div>
                <p className="mt-3 text-center text-sm font-medium text-neutral-700">{name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mb-6 max-w-2xl text-sm text-neutral-600">
        Built-in SVG graphics rendered by the Fractal component. Each is drawn in currentColor
        and scales to the poster&apos;s icon size.
      </p>
      {Object.entries(GRAPHIC_CATEGORIES).map(([key, category]) => {
        const visible = category.types.filter((t) => available.has(t));
        if (visible.length === 0) return null;
        return (
          <section key={key} className="mt-8 first:mt-0">
            <h2 className="text-lg font-semibold text-neutral-900">{category.label}</h2>
            <p className="mb-4 text-sm text-neutral-600">{category.description}</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((type) => (
                <div key={type} className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-6">
                  <div className="flex h-28 w-28 items-center justify-center text-neutral-800">
                    <Fractal type={type as FractalType} sizeRem={6} />
                  </div>
                  <p className="mt-3 text-center text-sm font-medium text-neutral-700">{type}</p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function IconsPanel({ icons }: { icons: string[] }) {
  return (
    <>
      <p className="mb-6 max-w-2xl text-sm text-neutral-600">
        Lucide icons currently used across poster designs. Each icon is referenced by name in poster.json.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {icons.map((name) => (
          <div key={name} className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex h-28 w-28 items-center justify-center text-neutral-800">
              <IconRenderer name={name} sizeRem={3.5} />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-neutral-600">{name}</p>
          </div>
        ))}
      </div>
    </>
  );
}

const TABS = ['Colors', 'Typography', 'Graphics', 'Icons'];

export default function DesignPage() {
  const { projects, icons, graphics } = collectDesignAssets();

  return (
    <>
      <Breadcrumbs items={[{ label: 'Posters', href: '/' }, { label: 'Design' }]} />
      <h1 className="mt-2 text-2xl font-semibold">Design system</h1>
      <p className="mt-1 max-w-2xl text-neutral-600">
        Colors, fonts, graphics, and icons available across all poster projects.
      </p>
      <Suspense>
        <Tabs tabs={TABS}>
          <ColorsPanel />
          <TypographyPanel projects={projects} />
          <GraphicsPanel graphics={graphics} />
          <IconsPanel icons={icons} />
        </Tabs>
      </Suspense>
    </>
  );
}
