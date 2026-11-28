import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { createReminder } from "../lib/engagement-store";
import type { BotCommand } from ".";

export const remindCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Set a private reminder. The bot will DM you when it is due.")
    .addStringOption((option) => option.setName("message").setDescription("Reminder message").setMaxLength(200).setRequired(true))
    .addIntegerOption((option) =>
      option.setName("minutes").setDescription("Minutes from now (1-10080, default 60)").setMinValue(1).setMaxValue(10080).setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const minutes = interaction.options.getInteger("minutes") ?? 60;
    createReminder({
      userId: interaction.user.id,
      guildId: interaction.guild?.id ?? "DM",
      message: interaction.options.getString("message", true).trim(),
      dueAt: Date.now() + minutes * 60_000,
    });
    await interaction.reply({
      content: `Reminder set for <t:${Math.floor((Date.now() + minutes * 60_000) / 1000)}:R>. I will DM you.`,
      ephemeral: true,
    });
  },
};
