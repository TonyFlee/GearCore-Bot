import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { postAnnouncement } from "../lib/announce";
import { requireManageGuild } from "../lib/permission";
import type { BotCommand } from ".";

export const announceCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Post a GearCore announcement to the saved and auto-post channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("message").setDescription("Announcement text").setRequired(true))
    .addChannelOption((option) => option.setName("channel").setDescription("Override the destination channel").setRequired(false))
    .addBooleanOption((option) =>
      option.setName("mention_everyone").setDescription("Mention @everyone outside the embed").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await requireManageGuild(interaction))) return;
    const message = interaction.options.getString("message", true).trim();
    const override = interaction.options.getChannel("channel")?.id;
    const mentionEveryone = interaction.options.getBoolean("mention_everyone") ?? false;

    try {
      const results = await postAnnouncement(interaction.client, message, interaction.user.tag, override, true, mentionEveryone);
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
