import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { bundleEmbed } from "../lib/embeds";
import { getSettings } from "../lib/settings";
import { getBundles } from "../lib/store";
import type { BotCommand } from ".";

export const bundleCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("bundle").setDescription("Show live GearCore bundle prices and savings."),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const bundles = await getBundles();
    await interaction.editReply({ embeds: [bundleEmbed(bundles)] });
  },
};
