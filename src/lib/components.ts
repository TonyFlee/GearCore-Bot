import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
} from "discord.js";
import { config, storePath } from "../config";
import { productUrl } from "./format";
import { noResultsEmbed, productEmbed, resultsPageEmbed } from "./embeds";
import { createResultSession, getResultSession, pageSlice } from "./pagination";
import { findProduct, getCategoryProducts } from "./store";
import type { StoreProduct } from "../types";

function linkButton(label: string, url: string): ButtonBuilder {
  return new ButtonBuilder().setLabel(label).setStyle(ButtonStyle.Link).setURL(url);
}

export function productComponents(product: StoreProduct): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    linkButton("View on site", productUrl(product)),
    new ButtonBuilder()
      .setCustomId(`more:${product.id}`)
      .setLabel("Similar items")
      .setStyle(ButtonStyle.Secondary)
  );
}

export function helpComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    linkButton("Shop", config.storeUrl),
    linkButton("Warranty", storePath("warranty")),
    linkButton("Invoices", storePath("account/invoices"))
  );
}

export function orderComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    linkButton("Your invoices", storePath("account/invoices")),
    linkButton("Warranty", storePath("warranty"))
  );
}

export function bundleComponents(bundles: StoreProduct[]): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    bundles.slice(0, 5).map((bundle) => linkButton(bundle.name.slice(0, 60), productUrl(bundle)))
  );
}

export function resultsComponents(sessionId: string, page: number, pages: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`p:${sessionId}:${page - 1}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`p:${sessionId}:${page + 1}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pages - 1)
  );
}

export async function handleProductButton(interaction: ButtonInteraction): Promise<boolean> {
  const customId = interaction.customId;

  if (customId.startsWith("p:")) {
    const [, sessionId, rawPage] = customId.split(":");
    const session = getResultSession(sessionId);
    if (!session) {
      await interaction.reply({ content: "These results have expired. Run the search again.", ephemeral: true });
      return true;
    }
    const page = pageSlice(session.products, Number(rawPage) || 0);
    await interaction.deferUpdate();
    await interaction.editReply({
      embeds: [resultsPageEmbed(page.items, session.query, page.page, page.pages)],
      components: [resultsComponents(sessionId, page.page, page.pages)],
    });
    return true;
  }

  if (customId.startsWith("more:")) {
    const productId = customId.slice(5);
    const product = await findProduct(productId);
    if (!product?.category) {
      await interaction.reply({ content: "No related products are available.", ephemeral: true });
      return true;
    }
    const products = await getCategoryProducts(product.category);
    if (!products.length) {
      await interaction.reply({ embeds: [noResultsEmbed(product.category)], ephemeral: true });
      return true;
    }
    const sessionId = createResultSession(product.category, products);
    const page = pageSlice(products, 0);
    await interaction.deferUpdate();
    await interaction.editReply({
      embeds: [resultsPageEmbed(page.items, product.category, page.page, page.pages)],
      components: [resultsComponents(sessionId, page.page, page.pages)],
    });
    return true;
  }

  return false;
}

