import { randomUUID } from "node:crypto";
import type { StoreProduct } from "../types";

type ResultSession = {
  query: string;
  products: StoreProduct[];
  createdAt: number;
};

const sessions = new Map<string, ResultSession>();
const TTL_MS = 15 * 60 * 1000;
export const PAGE_SIZE = 5;

function cleanExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > TTL_MS) sessions.delete(id);
  }
}

export function createResultSession(query: string, products: StoreProduct[]): string {
  cleanExpired();
  const id = randomUUID().slice(0, 8);
  sessions.set(id, { query, products, createdAt: Date.now() });
  return id;
}

export function getResultSession(id: string): ResultSession | null {
  cleanExpired();
  return sessions.get(id) ?? null;
}

export function pageSlice(products: StoreProduct[], requestedPage: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(products.length / size));
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 0, 0), pages - 1);
  return {
    page,
    pages,
    items: products.slice(page * size, page * size + size),
  };
}
