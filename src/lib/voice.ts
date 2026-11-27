import { entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { ChannelType, PermissionFlagsBits, type Client } from "discord.js";
import { getSettings, type AutoChannel } from "./settings";
import type { AnnounceResult } from "./announce";

export async function joinVoiceTarget(client: Client, target: AutoChannel): Promise<AnnounceResult> {
  if (!target.enabled || !target.channelId) return { channelId: target.channelId, ok: false, error: "Disabled." };

  const channel = await client.channels.fetch(target.channelId).catch(() => null);
  if (!channel?.isVoiceBased()) {
    return { channelId: target.channelId, ok: false, error: "That ID is not a voice or stage channel." };
  }
  if (target.guildId && channel.guild.id !== target.guildId) {
    return { channelId: target.channelId, ok: false, error: "Channel does not belong to the configured server." };
  }

  const isStage = channel.type === ChannelType.GuildStageVoice;
  const isNormalVoice = channel.type === ChannelType.GuildVoice;
  if (!isNormalVoice && !isStage) {
    return { channelId: target.channelId, ok: false, error: "Only normal voice channels and stage channels are supported." };
  }

  const me = channel.guild.members.me ?? await channel.guild.members.fetchMe().catch(() => null);
  if (!me) return { channelId: target.channelId, ok: false, error: "Bot is not a member of that server." };

  const permissions = channel.permissionsFor(me);
  const canConnect = permissions?.has(PermissionFlagsBits.Connect) === true;
  const canSpeak = permissions?.has(PermissionFlagsBits.Speak) === true;
  if (!canConnect || (isNormalVoice && !canSpeak)) {
    return {
      channelId: target.channelId,
      ok: false,
      error: `Bot needs ${isNormalVoice ? "View, Connect and Speak" : "View and Connect"} permission in #${channel.name}.`,
    };
  }

  const existing = getVoiceConnection(channel.guild.id);
  if (existing?.joinConfig.channelId === channel.id && existing.state.status !== VoiceConnectionStatus.Destroyed) {
    return { channelId: target.channelId, ok: true };
  }
  existing?.destroy();

  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    return { channelId: target.channelId, ok: true };
  } catch (error) {
    getVoiceConnection(channel.guild.id)?.destroy();
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
  console.log(`Voice auto-join: checking ${targets.length} configured channel(s).`);
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
