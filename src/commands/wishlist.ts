import { SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import { createResultSession, pageSlice } from "../lib/pagination";
import { resultsComponents } from "../lib/components";
import { resultsPageEmbed } from "../lib/embeds";
import { findProduct, findProductsByIds, searchProducts } from "../lib/store";
import { addToWishlist, clearWishlist, getWishlist, removeFromWishlist } from "../lib/wishlist-store";
import type { BotCommand } from ".";

export const wishlistCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("wishlist")
    .setDescription("Save products you like. Only you can see your wishlist.")
    .addSubcommand((sub) => sub.setName("list").setDescription("Show your saved products."))
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Save a product.")
        .addStringOption((option) => option.setName("product").setDescription("Product to save").setAutocomplete(true).setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a saved product.")
        .addStringOption((option) => option.setName("product").setDescription("Product to remove").setAutocomplete(true).setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("clear").setDescription("Clear your saved products.")),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "clear") {
      clearWishlist(userId);
      await interaction.reply({ content: "Your wishlist is empty.", ephemeral: true });
      return;
    }

    if (subcommand === "list") {
      const products = await findProductsByIds(getWishlist(userId));
      if (!products.length) {
        await interaction.reply({ content: "Your wishlist is empty. Use /wishlist add to save a product.", ephemeral: true });
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      const title = `Your wishlist · ${products.length} item(s)`;
      const sessionId = createResultSession(title, products);
      const page = pageSlice(products, 0);
      await interaction.editReply({
        embeds: [resultsPageEmbed(page.items, title, page.page, page.pages)],
        components: [resultsComponents(sessionId, page.page, page.pages)],
      });
      return;
    }

    const reference = interaction.options.getString("product", true);
    const product = await findProduct(reference);
    if (!product) {
      await interaction.reply({ content: "That product was not found.", ephemeral: true });
      return;
    }

    if (subcommand === "add") {
      const added = addToWishlist(userId, product.id);
      await interaction.reply({
        content: added ? `Saved **${product.name}** to your wishlist.` : "That product is already saved or your wishlist is full.",
        ephemeral: true,
      });
      return;
    }

    const removed = removeFromWishlist(userId, product.id);
    await interaction.reply({
      content: removed ? `Removed **${product.name}** from your wishlist.` : "That product was not on your wishlist.",
      ephemeral: true,
    });
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const focused = String(interaction.options.getFocused() ?? "");
      const products = await searchProducts(focused, 25);
      await interaction.respond(products.map((product) => ({ name: product.name.slice(0, 100), value: product.name })));
    } catch {
      await interaction.respond([]);
    }
  },
};
