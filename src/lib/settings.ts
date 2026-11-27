import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config } from "../config";

export type BotSettings = {
  supportChannelId: string;
  announceChannelId: string;
  welcomeChannelId: string;
  welcomeRoleId: string;
  supportEmail: string;
  telegramUsername: string;
  promoCode: string;
  preorderDays: string;
  supportEnabled: boolean;
  announcementsEnabled: boolean;
  welcomeEnabled: boolean;
  productCommandsEnabled: boolean;
};

const storagePath = resolve(process.cwd(), "data", "settings.json");

const defaults: BotSettings = {
  supportChannelId: config.supportChannelId,
  announceChannelId: config.announceChannelId,
  welcomeChannelId: config.welcomeChannelId,
  welcomeRoleId: config.welcomeRoleId,
  supportEmail: config.supportEmail,
  telegramUsername: config.telegramUsername,
  promoCode: config.promoCode,
  preorderDays: config.preorderDays,
  supportEnabled: true,
  announcementsEnabled: true,
  welcomeEnabled: true,
  productCommandsEnabled: true,
};

function sanitize(patch: Partial<BotSettings>): Partial<BotSettings> {
  const result: Partial<BotSettings> = {};
  const stringKeys: Array<keyof BotSettings> = [
    "supportChannelId", "announceChannelId", "welcomeChannelId", "welcomeRoleId",
    "supportEmail", "telegramUsername", "promoCode", "preorderDays",
  ];
  const booleanKeys: Array<keyof BotSettings> = [
    "supportEnabled", "announcementsEnabled", "welcomeEnabled", "productCommandsEnabled",
  ];

  for (const key of stringKeys) {
    if (typeof patch[key] === "string") (result as Record<string, unknown>)[key] = (patch[key] as string).trim().slice(0, 200);
  }
  for (const key of booleanKeys) {
    if (typeof patch[key] === "boolean") (result as Record<string, unknown>)[key] = patch[key] as boolean;
  }
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
  return { ...current };
}

export function updateSettings(patch: Partial<BotSettings>): BotSettings {
  current = { ...current, ...sanitize(patch) };
  mkdirSync(dirname(storagePath), { recursive: true });
  writeFileSync(storagePath, JSON.stringify(current, null, 2), "utf8");
  return getSettings();
}
