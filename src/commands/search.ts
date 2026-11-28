import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import { resultsComponents } from "../lib/components";
import { noResultsEmbed, resultsPageEmbed } from "../lib/embeds";
import { createResultSession, pageSlice } from "../lib/pagination";
import { getSettings } from "../lib/settings";
import { getCategories, getCategoryProducts, searchAllProducts, searchProducts } from "../lib/store";
import type { BotCommand } from ".";

export const searchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search live GearCore products by name or category.")
    .addStringOption((option) => option.setName("query").setDescription("Product name or keyword").setAutocomplete(true).setRequired(true))
    .addStringOption((option) =>
      option.setName("category").setDescription("Limit results to one category").setAutocomplete(true).setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const query = interaction.options.getString("query", true).trim();
    const category = interaction.options.getString("category") ?? "";
    const products = category
      ? (await getCategoryProducts(category)).filter((product) => {
          const haystack = `${product.name} ${product.slug ?? ""} ${product.category ?? ""}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : await searchAllProducts(query);

    if (!products.length) {
      await interaction.editReply({ embeds: [noResultsEmbed(query)] });
      return;
    }
    const title = category ? `${query} in ${category}` : query;
    const sessionId = createResultSession(title, products);
    const page = pageSlice(products, 0);
    await interaction.editReply({
      embeds: [resultsPageEmbed(page.items, title, page.page, page.pages)],
      components: [resultsComponents(sessionId, page.page, page.pages)],
    });
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focused = interaction.options.getFocused(true);
      const value = String(focused.value ?? "").toLowerCase();
      if (focused.name === "category") {
        const categories = await getCategories();
        const matches = categories.filter((category) => category.toLowerCase().includes(value)).slice(0, 25);
        await interaction.respond(matches.map((category) => ({ name: category, value: category })));
        return;
      }
      const products = await searchProducts(String(focused.value ?? ""), 25);
      await interaction.respond(products.map((product) => ({ name: product.name.slice(0, 100), value: product.name })));
    } catch {
      await interaction.respond([]);
    }
  },
};
