import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { supportRequestEmbed } from "../lib/embeds";
import { getSettings } from "../lib/settings";
import { addSupportRequest } from "../lib/support-store";
import type { BotCommand } from ".";

export const supportCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Send a help request to GearCore support.")
    .addStringOption((option) =>
      option.setName("message").setDescription("Describe your issue. Do not include payment or private order details.").setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const settings = getSettings();
    const message = interaction.options.getString("message", true).trim();

    if (message.length < 5) {
      await interaction.reply({ content: "Please write at least a few words so support can help.", ephemeral: true });
      return;
    }

    addSupportRequest({
      userTag: interaction.user.tag,
      userId: interaction.user.id,
      guild: interaction.guild?.name ?? "DM",
      message,
    });

    if (!settings.supportEnabled) {
      await interaction.reply({
        content: `Support chat is currently closed. Email ${settings.supportEmail} or message @${settings.telegramUsername}.`,
        ephemeral: true,
      });
      return;
    }

    if (!settings.supportChannelId) {
      await interaction.reply({
        content: `Support chat is not configured here yet. You can email ${settings.supportEmail} or message @${settings.telegramUsername} on Telegram.`,
        ephemeral: true,
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(settings.supportChannelId).catch(() => null);
    if (!channel || !("send" in channel)) {
      await interaction.reply({
        content: `Support chat is unavailable right now. Please email ${settings.supportEmail} or message @${settings.telegramUsername}.`,
        ephemeral: true,
      });
      return;
    }

    await channel.send({
      embeds: [supportRequestEmbed(interaction, message)],
      allowedMentions: { parse: [] },
    });
    await interaction.reply({ content: "Your request has been sent to GearCore support.", ephemeral: true });
  },
};
