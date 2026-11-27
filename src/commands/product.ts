import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { noResultsEmbed, productEmbed, searchResultsEmbed } from "../lib/embeds";
import { getSettings } from "../lib/settings";
import { searchProducts } from "../lib/store";
import type { BotCommand } from ".";

export const productCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("product")
    .setDescription("Find a GearCore product by name, slug, or category.")
    .addStringOption((option) =>
      option.setName("query").setDescription("Name, slug, or category. Leave blank for featured products.").setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const query = interaction.options.getString("query") ?? "";
    const products = await searchProducts(query);

    if (!products.length) {
      await interaction.editReply({ embeds: [noResultsEmbed(query)] });
      return;
    }

    if (products.length === 1) {
      await interaction.editReply({ embeds: [productEmbed(products[0])] });
      return;
    }

    await interaction.editReply({ embeds: [searchResultsEmbed(products, query || "featured")] });
  },
};
