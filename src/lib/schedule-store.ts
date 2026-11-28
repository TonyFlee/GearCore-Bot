import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type ScheduledAnnouncement = {
  id: string;
  message: string;
  channelId: string;
  includeAuto: boolean;
  mentionEveryone: boolean;
  dueAt: number;
  createdBy: string;
  createdAt: number;
};

const storagePath = resolve(process.cwd(), "data", "scheduled-announcements.json");
const MAX_ITEMS = 50;

function load(): ScheduledAnnouncement[] {
  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is ScheduledAnnouncement => Boolean(entry && typeof entry === "object"))
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function save(items: ScheduledAnnouncement[]): void {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(items.slice(0, MAX_ITEMS), null, 2), "utf8");
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function listScheduledAnnouncements(): ScheduledAnnouncement[] {
  return load().sort((a, b) => a.dueAt - b.dueAt);
}

export function createScheduledAnnouncement(input: Omit<ScheduledAnnouncement, "id" | "createdAt">): ScheduledAnnouncement {
  const items = load();
  const item: ScheduledAnnouncement = { ...input, id: newId(), createdAt: Date.now() };
  save([...items, item]);
  return item;
}

export function removeScheduledAnnouncement(id: string): boolean {
  const items = load();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  save(next);
  return true;
}
