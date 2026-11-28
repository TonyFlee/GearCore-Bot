import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Wishlists = Record<string, string[]>;

const storagePath = resolve(process.cwd(), "data", "wishlist.json");
const MAX_ITEMS = 30;

function load(): Wishlists {
  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as Wishlists;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function save(data: Wishlists): void {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(data, null, 2), "utf8");
}

export function getWishlist(userId: string): string[] {
  const items = load()[userId];
  return Array.isArray(items) ? items.filter((id) => typeof id === "string").slice(0, MAX_ITEMS) : [];
}

export function addToWishlist(userId: string, productId: string): boolean {
  const data = load();
  const items = Array.isArray(data[userId]) ? data[userId] : [];
  if (items.includes(productId) || items.length >= MAX_ITEMS) return false;
  data[userId] = [...items, productId].slice(0, MAX_ITEMS);
  save(data);
  return true;
}

export function removeFromWishlist(userId: string, productId: string): boolean {
  const data = load();
  const items = Array.isArray(data[userId]) ? data[userId] : [];
  if (!items.includes(productId)) return false;
  data[userId] = items.filter((id) => id !== productId);
  save(data);
  return true;
}

export function clearWishlist(userId: string): void {
  const data = load();
  delete data[userId];
  save(data);
}
