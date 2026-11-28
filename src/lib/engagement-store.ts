import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type Poll = {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  guildId: string;
  channelId: string;
  userId: string;
  closesAt: number;
};

export type Giveaway = {
  id: string;
  prize: string;
  guildId: string;
  channelId: string;
  userId: string;
  entrants: string[];
  winnerCount: number;
  endsAt: number;
  ended: boolean;
};

export type Reminder = {
  id: string;
  userId: string;
  guildId: string;
  message: string;
  dueAt: number;
};

type EngagementData = {
  polls: Record<string, Poll>;
  giveaways: Record<string, Giveaway>;
  reminders: Record<string, Reminder>;
};

const storagePath = resolve(process.cwd(), "data", "engagement.json");
const emptyData = (): EngagementData => ({ polls: {}, giveaways: {}, reminders: {} });

function load(): EngagementData {
  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as Partial<EngagementData>;
    return {
      polls: parsed.polls && typeof parsed.polls === "object" ? parsed.polls : {},
      giveaways: parsed.giveaways && typeof parsed.giveaways === "object" ? parsed.giveaways : {},
      reminders: parsed.reminders && typeof parsed.reminders === "object" ? parsed.reminders : {},
    };
  } catch {
    return emptyData();
  }
}

function save(data: EngagementData): void {
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(data, null, 2), "utf8");
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createPoll(input: Omit<Poll, "id" | "votes">): Poll {
  const data = load();
  const poll: Poll = { ...input, id: newId(), votes: {} };
  data.polls[poll.id] = poll;
  save(data);
  return poll;
}

export function getPoll(id: string): Poll | null {
  return load().polls[id] ?? null;
}

export function votePoll(id: string, userId: string, option: number): Poll | null {
  const data = load();
  const poll = data.polls[id];
  if (!poll || option < 0 || option >= poll.options.length || poll.closesAt <= Date.now()) return null;
  poll.votes[userId] = option;
  save(data);
  return poll;
}

export function allPolls(): Poll[] {
  return Object.values(load().polls);
}

export function removePoll(id: string): void {
  const data = load();
  delete data.polls[id];
  save(data);
}

export function createGiveaway(input: Omit<Giveaway, "id" | "entrants" | "ended">): Giveaway {
  const data = load();
  const giveaway: Giveaway = { ...input, id: newId(), entrants: [], ended: false };
  data.giveaways[giveaway.id] = giveaway;
  save(data);
  return giveaway;
}

export function getGiveaway(id: string): Giveaway | null {
  return load().giveaways[id] ?? null;
}

export function enterGiveaway(id: string, userId: string): "added" | "already" | "closed" | "missing" {
  const data = load();
  const giveaway = data.giveaways[id];
  if (!giveaway) return "missing";
  if (giveaway.ended || giveaway.endsAt <= Date.now()) return "closed";
  if (giveaway.entrants.includes(userId)) return "already";
  giveaway.entrants.push(userId);
  save(data);
  return "added";
}

export function endGiveaway(id: string): Giveaway | null {
  const data = load();
  const giveaway = data.giveaways[id];
  if (!giveaway) return null;
  giveaway.ended = true;
  save(data);
  return giveaway;
}

export function allGiveaways(): Giveaway[] {
  return Object.values(load().giveaways);
}

export function createReminder(input: Omit<Reminder, "id">): Reminder {
  const data = load();
  const reminder: Reminder = { ...input, id: newId() };
  data.reminders[reminder.id] = reminder;
  save(data);
  return reminder;
}

export function allReminders(): Reminder[] {
  return Object.values(load().reminders);
}

export function removeReminder(id: string): void {
  const data = load();
  delete data.reminders[id];
  save(data);
}
