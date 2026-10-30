import { AlignmentPicker } from '@/components/AlignmentPicker';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ColorWheelPicker } from '@/components/ColorWheelPicker';
import { FontPicker } from '@/components/FontPicker';
import { PrintSizePicker } from '@/components/PrintSizePicker';
import { ResetVariantsButton } from '@/components/ResetVariantsButton';
import { SizeStepper } from '@/components/SizeStepper';
import { BACKGROUND_COLORS } from '@/lib/backgroundColors';
import { getColorOptions } from '@/lib/colorOptions';
import { GLOBAL_FONTS } from '@/lib/fontOptions';
import type { ProjectConfig, ResolvedPoster } from '@/types/poster';

type Props = {
  project: ProjectConfig;
  // The poster's actually-resolved sizes, so each SizeStepper's "Default" sits at its real
  // position in the scale instead of always being the floor.
  poster: ResolvedPoster;
  // Validated selections; empty strings mean "poster default".
  query: {
    palette: string;
    titleFont: string;
    subtitleFont: string;
    bodyFont: string;
    titleColor: string;
    subtitleColor: string;
    iconColor: string;
    bodyColor: string;
    backgroundColor: string;
    iconRem: string;
    titleRem: string;
    subtitleRem: string;
    bodyRem: string;
    printSize: string;
    align: string;
  };
  compact?: boolean;
};

