import { Events, type GuildMember } from "discord.js";
import { welcomeEmbed } from "../lib/embeds";
import { getSettings } from "../lib/settings";

export const guildMemberAddEvent = {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    const settings = getSettings();
    if (!settings.welcomeEnabled) return;

    if (settings.welcomeChannelId) {
      const channel = await member.client.channels.fetch(settings.welcomeChannelId).catch(() => null);
      if (channel && "send" in channel) {
        await channel.send({ embeds: [welcomeEmbed(member)], allowedMentions: { parse: [] } }).catch((error) => {
          console.error("Welcome message failed:", error);
        });
      }
    }

    if (settings.welcomeRoleId) {
      await member.roles.add(settings.welcomeRoleId).catch((error) => {
        console.error("Welcome role assignment failed:", error);
      });
    }
  },
};
