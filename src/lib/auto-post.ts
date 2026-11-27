import type { Client } from "discord.js";
import { startupEmbed } from "./embeds";
import { getSettings } from "./settings";
import type { AnnounceResult } from "./announce";

export async function postStartupAnnouncement(client: Client): Promise<AnnounceResult[]> {
  const settings = getSettings();
  if (!settings.autoPostOnStart || !settings.announcementsEnabled) return [];

  const targets = Array.from(new Set(settings.autoChannels.filter((entry) => entry.enabled).map((entry) => entry.channelId))).filter(Boolean);
  const results: AnnounceResult[] = [];

  for (const channelId of targets) {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    const sendable = channel as { send?: unknown } | null;
    if (!sendable || typeof sendable.send !== "function") {
      results.push({ channelId, ok: false, error: "Cannot post in that channel." });
      continue;
    }
    try {
      await (sendable.send as (options: unknown) => Promise<unknown>)({
        embeds: [startupEmbed()],
        allowedMentions: { parse: [] },
      });
      results.push({ channelId, ok: true });
    } catch (error) {
      results.push({ channelId, ok: false, error: error instanceof Error ? error.message : "Post failed." });
    }
  }

  return results;
}
