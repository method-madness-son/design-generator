'use client';

import { ColorSwatchPicker } from '@/components/ColorSwatchPicker';
import { FontPicker } from '@/components/FontPicker';
import { ResetVariantsButton } from '@/components/ResetVariantsButton';
import { SizeStepper } from '@/components/SizeStepper';
import { BACKGROUND_COLORS } from '@/lib/backgroundColors';
import { FONT_GROUPS, GLOBAL_FONTS } from '@/lib/fontOptions';
import { DEV_DESIGNS } from '@/components/lowcontent/DevCover';
import { useQueryParam } from '@/lib/useQueryParam';

type Props = {
  displayFont: string;
  supportingFont: string;
  ink: string;
  accent: string;
  paper: string;
  variant: string;
  elementId: string;
  bookId: string;
  defaultDisplayFont: string;
  defaultSupportingFont: string;
  defaultInk: string;
  defaultAccent: string;
  defaultPaper: string;
  iconRem?: string;
  titleRem?: string;
  subtitleRem?: string;
  defaultIconRem?: number;
  defaultTitleRem?: number;
  defaultSubtitleRem?: number;
  sizeScale?: {
    icon: number[];
    title: number[];
    subtitle: number[];
  };
};

const INK_COLORS: Record<string, string> = {
  Black: '#141414',
  'Dark Gray': '#333333',
  Navy: '#1D3557',
  'Night Owl': '#011627',
  Charcoal: '#2B2B2E',
  Walnut: '#3E2723',
};

const ACCENT_COLORS: Record<string, string> = {
  Teal: '#7FDBCA',
  Blue: '#4A90C4',
  Coral: '#E76F51',
  Gold: '#FFB703',
  Purple: '#BD93F9',
  Pink: '#FFAFCC',
  Lavender: '#CDB4DB',
  Green: '#88C0D0',
  Red: '#E63946',
  Orange: '#F4845F',
};

export function LcDesignControls({
  displayFont,
  supportingFont,
  ink,
  accent,
  paper,
  variant,
  elementId,
  bookId,
  defaultDisplayFont,
  defaultSupportingFont,
  defaultInk,
  defaultAccent,
  defaultPaper,
  iconRem = '',
  titleRem = '',
  subtitleRem = '',
  defaultIconRem = 14.5,
  defaultTitleRem = 4.5,
  defaultSubtitleRem = 3.25,
  sizeScale,
}: Props) {
  const setVariant = useQueryParam('variant');
  const isCover = elementId === 'front-cover';
  const isDevCover = bookId === 'dev-notebook' && isCover;
  const showIconSize = isDevCover;
  const showTitleSize = isCover;
  const showSubtitleSize = isCover;

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white px-3.5 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">Customize</h2>
        <ResetVariantsButton />
      </div>

      {/* Cover variant picker for dev-notebook */}
      {isDevCover && (
        <Section label="Cover design">
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            className="w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-800"
          >
            {DEV_DESIGNS.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </Section>
      )}

      {/* Paper / background */}
      <Section label="Paper">
        <ColorSwatchPicker
          param="paper"
          swatches={BACKGROUND_COLORS}
          value={paper}
          defaultValue={defaultPaper}
          valueMode="hex"
          sortBy="lightness"
        />
      </Section>

      {/* Ink */}
      <Section label="Ink">
        <ColorSwatchPicker
          param="ink"
          swatches={INK_COLORS}
          value={ink}
          defaultValue={defaultInk}
          valueMode="hex"
        />
      </Section>

      {/* Accent */}
      <Section label="Accent">
        <ColorSwatchPicker
          param="accent"
          swatches={ACCENT_COLORS}
          value={accent}
          defaultValue={defaultAccent}
          valueMode="hex"
        />
      </Section>

      {/* Display font */}
      <Section label="Display font">
        <FontPicker param="displayFont" groups={FONT_GROUPS} allFonts={GLOBAL_FONTS} value={displayFont} />
      </Section>

      {/* Supporting font */}
      <Section label="Body font">
        <FontPicker param="supportingFont" groups={FONT_GROUPS} allFonts={GLOBAL_FONTS} value={supportingFont} />
      </Section>

      {/* Icon size */}
      {showIconSize && sizeScale && sizeScale.icon.length > 0 && (
        <Section label="Icon size">
          <SizeStepper
            param="iconRem"
            options={sizeScale.icon}
            value={iconRem}
            defaultValue={defaultIconRem}
          />
        </Section>
      )}

      {/* Title size */}
      {showTitleSize && sizeScale && sizeScale.title.length > 0 && (
        <Section label="Title size">
          <SizeStepper
            param="titleRem"
            options={sizeScale.title}
            value={titleRem}
            defaultValue={defaultTitleRem}
          />
        </Section>
      )}

      {/* Subtitle size */}
      {showSubtitleSize && sizeScale && sizeScale.subtitle.length > 0 && (
        <Section label="Subtitle size">
          <SizeStepper
            param="subtitleRem"
            options={sizeScale.subtitle}
            value={subtitleRem}
            defaultValue={defaultSubtitleRem}
          />
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      {children}
    </div>
  );
}