export function PosterVariantSelects({ project, poster, query, compact = false }: Props) {
  // This project's own colors only (ink, accent, and each named palette's accent) rather than
  // every color from every project, so the picker stays short and relevant to this poster.
  const colorOptions = getColorOptions(project);
  const sizeScale = project.sizeScale;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {/* Layout */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Layout
          </span>
          <div className="flex items-center gap-1.5">
            <PrintSizePicker param="printSize" value={query.printSize} />
            <AlignmentPicker param="align" value={query.align} />
          </div>
        </div>

        <div className="hidden h-7 w-px bg-neutral-200 lg:block" />

        {/* Background */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Background
          </span>
          <ColorWheelPicker
            param="backgroundColor"
            colors={BACKGROUND_COLORS}
            value={query.backgroundColor}
            sortBy="lightness"
          />
        </div>

        <div className="hidden h-7 w-px bg-neutral-200 lg:block" />

        {/* Icon */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Icon
          </span>
          <div className="flex items-center gap-1.5">
            <ColorWheelPicker
              param="iconColor"
              colors={colorOptions}
              value={query.iconColor}
            />
            {sizeScale && sizeScale.icon.length > 0 && (
              <SizeStepper param="iconRem" options={sizeScale.icon} value={query.iconRem} defaultValue={poster.iconDefaultRem} />
            )}
          </div>
        </div>

        <div className="hidden h-7 w-px bg-neutral-200 lg:block" />

        {/* Title */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Title
          </span>
          <div className="flex items-center gap-1.5">
            <ColorWheelPicker
              param="titleColor"
              colors={colorOptions}
              value={query.titleColor}
            />
            <FontPicker param="titleFont" fonts={GLOBAL_FONTS} value={query.titleFont} />
            {sizeScale && sizeScale.title.length > 0 && (
              <SizeStepper param="titleRem" options={sizeScale.title} value={query.titleRem} defaultValue={poster.titleDefaultRem} />
            )}
          </div>
        </div>

        <div className="hidden h-7 w-px bg-neutral-200 lg:block" />

        {/* Subtitle */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Subtitle
          </span>
          <div className="flex items-center gap-1.5">
            <ColorWheelPicker
              param="subtitleColor"
              colors={colorOptions}
              value={query.subtitleColor}
            />
            <FontPicker param="subtitleFont" fonts={GLOBAL_FONTS} value={query.subtitleFont} />
            {sizeScale && sizeScale.subtitle.length > 0 && (
              <SizeStepper param="subtitleRem" options={sizeScale.subtitle} value={query.subtitleRem} defaultValue={poster.subtitleDefaultRem} />
            )}
          </div>
        </div>

        {/* Body: only posters whose JSON has a non-empty body list get this section. */}
        {poster.body.length > 0 && (
          <>
            <div className="hidden h-7 w-px bg-neutral-200 lg:block" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Body
              </span>
              <div className="flex items-center gap-1.5">
                <ColorWheelPicker
                  param="bodyColor"
                  colors={colorOptions}
                  value={query.bodyColor}
                />
                <FontPicker param="bodyFont" fonts={GLOBAL_FONTS} value={query.bodyFont} />
                {sizeScale?.body && sizeScale.body.length > 0 && (
                  <SizeStepper param="bodyRem" options={sizeScale.body} value={query.bodyRem} defaultValue={poster.bodyDefaultRem} />
                )}
              </div>
            </div>
          </>
        )}

      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">Customize</h2>
        <ResetVariantsButton />
      </div>

      {/* 5–6 sections (Body only when the poster has a body list); 3 columns keeps this at 2 rows
          max at any width, and xl widens to fit all sections on one row when there's room. */}
      <div className="mt-3 grid grid-cols-3 gap-2 xl:grid-cols-6">
        <CollapsibleSection label="Layout">
          <PrintSizePicker label="Size" param="printSize" value={query.printSize} />
          <AlignmentPicker label="Align" param="align" value={query.align} />
        </CollapsibleSection>

        <CollapsibleSection label="Background">
          <ColorWheelPicker
            label="Color"
            param="backgroundColor"
            colors={BACKGROUND_COLORS}
            value={query.backgroundColor}
            sortBy="lightness"
          />
        </CollapsibleSection>

        <CollapsibleSection label="Icon">
          <ColorWheelPicker
            label="Color"
            param="iconColor"
            colors={colorOptions}
            value={query.iconColor}
          />
          {sizeScale && sizeScale.icon.length > 0 && (
            <SizeStepper label="Size" param="iconRem" options={sizeScale.icon} value={query.iconRem} defaultValue={poster.iconDefaultRem} />
          )}
        </CollapsibleSection>

        <CollapsibleSection label="Title">
          <ColorWheelPicker
            label="Color"
            param="titleColor"
            colors={colorOptions}
            value={query.titleColor}
          />
          <FontPicker label="Font" param="titleFont" fonts={GLOBAL_FONTS} value={query.titleFont} />
          {sizeScale && sizeScale.title.length > 0 && (
            <SizeStepper label="Size" param="titleRem" options={sizeScale.title} value={query.titleRem} defaultValue={poster.titleDefaultRem} />
          )}
        </CollapsibleSection>

        <CollapsibleSection label="Subtitle">
          <ColorWheelPicker
            label="Color"
            param="subtitleColor"
            colors={colorOptions}
            value={query.subtitleColor}
          />
          <FontPicker label="Font" param="subtitleFont" fonts={GLOBAL_FONTS} value={query.subtitleFont} />
          {sizeScale && sizeScale.subtitle.length > 0 && (
            <SizeStepper label="Size" param="subtitleRem" options={sizeScale.subtitle} value={query.subtitleRem} defaultValue={poster.subtitleDefaultRem} />
          )}
        </CollapsibleSection>

        {poster.body.length > 0 && (
          <CollapsibleSection label="Body">
            <ColorWheelPicker
              label="Color"
              param="bodyColor"
              colors={colorOptions}
              value={query.bodyColor}
            />
            <FontPicker label="Font" param="bodyFont" fonts={GLOBAL_FONTS} value={query.bodyFont} />
            {sizeScale?.body && sizeScale.body.length > 0 && (
              <SizeStepper label="Size" param="bodyRem" options={sizeScale.body} value={query.bodyRem} defaultValue={poster.bodyDefaultRem} />
            )}
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
