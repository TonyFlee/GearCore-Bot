import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { StoreProduct } from "../types";
import { resultsComponents } from "../lib/components";
import { noResultsEmbed, resultsPageEmbed } from "../lib/embeds";
import { createResultSession, pageSlice } from "../lib/pagination";
import { getSettings } from "../lib/settings";
import { getFeaturedProducts, getNewProducts } from "../lib/store";
import type { BotCommand } from ".";

async function replyWithProducts(interaction: ChatInputCommandInteraction, products: StoreProduct[], title: string): Promise<void> {
  if (!getSettings().productCommandsEnabled) {
    await interaction.reply({ content: "Product lookup is currently disabled.", ephemeral: true });
    return;
  }
  if (!products.length) {
    await interaction.reply({ embeds: [noResultsEmbed(title)], ephemeral: true });
    return;
  }
  await interaction.deferReply();
  const sessionId = createResultSession(title, products);
  const page = pageSlice(products, 0);
  await interaction.editReply({
    embeds: [resultsPageEmbed(page.items, title, page.page, page.pages)],
    components: [resultsComponents(sessionId, page.page, page.pages)],
  });
}

export const featuredCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("featured").setDescription("See featured GearCore products."),
  async execute(interaction: ChatInputCommandInteraction) {
    await replyWithProducts(interaction, await getFeaturedProducts(), "Featured gear");
  },
};

export const newestCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("new").setDescription("See the newest GearCore products."),
  async execute(interaction: ChatInputCommandInteraction) {
    await replyWithProducts(interaction, await getNewProducts(), "New arrivals");
  },
};
