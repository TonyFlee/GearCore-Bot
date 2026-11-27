import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import type { StoreProduct } from "../types";

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const BUNDLE_SLUGS = [
  "starter-setup-bundle",
  "focus-audio-bundle",
  "full-desk-bundle",
  "racing-combo-bundle",
];

const PRODUCT_COLUMNS = [
  "id",
  "name",
  "slug",
  "description",
  "price",
  "sale_price",
  "image_url",
  "stock",
  "category",
  "preorder_enabled",
  "preorder_lead_days",
  "archived",
  "featured",
  "created_at",
].join(",");

export async function getProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(`Product lookup failed: ${error.message}`);
  const rows = (data ?? []) as unknown as StoreProduct[];
  return rows.filter((product) => product.archived !== true);
}

function scoreProduct(product: StoreProduct, query: string, tokens: string[]): number {
  const name = String(product.name ?? "").toLowerCase();
  const slug = String(product.slug ?? "").toLowerCase();
  const category = String(product.category ?? "").toLowerCase();

  if (name === query || slug === query) return 100;
  if (name.startsWith(query)) return 85;
  if (slug.includes(query)) return 75;
  if (name.includes(query)) return 60;
  if (category.includes(query)) return 45;
  if (tokens.length > 1 && tokens.every((token) => name.includes(token) || slug.includes(token) || category.includes(token))) {
    return 40;
  }
  return 0;
}

export async function searchAllProducts(rawQuery: string): Promise<StoreProduct[]> {
  const products = await getProducts();
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    const featured = products.filter((product) => product.featured === true);
    return featured.length ? featured : products;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  return products
    .map((product) => ({ product, score: scoreProduct(product, query, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}

export async function searchProducts(rawQuery: string, limit = 5): Promise<StoreProduct[]> {
  return (await searchAllProducts(rawQuery)).slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  const products = await getProducts();
  return Array.from(new Set(products.map((product) => product.category).filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b));
}

export async function getCategoryProducts(category: string): Promise<StoreProduct[]> {
  const target = category.trim().toLowerCase();
  if (!target) return getProducts();
  return (await getProducts()).filter((product) => String(product.category ?? "").toLowerCase() === target);
}

export async function findProduct(reference: string): Promise<StoreProduct | null> {
  const target = reference.trim().toLowerCase();
  if (!target) return null;
  const products = await getProducts();
  const exact = products.find((product) =>
    product.slug?.toLowerCase() === target ||
    product.id.toLowerCase() === target ||
    product.name.toLowerCase() === target
  );
  return exact ?? (await searchAllProducts(target))[0] ?? null;
}

export async function getRandomProduct(): Promise<StoreProduct | null> {
  const products = await getProducts();
  if (!products.length) return null;
  return products[Math.floor(Math.random() * products.length)];
}

export async function getBundles(): Promise<StoreProduct[]> {
  const products = await getProducts();
  return BUNDLE_SLUGS
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is StoreProduct => Boolean(product));
}
