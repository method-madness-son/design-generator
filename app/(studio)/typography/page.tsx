import { TypographySpecimen } from '@/components/TypographySpecimen';
import { DEFAULT_FONT_WEIGHTS, FONT_WEIGHTS } from '@/lib/fontWeights';
import { GLOBAL_FONTS } from '@/lib/fontOptions';
import { getProjects } from '@/lib/posterResolver';

export default function TypographyPage() {
  const projects = getProjects();

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
      <h1 className="text-2xl font-semibold">Typography</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Every font available in the Title/Subtitle pickers (see lib/fontOptions.ts), generated from that same list —
        adding a font there adds it here automatically. Title shows the boldest/blackest weight that font actually
        loads; subtitle shows the weight closest to semibold.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {specimens.map((specimen) => (
          <TypographySpecimen key={specimen.name} {...specimen} />
        ))}
      </div>
    </>
  );
}
