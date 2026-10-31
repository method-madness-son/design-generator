import type { PosterFile } from '@/types/poster';
import type { InkChoice, InkSetName } from '@/types/theme';

/** Same shape as a poster `etsy` block: title, description, category, up to 13 tags. */
export type TeeEtsy = NonNullable<PosterFile['etsy']>;

export type TeeFontRole = 'display' | 'supporting';

export type TeeLine = {
  text: string;
  font: TeeFontRole;
  /** ink uses the shirt ink. accent and accent2 stay the same on light and dark shirts. */
  swatch?: 'ink' | 'accent' | 'accent2';
};

export type NdArtKind = 'error-window' | 'warning-box' | 'pace-stencil' | 'pace-hand';

export type TeeGraphic =
  | { type: 'browser-tabs'; count?: number; position?: 'top' | 'bottom' }
  | { type: 'progress-bar'; value: number; position?: 'top' | 'bottom' }
  | { type: 'nd'; kind: NdArtKind; accent: string; accent2?: string; position?: 'top' | 'bottom' };

export type TeePlacementSize = 'full-front' | 'left-chest';
export type TeePlacementSide = 'front' | 'back';

export type TeeProjectFile = {
  id: string;
  title: string;
  description: string;
  market: string;
};

export type TeeDesignFile = {
  id: string;
  /** Display name of the project, e.g. "ND Tees". Matches project.json title. */
  project: string;
  market: string;
  /** Named palette id. Omit to use the market override's own palette and fonts. */
  palette?: string;
  lines: TeeLine[];
  graphic?: TeeGraphic;
  placement: {
    side: TeePlacementSide;
    size: TeePlacementSize;
  };
  /** Ink name from the palette's on_light_shirt / on_dark_shirt list. */
  ink?: Partial<Record<InkSetName, string>>;
  /** Optional family overrides. Each name must be on the global allow-list. */
  fonts?: Partial<Record<TeeFontRole, string>>;
  shirts: string[];
  etsy: TeeEtsy;
};

export type ResolvedInkSet = {
  text: InkChoice;
  /** Solid colors for tabs or the progress fill. Empty when the design is text only. */
  shapeInks: InkChoice[];
  warnings: string[];
};

export type ResolvedTee = {
  id: string;
  projectId: string;
  projectTitle: string;
  market: string;
  marketStatus: string | null;
  paletteId: string;
  paletteLabel: string;
  paletteStatus: string | null;
  fonts: {
    display: string;
    supporting: string;
    displayCss: string;
    supportingCss: string;
  };
  lines: TeeLine[];
  graphic?: TeeGraphic;
  placement: {
    side: TeePlacementSide;
    size: TeePlacementSize;
    label: string;
  };
  print: {
    widthPx: number;
    heightPx: number;
    widthIn: number;
    heightIn: number;
    box: { x: number; y: number; width: number; height: number; widthIn: number; heightIn: number };
  };
  inkBySet: Record<InkSetName, ResolvedInkSet | null>;
  shirts: string[];
  etsy: TeeEtsy;
  warnings: string[];
  errors: string[];
};
