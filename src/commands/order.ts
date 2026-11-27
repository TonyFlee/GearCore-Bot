import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { orderComponents } from "../lib/components";
import { orderEmbed } from "../lib/embeds";
import type { BotCommand } from ".";

export const orderCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("order").setDescription("Learn how to check your order or invoice safely."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ embeds: [orderEmbed()], components: [orderComponents()], ephemeral: true });
  },
};
