import { storePath } from "../config";
import type { StoreProduct } from "../types";
import { getSettings } from "./settings";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(value: number | null | undefined): string {
  return usd.format(Number(value ?? 0));
}

export function truncate(value: string | null | undefined, max = 280): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function productUrl(product: StoreProduct): string {
  return storePath(`products/${encodeURIComponent(product.slug || product.id)}`);
}

export function priceInfo(product: StoreProduct) {
  const regular = Number(product.price ?? 0);
  const sale = product.sale_price != null ? Number(product.sale_price) : null;
  const current = sale != null && sale < regular ? sale : regular;
  const percent = current < regular ? Math.round(((regular - current) / regular) * 100) : 0;
  return { regular, current, percent, onSale: percent > 0 };
}

export function priceLabel(product: StoreProduct): string {
  const { current, regular, percent, onSale } = priceInfo(product);
  return onSale ? `${money(current)} ~~${money(regular)}~~ · save ${percent}%` : money(current);
}

export function availabilityLabel(product: StoreProduct): string {
  const stock = Number(product.stock ?? 0);
  if (stock > 0) return `In stock · ${stock} available`;
  if (product.preorder_enabled) {
    const days = product.preorder_lead_days ? `${product.preorder_lead_days} days` : getSettings().preorderDays;
    return `Preorder · about ${days} from deposit`;
  }
  return "Currently unavailable";
}
