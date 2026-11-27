import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { helpEmbed } from "../lib/embeds";
import type { BotCommand } from ".";

export const helpCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("help").setDescription("GearCore delivery, payment, warranty, and contact information."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ embeds: [helpEmbed()] });
  },
};
