import { PermissionFlagsBits, type Client } from "discord.js";
import { getSettings, type AutoChannel } from "./settings";
import type { AnnounceResult } from "./announce";

async function joinVoiceTarget(client: Client, target: AutoChannel): Promise<AnnounceResult> {
  if (!target.enabled || !target.channelId) return { channelId: target.channelId, ok: false, error: "Disabled." };

  const channel = await client.channels.fetch(target.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return { channelId: target.channelId, ok: false, error: "Voice channel not found." };
  }
  if (target.guildId && channel.guild.id !== target.guildId) {
    return { channelId: target.channelId, ok: false, error: "Channel does not belong to the configured server." };
  }

  const botId = client.user?.id;
  if (botId && channel.members.has(botId)) return { channelId: target.channelId, ok: true };

  const me = channel.guild.members.me;
  if (!me || !me.permissions.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
    return { channelId: target.channelId, ok: false, error: "Missing Connect or Speak permission." };
  }

  if (!("join" in channel) || typeof channel.join !== "function") {
    return { channelId: target.channelId, ok: false, error: "Not a voice channel or missing join permission." };
  }

  try {
    await channel.join();
    return { channelId: target.channelId, ok: true };
  } catch (error) {
    return {
      channelId: target.channelId,
      ok: false,
      error: error instanceof Error ? error.message : "Join failed.",
    };
  }
}

export async function joinConfiguredVoiceChannels(client: Client): Promise<AnnounceResult[]> {
  const settings = getSettings();
  if (!settings.voiceAutoJoinEnabled) return [];
  const targets = Array.from(new Map(settings.voiceChannels.filter((entry) => entry.enabled).map((entry) => [entry.channelId, entry])).values());
  const results: AnnounceResult[] = [];
  for (const target of targets) results.push(await joinVoiceTarget(client, target));
  return results;
}

export async function joinVoiceChannelForMember(client: Client, guildId: string, channelId: string): Promise<void> {
  const settings = getSettings();
  if (!settings.voiceAutoJoinEnabled) return;
  const target = settings.voiceChannels.find((entry) =>
    entry.enabled &&
    entry.channelId === channelId &&
    (!entry.guildId || entry.guildId === guildId)
  );
  if (!target) return;
  await joinVoiceTarget(client, target);
}
