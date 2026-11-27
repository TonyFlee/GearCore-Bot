import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { productComponents } from "../lib/components";
import { noResultsEmbed, productEmbed } from "../lib/embeds";
import { getSettings } from "../lib/settings";
import { getRandomProduct } from "../lib/store";
import type { BotCommand } from ".";

export const randomCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("random").setDescription("Show a random live GearCore product."),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const product = await getRandomProduct();
    if (!product) {
      await interaction.editReply({ embeds: [noResultsEmbed("catalog")] });
      return;
    }
    await interaction.editReply({
      embeds: [productEmbed(product)],
      components: [productComponents(product)],
    });
  },
};
