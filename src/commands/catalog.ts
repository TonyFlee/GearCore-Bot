import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import { resultsComponents } from "../lib/components";
import { noResultsEmbed, resultsPageEmbed } from "../lib/embeds";
import { createResultSession, pageSlice } from "../lib/pagination";
import { getSettings } from "../lib/settings";
import { getCategories, getCategoryProducts, getProducts } from "../lib/store";
import type { BotCommand } from ".";

export const catalogCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("catalog")
    .setDescription("Browse the live GearCore catalog, optionally by category.")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Category to browse. Leave blank for all products.")
        .setAutocomplete(true)
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }

    await interaction.deferReply();
    const category = interaction.options.getString("category") ?? "";
    const products = category ? await getCategoryProducts(category) : await getProducts();

    if (!products.length) {
      await interaction.editReply({ embeds: [noResultsEmbed(category || "catalog")] });
      return;
    }

    const sessionId = createResultSession(category || "All products", products);
    const page = pageSlice(products, 0);
    await interaction.editReply({
      embeds: [resultsPageEmbed(page.items, category || "All products", page.page, page.pages)],
      components: [resultsComponents(sessionId, page.page, page.pages)],
    });
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focused = String(interaction.options.getFocused() ?? "").toLowerCase();
      const categories = await getCategories();
      const matches = categories.filter((category) => category.toLowerCase().includes(focused)).slice(0, 25);
      await interaction.respond(matches.map((category) => ({ name: category, value: category })));
    } catch {
      await interaction.respond([]);
    }
  },
};
