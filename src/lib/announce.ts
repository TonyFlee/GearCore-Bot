import type { Client } from "discord.js";
import { announcementEmbed } from "./embeds";
import { getSettings } from "./settings";

export type AnnounceResult = {
  channelId: string;
  ok: boolean;
  error?: string;
};

export async function postAnnouncement(
  client: Client,
  rawMessage: string,
  authorTag: string,
  overrideChannelId?: string,
  includeAuto = true
): Promise<AnnounceResult[]> {
  const settings = getSettings();
  const message = rawMessage.trim();
  if (!settings.announcementsEnabled) throw new Error("Announcements are disabled in settings.");
  if (!message) throw new Error("Message is required.");

  const autoChannelIds = includeAuto ? settings.autoChannels.filter((entry) => entry.enabled).map((entry) => entry.channelId) : [];
  const targets = Array.from(new Set(
    overrideChannelId
      ? [overrideChannelId]
      : [settings.announceChannelId, ...autoChannelIds]
  )).filter(Boolean);

  if (!targets.length) throw new Error("No announcement channel is configured.");

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
        embeds: [announcementEmbed(message, authorTag)],
        allowedMentions: { parse: [] },
      });
      results.push({ channelId, ok: true });
    } catch (error) {
      results.push({
        channelId,
        ok: false,
        error: error instanceof Error ? error.message : "Post failed.",
      });
    }
  }
  return results;
}
