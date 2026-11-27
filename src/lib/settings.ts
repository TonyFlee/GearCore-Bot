import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config } from "../config";

export type AutoChannel = {
  guildId: string;
  channelId: string;
  enabled: boolean;
};

export type ActivityKind = "playing" | "streaming" | "listening" | "watching" | "competing";
export type PresenceKind = "online" | "idle" | "dnd" | "invisible";

export type BotSettings = {
  supportChannelId: string;
  announceChannelId: string;
  welcomeChannelId: string;
  welcomeRoleId: string;
  supportEmail: string;
  telegramUsername: string;
  promoCode: string;
  preorderDays: string;
  statusText: string;
  statusType: ActivityKind;
  presenceStatus: PresenceKind;
  statusUrl: string;
  supportEnabled: boolean;
  announcementsEnabled: boolean;
  welcomeEnabled: boolean;
  productCommandsEnabled: boolean;
  autoPostOnStart: boolean;
  autoChannels: AutoChannel[];
  voiceAutoJoinEnabled: boolean;
  voiceChannels: AutoChannel[];
};

const storagePath = resolve(process.cwd(), "data", "settings.json");
const MAX_CHANNELS = 3;

const defaults: BotSettings = {
  supportChannelId: config.supportChannelId,
  announceChannelId: config.announceChannelId,
  welcomeChannelId: config.welcomeChannelId,
  welcomeRoleId: config.welcomeRoleId,
  supportEmail: config.supportEmail,
  telegramUsername: config.telegramUsername,
  promoCode: config.promoCode,
  preorderDays: config.preorderDays,
  statusText: "🟢 Support Team Online",
  statusType: "watching",
  presenceStatus: "online",
  statusUrl: "",
  supportEnabled: true,
  announcementsEnabled: true,
  welcomeEnabled: true,
  productCommandsEnabled: true,
  autoPostOnStart: true,
  autoChannels: [],
  voiceAutoJoinEnabled: true,
  voiceChannels: [],
};

function cleanId(value: unknown): string {
  if (typeof value !== "string") return "";
  const id = value.trim().replace(/^<@[!&]?(\d+)>$/, "$1").replace(/^<#(\d+)>$/, "$1");
  return /^\d{5,30}$/.test(id) ? id : "";
}

function sanitizeChannels(value: unknown): AutoChannel[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CHANNELS).map((entry) => {
    const row = entry as Partial<AutoChannel>;
    return {
      guildId: cleanId(row.guildId),
      channelId: cleanId(row.channelId),
      enabled: row.enabled === true,
    };
  }).filter((entry) => entry.guildId && entry.channelId);
}

function sanitize(patch: Partial<BotSettings>): Partial<BotSettings> {
  const result: Partial<BotSettings> = {};
  const stringKeys: Array<keyof BotSettings> = [
    "supportChannelId", "announceChannelId", "welcomeChannelId", "welcomeRoleId",
    "supportEmail", "telegramUsername", "promoCode", "preorderDays", "statusText", "statusUrl",
  ];
  const booleanKeys: Array<keyof BotSettings> = [
    "supportEnabled", "announcementsEnabled", "welcomeEnabled", "productCommandsEnabled",
    "autoPostOnStart", "voiceAutoJoinEnabled",
  ];

  for (const key of stringKeys) {
    if (typeof patch[key] === "string") (result as Record<string, unknown>)[key] = (patch[key] as string).trim().slice(0, 200);
  }
  for (const key of booleanKeys) {
    if (typeof patch[key] === "boolean") (result as Record<string, unknown>)[key] = patch[key] as boolean;
  }
  const activityKinds: ActivityKind[] = ["playing", "streaming", "listening", "watching", "competing"];
  const presenceKinds: PresenceKind[] = ["online", "idle", "dnd", "invisible"];
  if (activityKinds.includes(patch.statusType as ActivityKind)) result.statusType = patch.statusType as ActivityKind;
  if (presenceKinds.includes(patch.presenceStatus as PresenceKind)) result.presenceStatus = patch.presenceStatus as PresenceKind;
  if (Array.isArray(patch.autoChannels)) result.autoChannels = sanitizeChannels(patch.autoChannels);
  if (Array.isArray(patch.voiceChannels)) result.voiceChannels = sanitizeChannels(patch.voiceChannels);

  return result;
}

function load(): BotSettings {
  try {
    const parsed = JSON.parse(readFileSync(storagePath, "utf8")) as Partial<BotSettings>;
    return { ...defaults, ...sanitize(parsed) };
  } catch {
    return { ...defaults };
  }
}

let current = load();

export function getSettings(): BotSettings {
  return {
    ...current,
    autoChannels: current.autoChannels.map((entry) => ({ ...entry })),
    voiceChannels: current.voiceChannels.map((entry) => ({ ...entry })),
  };
}

export function updateSettings(patch: Partial<BotSettings>): BotSettings {
  current = { ...current, ...sanitize(patch) };
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(current, null, 2), "utf8");
  return getSettings();
}
