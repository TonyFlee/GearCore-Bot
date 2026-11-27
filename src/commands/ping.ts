import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BotCommand } from ".";

export const pingCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot latency."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: `Pong · ${Math.round(interaction.client.ws.ping)} ms`, ephemeral: true });
  },
};
