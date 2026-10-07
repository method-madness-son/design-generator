import { QuerySelect } from '@/components/QuerySelect';
import type { ProjectConfig } from '@/types/poster';

type Props = {
  project: ProjectConfig;
  // Validated selections; empty strings mean "poster default".
  query: { palette: string; fonts: string; iconRem: string; titleRem: string; subtitleRem: string };
};

export function PosterVariantSelects({ project, query }: Props) {
  const palettes = project.palettes ?? {};
  const fontPairs = project.fontPairs ?? {};
  const sizeScale = project.sizeScale;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {Object.keys(palettes).length > 0 && (
        <QuerySelect
          label="Color set"
          param="palette"
          options={Object.keys(palettes)}
          value={query.palette}
          swatches={palettes[query.palette]}
        />
      )}
      {Object.keys(fontPairs).length > 0 && (
        <QuerySelect label="Fonts" param="fonts" options={Object.keys(fontPairs)} value={query.fonts} />
      )}
      {sizeScale && sizeScale.icon.length > 0 && (
        <QuerySelect
          label="Icon size"
          param="iconRem"
          options={sizeScale.icon.map(String)}
          value={query.iconRem}
          optionSuffix="rem"
        />
      )}
      {sizeScale && sizeScale.title.length > 0 && (
        <QuerySelect
          label="Title size"
          param="titleRem"
          options={sizeScale.title.map(String)}
          value={query.titleRem}
          optionSuffix="rem"
        />
      )}
      {sizeScale && sizeScale.subtitle.length > 0 && (
        <QuerySelect
          label="Subtitle size"
          param="subtitleRem"
          options={sizeScale.subtitle.map(String)}
          value={query.subtitleRem}
          optionSuffix="rem"
        />
      )}
    </div>
  );
}
