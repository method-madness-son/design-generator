/**
 * Export every enabled variant in the Printify shop as a CSV: listing price, Printify cost,
 * shipping rates, estimated Etsy fees, and estimated profit.
 *
 *   npm run printify:costs                     # writes printify-costs.csv in the repo root
 *   npm run printify:costs -- --out <file.csv>
 *
 * Etsy fees are not exposed by Printify; they are estimated from Etsy's standard US rates below.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadConfig, loadState, resolveShopId } from '@/lib/printify/posters';

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(path.join(process.cwd(), file));
  } catch {
    // optional
  }
}

const ETSY_LISTING_FEE = 0.2;
const ETSY_TRANSACTION_RATE = 0.065;
const ETSY_PAYMENT_RATE = 0.03;
const ETSY_PAYMENT_FIXED = 0.25;

type Variant = { id: number; sku: string; cost: number; price: number; title: string; is_enabled: boolean };
type Product = { id: string; title: string; blueprint_id: number; print_provider_id: number; variants: Variant[]; external?: { handle?: string } };
type ShippingProfile = { variant_ids: number[]; first_item: { cost: number }; additional_items: { cost: number }; countries: string[] };

const BASE = 'https://api.printify.com/v1';
const token = process.env.PRINTIFY_API_TOKEN;
if (!token) throw new Error('PRINTIFY_API_TOKEN is not set.');

async function get<T>(route: string): Promise<T> {
  const response = await fetch(`${BASE}${route}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`GET ${route} → ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return (await response.json()) as T;
}

const dollars = (cents: number) => cents / 100;
const money = (value: number | null) => (value === null ? '' : value.toFixed(2));
const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function shippingFor(profiles: ShippingProfile[], variantId: number, country: string) {
  const profile = profiles.find((p) => p.variant_ids.includes(variantId) && p.countries.includes(country));
  return profile ? { first: dollars(profile.first_item.cost), additional: dollars(profile.additional_items.cost) } : null;
}

async function main() {
  const { values } = parseArgs({ options: { out: { type: 'string', default: 'printify-costs.csv' } } });
  const shopId = resolveShopId(loadConfig());
  if (!shopId) throw new Error('shopId is not set in printify/config.json.');

  const keyByProduct = new Map<string, string>();
  for (const shop of Object.values(loadState().shops)) {
    for (const [key, item] of Object.entries(shop.posters)) if (item.productId) keyByProduct.set(item.productId, key);
  }

  const products: Product[] = [];
  for (let page = 1; ; page++) {
    const batch = await get<{ data: Product[] }>(`/shops/${shopId}/products.json?limit=50&page=${page}`);
    products.push(...batch.data);
    if (batch.data.length < 50) break;
  }

  const blueprintTitle = new Map<number, string>();
  for (const id of new Set(products.map((p) => p.blueprint_id))) {
    blueprintTitle.set(id, (await get<{ title: string }>(`/catalog/blueprints/${id}.json`)).title);
  }

  const shipping = new Map<string, ShippingProfile[]>();
  for (const combo of new Set(products.map((p) => `${p.blueprint_id}/${p.print_provider_id}`))) {
    const [blueprint, provider] = combo.split('/');
    const result = await get<{ profiles: ShippingProfile[] }>(`/catalog/blueprints/${blueprint}/print_providers/${provider}/shipping.json`);
    shipping.set(combo, result.profiles);
  }

  const header = [
    'Product type', 'Repo key', 'Printify title', 'Variant', 'SKU', 'Printify product ID', 'Etsy URL',
    'Listing price', 'Printify cost', 'Gross margin',
    'US shipping (first item)', 'US shipping (each additional)', 'CA shipping (first item)',
    'Est. Etsy listing fee', 'Est. Etsy transaction fee (6.5% of price + US shipping)', 'Est. Etsy payment fee (3% + $0.25)',
    'Est. total Etsy fees', 'Est. profit per sale (buyer pays US shipping at cost)',
  ];
  const rows: string[][] = [];

  for (const product of products) {
    const key = keyByProduct.get(product.id) ?? '';
    const profiles = shipping.get(`${product.blueprint_id}/${product.print_provider_id}`) ?? [];
    for (const variant of product.variants.filter((v) => v.is_enabled)) {
      const price = dollars(variant.price);
      const cost = dollars(variant.cost);
      const us = shippingFor(profiles, variant.id, 'US');
      const ca = shippingFor(profiles, variant.id, 'CA');
      const usShip = us?.first ?? 0;
      const transaction = ETSY_TRANSACTION_RATE * (price + usShip);
      const payment = ETSY_PAYMENT_RATE * (price + usShip) + ETSY_PAYMENT_FIXED;
      const fees = ETSY_LISTING_FEE + transaction + payment;
      rows.push([
        blueprintTitle.get(product.blueprint_id) ?? '', key, product.title, variant.title, variant.sku, product.id, product.external?.handle ?? '',
        money(price), money(cost), money(price - cost),
        money(us?.first ?? null), money(us?.additional ?? null), money(ca?.first ?? null),
        money(ETSY_LISTING_FEE), money(transaction), money(payment),
        money(fees), money(price - cost - fees),
      ]);
    }
  }

  rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]) || a[3].localeCompare(b[3]));
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  fs.writeFileSync(values.out!, `${csv}\n`);
  console.log(`Wrote ${rows.length} variants from ${products.length} products to ${path.resolve(values.out!)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
