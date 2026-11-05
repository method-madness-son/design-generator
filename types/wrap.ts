import type { PosterFile } from '@/types/poster';
import type { WrapSizeId } from '@/lib/wrapSizes';

export type WrapEtsy = NonNullable<PosterFile['etsy']>;

export type WrapFinish = 'matte' | 'glossy';

export type WrapSource =
  | { kind: 'poster'; projectId: string; posterId: string }
  | { kind: 'standalone' };

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
  etsy?: WrapEtsy;
};

export type ResolvedWrap = {
  id: string;
  title: string;
  source: WrapSource;
  sizes: WrapSizeId[];
  tile: WrapDesignFile['tile'];
  colors: { background: string; foreground: string; accent: string };
  etsy: WrapEtsy | null;
  warnings: string[];
  errors: string[];
};

export type { WrapSizeId };
