const SAMPLE_SUBTITLE = 'The quick brown fox jumps over the lazy dog.';

export function TypographySpecimen({
  name,
  cssValue,
  weights,
  usedBy,
}: {
  name: string;
  // Full CSS font-family value, e.g. "var(--font-lexend), sans-serif".
  cssValue: string;
  // Heaviest weight loaded (title preview) and closest-to-600 weight loaded (subtitle preview).
  weights: { bold: number; semibold: number };
  // Project titles whose default typography actually uses this font.
  usedBy: string[];
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="bg-[#D6EAF8] px-5 py-6">
        <p
          className="text-3xl leading-tight break-words"
          style={{ fontFamily: cssValue, fontWeight: weights.bold, color: '#2B2B2E' }}
        >
          {name}
        </p>
        <p
          className="mt-2 text-base leading-snug break-words"
          style={{ fontFamily: cssValue, fontWeight: weights.semibold, color: '#4A90C4' }}
        >
          {SAMPLE_SUBTITLE}
        </p>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">{name}</h2>
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">{cssValue}</code>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Title weight {weights.bold} · Subtitle weight {weights.semibold}
        </p>
        {usedBy.length > 0 && (
          <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-400">Used by: {usedBy.join(' · ')}</p>
        )}
      </div>
    </section>
  );
}
