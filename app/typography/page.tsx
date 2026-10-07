import { TypographySpecimen, type FontSpecimenData } from '@/components/TypographySpecimen';
import { getResolvedPoster } from '@/lib/posterResolver';

// Each font is shown as an actual poster that uses it, so you're judging it in the real shape (aspect
// ratio, palette, title/subtitle scale) instead of a flat text sample.
const FONT_SAMPLES: Array<{ projectId: string; posterId: string; font: FontSpecimenData }> = [
  {
    projectId: 'mtg-lgs-rules',
    posterId: 'standard-rules-summary',
    font: {
      name: 'Lexend',
      cssVar: '--font-lexend',
      category: 'Sans-serif, variable',
      weights: '100–900',
      usedBy: [
        'MTG LGS Rules',
        'The Cosmic Perspective',
        'Existentialism & Absurdism',
        'Zodiac Signs',
        'Grounding & Mindfulness',
        'Neuro Zones',
      ],
    },
  },
  {
    projectId: 'jungian-concepts',
    posterId: 'the-shadow',
    font: {
      name: 'Fraunces',
      cssVar: '--font-fraunces',
      category: 'Serif, variable (optical sizing)',
      weights: '100–900',
      usedBy: ['Jungian Concepts', 'The Strategist', 'Zodiac Signs', 'Grounding & Mindfulness', 'Neuro Zones'],
    },
  },
  {
    projectId: 'grounding-techniques',
    posterId: 'box-breathing',
    font: {
      name: 'Nunito',
      cssVar: '--font-nunito',
      category: 'Sans-serif, variable (rounded)',
      weights: '200–1000',
      usedBy: ['Grounding & Mindfulness', 'Neuro Zones'],
    },
  },
  {
    projectId: 'chaos-theory',
    posterId: 'chaos-edge-of-chaos',
    font: {
      name: 'Atkinson Hyperlegible',
      cssVar: '--font-atkinson',
      category: 'Sans-serif, accessible',
      weights: '400, 700',
      usedBy: [
        'Chaos Theory',
        'Chaos Theory (Fractal)',
        'The Creative Process',
        'Zodiac Signs',
        'Grounding & Mindfulness',
        'Neuro Zones',
      ],
    },
  },
  {
    projectId: 'grounding-techniques',
    posterId: 'name-it-tame-it',
    font: {
      name: 'Andika',
      cssVar: '--font-andika',
      category: 'Sans-serif, humanist/accessible',
      weights: '400, 700',
      usedBy: ['Grounding & Mindfulness', 'Neuro Zones'],
    },
  },
  {
    projectId: 'stoic-wisdom',
    posterId: 'stoic-memento-mori',
    font: {
      name: 'Cinzel',
      cssVar: '--font-cinzel',
      category: 'Serif, display (carved-stone)',
      weights: '400, 600, 700',
      usedBy: ['Daily Stoic'],
    },
  },
  {
    projectId: 'stoic-wisdom',
    posterId: 'stoic-imagination',
    font: {
      name: 'Playfair Display',
      cssVar: '--font-playfair-display',
      category: 'Serif, display (high contrast)',
      weights: '400, 500, 700 + italic',
      usedBy: ['Daily Stoic'],
    },
  },
];

export default function TypographyPage() {
  const samples = FONT_SAMPLES.flatMap(({ projectId, posterId, font }) => {
    const poster = getResolvedPoster(projectId, posterId);
    return poster ? [{ font, poster }] : [];
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Typography</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Every font currently loaded for poster projects (see app/fonts.ts), each shown as the real poster that uses
        it.
      </p>
      <div className="mt-6 grid gap-5">
        {samples.map(({ font, poster }) => (
          <TypographySpecimen key={font.cssVar} font={font} poster={poster} />
        ))}
      </div>
    </>
  );
}
