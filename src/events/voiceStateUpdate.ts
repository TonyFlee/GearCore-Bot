import { Events, type VoiceState } from "discord.js";
import { getSettings } from "../lib/settings";
import { joinVoiceChannelForMember } from "../lib/voice";

export const voiceStateUpdateEvent = {
  name: Events.VoiceStateUpdate,
  async execute(_oldState: VoiceState, newState: VoiceState) {
    if (!newState.channelId || !newState.channel) return;
    if (newState.member?.user.bot) return;
    if (!getSettings().voiceAutoJoinEnabled) return;
    if (newState.channel.members.has(newState.client.user?.id ?? "")) return;

    console.log(`Voice auto-join: member joined configured channel ${newState.channelId}`);
    await joinVoiceChannelForMember(newState.client, newState.guild.id, newState.channelId).catch((error) => {
      console.error("Voice follow failed:", error);
    });
  },
};
