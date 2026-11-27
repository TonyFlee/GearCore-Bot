import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { postAnnouncement } from "../lib/announce";
import type { BotCommand } from ".";

export const announceCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a GearCore announcement to the saved and auto-post channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("message").setDescription("Announcement text").setRequired(true))
    .addChannelOption((option) => option.setName("channel").setDescription("Override the destination channel").setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true).trim();
    const override = interaction.options.getChannel("channel")?.id;

    try {
      const results = await postAnnouncement(interaction.client, message, interaction.user.tag, override);
      const failed = results.filter((result) => !result.ok).length;
      await interaction.reply({
        content: failed
          ? `Announcement posted to ${results.length - failed} channel(s); ${failed} failed.`
          : `Announcement posted to ${results.length} channel(s).`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: error instanceof Error ? error.message : "Announcement failed.",
        ephemeral: true,
      });
    }
  },
};
