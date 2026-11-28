import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import { resultsComponents } from "../lib/components";
import { noResultsEmbed, resultsPageEmbed } from "../lib/embeds";
import { createResultSession, pageSlice } from "../lib/pagination";
import { getSettings } from "../lib/settings";
import { filterByAvailability, getCategories, getCategoryProducts, getProducts } from "../lib/store";
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
    )
    .addStringOption((option) =>
      option
        .setName("availability")
        .setDescription("Filter by in stock or preorder")
        .setRequired(false)
        .addChoices(
          { name: "All", value: "all" },
          { name: "In stock", value: "in-stock" },
          { name: "Preorder", value: "preorder" }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!getSettings().productCommandsEnabled) {
      await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
      return;
    }

    await interaction.deferReply();
    const category = interaction.options.getString("category") ?? "";
    const availability = interaction.options.getString("availability") ?? "all";
    const products = filterByAvailability(category ? await getCategoryProducts(category) : await getProducts(), availability);
    const title = [category || "All products", availability === "all" ? "" : availability === "in-stock" ? "in stock" : "preorder"].filter(Boolean).join(" · ");

    if (!products.length) {
      await interaction.editReply({ embeds: [noResultsEmbed(title)] });
      return;
    }

    const sessionId = createResultSession(title, products);
    const page = pageSlice(products, 0);
    await interaction.editReply({
      embeds: [resultsPageEmbed(page.items, title, page.page, page.pages)],
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
