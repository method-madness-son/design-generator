/**
 * Minimal Printify REST client for the poster sync script. Node only (uses fetch + env token).
 *
 * Auth: Personal Access Token from Printify → My account → Connections, sent as a Bearer token.
 * PRINTIFY_API_BASE overrides the host (used to test against a local mock).
 */
import type {
  PrintifyBlueprint,
  PrintifyProduct,
  PrintifyProductRequest,
  PrintifyProvider,
  PrintifyPublishFlags,
  PrintifyShop,
  PrintifyUploadedImage,
  PrintifyUploadRequest,
  PrintifyVariant,
} from '@/types/printify';

const DEFAULT_BASE = 'https://api.printify.com/v1';
const MAX_ATTEMPTS = 5;

export class PrintifyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
  }
}

export class PrintifyClient {
  private readonly base: string;

  constructor(
    private readonly token: string,
    base = process.env.PRINTIFY_API_BASE ?? DEFAULT_BASE,
  ) {
    if (!token) throw new Error('PRINTIFY_API_TOKEN is not set. Put it in .env.local (gitignored).');
    this.base = base.replace(/\/$/, '');
  }

  private async request<T>(method: string, route: string, payload?: unknown): Promise<T> {
    // Built once: base64 uploads can be tens of MB and are the requests most likely to be retried.
    const body = payload === undefined ? undefined : JSON.stringify(payload);
    for (let attempt = 1; ; attempt += 1) {
      const response = await fetch(`${this.base}${route}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json;charset=utf-8',
          'User-Agent': 'printify-pipeline',
        },
        body,
      });
      const text = await response.text();
      const parsed: unknown = text ? safeJson(text) : null;
      if (response.ok) return parsed as T;
      // Back off on rate limits and transient server errors; everything else is a real failure.
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < MAX_ATTEMPTS) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
        console.log(`  ${method} ${route} → ${response.status}, retrying in ${Math.round(waitMs / 1000)}s`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw new PrintifyError(`${method} ${route} → ${response.status}: ${text.slice(0, 1000)}`, response.status, parsed);
    }
  }

  // Step 1: find the connected Etsy shop's id.
  getShops() {
    return this.request<PrintifyShop[]>('GET', '/shops.json');
  }

  // Step 2: add a print file to the media library (by public URL or base64 contents).
  uploadImage(upload: PrintifyUploadRequest) {
    return this.request<PrintifyUploadedImage>('POST', '/uploads/images.json', upload);
  }

  // Step 3: create the draft product, or update one this pipeline already created.
  createProduct(shopId: number, product: PrintifyProductRequest) {
    return this.request<PrintifyProduct>('POST', `/shops/${shopId}/products.json`, product);
  }

  updateProduct(shopId: number, productId: string, product: PrintifyProductRequest) {
    return this.request<PrintifyProduct>('PUT', `/shops/${shopId}/products/${productId}.json`, product);
  }

  // Step 4: push the product to the connected Etsy store. Printify answers with an empty body.
  publishProduct(shopId: number, productId: string, flags: PrintifyPublishFlags) {
    return this.request<unknown>('POST', `/shops/${shopId}/products/${productId}/publish.json`, flags);
  }

  // Catalog lookups for filling in printify/config.json.
  getBlueprints() {
    return this.request<PrintifyBlueprint[]>('GET', '/catalog/blueprints.json');
  }

  getProviders(blueprintId: number) {
    return this.request<PrintifyProvider[]>('GET', `/catalog/blueprints/${blueprintId}/print_providers.json`);
  }

  async getVariants(blueprintId: number, providerId: number) {
    const result = await this.request<{ variants: PrintifyVariant[] }>(
      'GET',
      `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
    );
    return result.variants;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
