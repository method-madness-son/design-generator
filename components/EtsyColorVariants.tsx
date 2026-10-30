import { PosterCanvas } from '@/components/PosterCanvas';
import type { ResolvedPoster } from '@/types/poster';

// Pack-variant element ids follow this pattern; ExportButton builds the same ids to find them.
export function etsyVariantElementId(posterId: string, colorName: string) {
  return `etsy-variant-${posterId}-${colorName}`;
}

// Off-screen renders of the poster with the icon + subtitle recolored to each accent option
// (title stays the project's default), so the Etsy pack can export one high-res PNG per color
// without the visible canvas ever needing to change.
export function EtsyColorVariants({
  poster,
  colors,
}: {
  poster: ResolvedPoster;
  colors: Record<string, string>;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed top-0 overflow-hidden" style={{ left: '-99999px' }}>
      {Object.entries(colors).map(([name, hex]) => (
        <PosterCanvas
          key={name}
          poster={{ ...poster, iconColor: hex, subtitleColor: hex }}
          id={etsyVariantElementId(poster.id, name)}
        />
      ))}
    </div>
  );
}
