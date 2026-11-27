import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import { productComponents, resultsComponents } from "../lib/components";
import { noResultsEmbed, productEmbed, resultsPageEmbed } from "../lib/embeds";
import { priceLabel } from "../lib/format";
import { createResultSession, pageSlice } from "../lib/pagination";
import { getSettings } from "../lib/settings";
import { searchAllProducts, searchProducts } from "../lib/store";
import type { BotCommand } from ".";

export const productCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("product")
    .setDescription("Find a GearCore product by name, slug, or category.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Name, slug, or category. Leave blank for featured products.")
        .setAutocomplete(true)
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }

    await interaction.deferReply();
    const query = interaction.options.getString("query") ?? "";
    const products = await searchAllProducts(query);

    if (!products.length) {
      await interaction.editReply({ embeds: [noResultsEmbed(query)] });
      return;
    }

    if (products.length === 1) {
      await interaction.editReply({
        embeds: [productEmbed(products[0])],
        components: [productComponents(products[0])],
      });
      return;
    }

    const sessionId = createResultSession(query, products);
    const page = pageSlice(products, 0);
    await interaction.editReply({
      embeds: [resultsPageEmbed(page.items, query, page.page, page.pages)],
      components: [resultsComponents(sessionId, page.page, page.pages)],
    });
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focused = interaction.options.getFocused();
      const products = await searchProducts(String(focused ?? ""), 5);
      await interaction.respond(products.map((product) => ({
        name: `${product.name} — ${priceLabel(product)}`.slice(0, 100),
        value: product.slug || product.id,
      })));
    } catch {
      await interaction.respond([]);
    }
  },
};
