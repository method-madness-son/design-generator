import type { PosterFile } from '@/types/poster';
import type { WrapSizeId } from '@/lib/wrapSizes';

export type WrapEtsy = NonNullable<PosterFile['etsy']>;

export type WrapFinish = 'matte' | 'glossy';

export type WrapSource =
  | { kind: 'poster'; projectId: string; posterId: string }
  | { kind: 'standalone' };

export type CustomIconPath = {
  d: string;
  fill?: boolean;
  accent?: boolean;
  knockout?: boolean;
  width?: number;
};

export type CustomIcon = {
  /** Single-path shorthand (mutually exclusive with `paths`). */
  path?: string;
  /** Multi-path mode — each entry can override stroke/fill/color. */
  paths?: CustomIconPath[];
  viewBox?: string;
  fill?: boolean;
  strokeWidth?: number;
  linecap?: 'round' | 'butt' | 'square';
};

export type WrapDesignFile = {
  id: string;
  title: string;
  source: WrapSource;
  sizes: WrapSizeId[];
  tile: {
    widthIn: number;
    heightIn: number;
    rotate?: number;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
  };
  colors?: {
    background?: string;
    foreground?: string;
    accent?: string;
  };
  icons?: string[];
  customIcons?: Record<string, CustomIcon>;
  etsy?: WrapEtsy;
};

export type ResolvedWrap = {
  id: string;
  title: string;
  source: WrapSource;
  sizes: WrapSizeId[];
  tile: WrapDesignFile['tile'];
  colors: { background: string; foreground: string; accent: string };
  icons: string[];
  customIcons: Record<string, CustomIcon>;
  etsy: WrapEtsy | null;
  warnings: string[];
  errors: string[];
};

export type { WrapSizeId };
