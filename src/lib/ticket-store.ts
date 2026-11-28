import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ThreadChannel } from "discord.js";

export type TicketMessage = {
  authorTag: string;
  authorId: string;
  content: string;
  createdAt: string;
};

export type TicketTranscript = {
  id: string;
  userId: string;
  guildId: string;
  closedBy: string;
  openedAt: string;
  closedAt: string;
  messages: TicketMessage[];
};

const storagePath = resolve(process.cwd(), "data", "ticket-transcripts.json");
const MAX_TRANSCRIPTS = 50;

function load(): TicketTranscript[] {
  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is TicketTranscript => Boolean(entry && typeof entry === "object")).slice(0, MAX_TRANSCRIPTS);
  } catch {
    return [];
  }
}

function save(items: TicketTranscript[]): void {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(items.slice(0, MAX_TRANSCRIPTS), null, 2), "utf8");
}

export async function archiveTicket(thread: ThreadChannel, closedBy: string): Promise<TicketTranscript | null> {
  const topic = "topic" in thread ? String(thread.topic ?? "") : "";
  const userId = topic.replace(/^gearcore-ticket:/, "") || "unknown";
  const fetched = await thread.messages.fetch({ limit: 100 }).catch(() => null);
  if (!fetched) return null;

  const messages = [...fetched.values()]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((message) => ({
      authorTag: message.author.tag,
      authorId: message.author.id,
      content: message.content.slice(0, 2000),
      createdAt: new Date(message.createdTimestamp).toISOString(),
    }));

  const transcript: TicketTranscript = {
    id: thread.id,
    userId,
    guildId: thread.guildId ?? "",
    closedBy,
    openedAt: new Date(thread.createdTimestamp ?? Date.now()).toISOString(),
    closedAt: new Date().toISOString(),
    messages,
  };

  const items = load().filter((item) => item.id !== transcript.id);
  save([transcript, ...items]);
  return transcript;
}

export function listTicketTranscripts(): TicketTranscript[] {
  return load();
}

export function getTicketTranscript(id: string): TicketTranscript | null {
  return load().find((item) => item.id === id) ?? null;
}

export function deleteTicketTranscript(id: string): boolean {
  const items = load();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  save(next);
  return true;
}
