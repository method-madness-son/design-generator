import type { PosterFile } from "@/types/poster";

/** Same shape as a poster and tee `etsy` block. */
export type MugEtsy = NonNullable<PosterFile["etsy"]>;

export type MugFontRole = "display" | "supporting";

export type MugLine = {
  text: string;
  font: MugFontRole;
};

export type MugGraphicType = "cursor-block" | "tab-pips" | "steam";

export type MugGraphic = {
  type: MugGraphicType;
};

export type MugWrapLayout = "front" | "full-wrap" | "drinker-left" | "drinker-right";

export type MugSizeId = "11oz" | "15oz";

export type MugProductId = "ceramic-white" | "accent" | "color-changing";

export type MugProjectFile = {
  id: string;
  title: string;
  description: string;
  market: string;
  /** Defaults to ceramic-white. Accent and color-changing are stored but not rendered. */
  product?: MugProductId;
};

export type MugDesignFile = {
  id: string;
  /** Display name of the project, e.g. "Dev Mugs". Matches project.json title. */
  project: string;
  market: string;
  /** Named palette id. Omit to use the market override's own palette and fonts. */
  palette?: string;
  lines: MugLine[];
  graphic?: MugGraphic;
  wrap: MugWrapLayout;
  sizes: MugSizeId[];
  product?: MugProductId;
  /** Optional family overrides. Each name must be on the global allow-list. */
  fonts?: Partial<Record<MugFontRole, string>>;
  etsy: MugEtsy;
};

export type ResolvedMugInk = {
  name: string;
  hex: string;
  contrastOnWhite: number;
  wcag: string;
};

export type ResolvedMug = {
  id: string;
  projectId: string;
  projectTitle: string;
  market: string;
  marketStatus: string | null;
  paletteId: string;
  paletteLabel: string;
  product: MugProductId;
  fonts: {
    display: string;
    supporting: string;
    displayCss: string;
    supportingCss: string;
  };
  lines: MugLine[];
  graphic?: MugGraphic;
  wrap: MugWrapLayout;
  sizes: MugSizeId[];
  textInk: ResolvedMugInk | null;
  graphicInk: ResolvedMugInk | null;
  blankHex: string;
  etsy: MugEtsy;
  warnings: string[];
  errors: string[];
};
