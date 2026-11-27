import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { announcementEmbed } from "../lib/embeds";
import { getSettings } from "../lib/settings";
import type { BotCommand } from ".";

export const announceCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a GearCore announcement.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("message").setDescription("Announcement text").setRequired(true))
    .addChannelOption((option) => option.setName("channel").setDescription("Channel to post in").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const settings = getSettings();
    const message = interaction.options.getString("message", true).trim();

    if (!settings.announcementsEnabled) {
      await interaction.reply({ content: "Announcements are currently disabled.", ephemeral: true });
      return;
    }
    if (!message) {
      await interaction.reply({ content: "Announcement text cannot be empty.", ephemeral: true });
      return;
    }

    const channelId = interaction.options.getChannel("channel")?.id ?? settings.announceChannelId;
    if (!channelId) {
      await interaction.reply({
        content: "Set ANNOUNCE_CHANNEL_ID in .env or choose a channel with the channel option.",
        ephemeral: true,
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
    if (!channel || !("send" in channel)) {
      await interaction.reply({ content: "I cannot post in that channel. Check the channel ID and bot permissions.", ephemeral: true });
      return;
    }

    await channel.send({
      embeds: [announcementEmbed(message, interaction.user.tag)],
      allowedMentions: { parse: [] },
    });
    await interaction.reply({ content: "Announcement posted.", ephemeral: true });
  },
};
