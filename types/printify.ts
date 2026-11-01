import type { PosterSizeName } from '@/lib/posterSizes';

// printify/config.json. Nulls are placeholders: `npm run printify:check` fails until they are set.
export type PrintifyConfig = {
  // Etsy shop id from `npm run printify:shops`. PRINTIFY_SHOP_ID in the environment wins over this.
  shopId: number | null;
  // Poster blueprint and print provider from `npm run printify:catalog`.
  blueprintId: number | null;
  printProviderId: number | null;
  // Placeholder the artwork goes into. Posters use "front".
  placeholderPosition: string;
  // One Printify variant per poster size. priceCents is the retail price in cents (2400 = $24.00).
  sizes: Partial<Record<PosterSizeName, { variantId: number | null; priceCents: number | null }>>;
  // Which product fields Printify pushes to Etsy on publish. These are flags, not content: the
  // title, description, tags, and images come from the product created in step 3.
  publish: PrintifyPublishFlags;
};

export type PrintifyPublishFlags = {
  title: boolean;
  description: boolean;
  images: boolean;
  variants: boolean;
  tags: boolean;
  keyFeatures: boolean;
  shipping_template: boolean;
};

// printify/state.json: what has already been sent, so re-runs update instead of duplicating.
export type PrintifyState = {
  shops: Record<
    string,
    {
      posters: Record<
        string,
        {
          images: Partial<Record<PosterSizeName, { sha256: string; imageId: string; uploadedAt: string }>>;
          productId?: string;
          productUpdatedAt?: string;
          publishedAt?: string;
        }
      >;
    }
  >;
};

export type PrintifyShop = { id: number; title: string; sales_channel: string };

export type PrintifyUploadRequest = { file_name: string; url: string } | { file_name: string; contents: string };

export type PrintifyUploadedImage = {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
};

export type PrintifyProductRequest = {
  title: string;
  description: string;
  tags: string[];
  blueprint_id: number;
  print_provider_id: number;
  variants: { id: number; price: number; is_enabled: boolean }[];
  print_areas: {
    variant_ids: number[];
    placeholders: {
      position: string;
      images: { id: string; x: number; y: number; scale: number; angle: number }[];
    }[];
  }[];
};

export type PrintifyProduct = { id: string; title: string };

export type PrintifyBlueprint = { id: number; title: string; brand: string; model: string };
export type PrintifyProvider = { id: number; title: string };
export type PrintifyVariant = {
  id: number;
  title: string;
  options: Record<string, string>;
  placeholders: { position: string; width: number; height: number }[];
};
