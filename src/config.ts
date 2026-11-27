import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

function requiredEnv(...names: string[]): string {
  const value = firstEnv(...names);
  if (!value) throw new Error(`Missing required environment variable: ${names.join(" or ")}`);
  return value;
}

function optionalEnv(...names: string[]): string {
  return firstEnv(...names) ?? "";
}

const rawStoreUrl = firstEnv("STORE_URL", "NEXT_PUBLIC_APP_URL") ?? "https://www.gearcore.store/";
const storeUrl = rawStoreUrl.endsWith("/") ? rawStoreUrl : `${rawStoreUrl}/`;

export const config = {
  discordToken: requiredEnv("DISCORD_TOKEN"),
  discordClientId: requiredEnv("DISCORD_CLIENT_ID", "DISCORD_APPLICATION_ID"),
  discordGuildId: optionalEnv("DISCORD_GUILD_ID"),
  supabaseUrl: requiredEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requiredEnv("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  storeUrl,
  supportEmail: firstEnv("SUPPORT_EMAIL") ?? "gearcorebyfl33@gmail.com",
  telegramUsername: firstEnv("TELEGRAM_USERNAME", "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME") ?? "Torn_Visal",
  promoCode: firstEnv("PROMO_CODE") ?? "WELCOME10",
  preorderDays: firstEnv("PREORDER_DAYS") ?? "7-10 days",
  supportChannelId: optionalEnv("SUPPORT_CHANNEL_ID"),
  announceChannelId: optionalEnv("ANNOUNCE_CHANNEL_ID"),
  welcomeChannelId: optionalEnv("WELCOME_CHANNEL_ID"),
  welcomeRoleId: optionalEnv("WELCOME_ROLE_ID"),
  controlPort: Number(firstEnv("CONTROL_PORT") ?? "8787"),
  controlApiToken: requiredEnv("CONTROL_API_TOKEN"),
};

export function storePath(path: string): string {
  return new URL(path.replace(/^\//, ""), config.storeUrl).toString();
}
