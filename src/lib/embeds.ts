import { EmbedBuilder, escapeMarkdown, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { config, storePath } from "../config";
import type { StoreProduct } from "../types";
import { availabilityLabel, priceLabel, productUrl, truncate } from "./format";
import { getSettings } from "./settings";

const BRAND = 0x06b6d4;

function baseEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND)
    .setTimestamp()
    .setFooter({ text: "GearCore.Store" });
}

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function productEmbed(product: StoreProduct): EmbedBuilder {
  const embed = baseEmbed()
    .setTitle(escapeMarkdown(product.name))
    .setURL(productUrl(product))
    .setDescription(truncate(product.description) || "Available from GearCore.Store.")
    .addFields(
      { name: "Price", value: priceLabel(product), inline: true },
      { name: "Availability", value: availabilityLabel(product), inline: true },
      { name: "Category", value: escapeMarkdown(product.category || "Uncategorised"), inline: true }
    );

  const image = safeImageUrl(product.image_url);
  if (image) embed.setImage(image);
  return embed;
}

export function searchResultsEmbed(products: StoreProduct[], query: string): EmbedBuilder {
  const lines = products.slice(0, 5).map((product, index) => {
    return `${index + 1}. [${escapeMarkdown(product.name)}](${productUrl(product)}) — ${priceLabel(product)} · ${availabilityLabel(product)}`;
  });
  return baseEmbed()
    .setTitle(`Products matching "${truncate(query, 50)}"`)
    .setDescription(truncate(lines.join("\n"), 3800));
}

export function resultsPageEmbed(products: StoreProduct[], query: string, page: number, pages: number): EmbedBuilder {
  const lines = products.map((product, index) => {
    return `${index + 1}. [${escapeMarkdown(product.name)}](${productUrl(product)}) — ${priceLabel(product)} · ${availabilityLabel(product)}`;
  });
  return baseEmbed()
    .setTitle(query ? `Products matching "${truncate(query, 44)}"` : "Featured GearCore products")
    .setDescription(truncate(lines.join("\n"), 3800))
    .setFooter({ text: `GearCore.Store · page ${page + 1}/${pages}` });
}

export function noResultsEmbed(query: string): EmbedBuilder {
  return baseEmbed()
    .setTitle("No products found")
    .setDescription(`No published GearCore product matches "${truncate(query, 80)}". Try a shorter name, a category, or use /bundle.`);
}

export function startupEmbed(): EmbedBuilder {
  return baseEmbed()
    .setTitle("GearCore Bot online")
    .setURL(config.storeUrl)
    .setDescription("Product search, bundles, order help, and support are ready.")
    .addFields(
      { name: "Shop", value: `[gearcore.store](${config.storeUrl})`, inline: true },
      { name: "Help", value: "Use /help for delivery, payment, preorder, and warranty answers.", inline: true }
    );
}

export function inviteEmbed(url: string): EmbedBuilder {
  return baseEmbed()
    .setTitle("Invite GearCore Bot")
    .setURL(url)
    .setDescription("[Add the bot to your server](<" + url + ">) with slash commands enabled.")
    .addFields(
      { name: "Setup", value: "Invite, then use /help to see what the bot can do.", inline: false },
      { name: "Privacy", value: "The bot reads only the public GearCore product catalog.", inline: false }
    );
}

export function bundleEmbed(bundles: StoreProduct[]): EmbedBuilder {
  const embed = baseEmbed()
    .setTitle("GearCore bundles")
    .setURL(storePath("bundles"))
    .setDescription("Live prices from gearcore.store.");

  if (!bundles.length) {
    embed.setDescription("No bundles are published right now.");
    return embed;
  }

  for (const bundle of bundles) {
    embed.addFields({
      name: `[${escapeMarkdown(bundle.name)}](${productUrl(bundle)})`,
      value: `${priceLabel(bundle)} · ${availabilityLabel(bundle)}`,
      inline: false,
    });
  }
  return embed;
}

export function orderEmbed(): EmbedBuilder {
  const settings = getSettings();
  return baseEmbed()
    .setTitle("Order & invoice help")
    .setDescription("For privacy, this bot does not read or display order records. Use your own account or invoice link to check an order.")
    .addFields(
      {
        name: "Check your order",
        value: `[Sign in to your account](${storePath("account/invoices")}) to view invoices and order status.`,
        inline: false,
      },
      {
        name: "Invoice email",
        value: "Open the verification link in the invoice email we sent you. That link is unique to you.",
        inline: false,
      },
      {
        name: "Need help?",
        value: `Use /support in this server, email ${settings.supportEmail}, or message @${settings.telegramUsername} on Telegram.`,
        inline: false,
      }
    )
    .setFooter({ text: "No private order data is read by this bot" });
}

export function helpEmbed(): EmbedBuilder {
  const settings = getSettings();
  return baseEmbed()
    .setTitle("GearCore support")
    .setURL(config.storeUrl)
    .setDescription("Quick answers for GearCore.Store customers.")
    .addFields(
      { name: "Contact", value: `Email ${settings.supportEmail} or Telegram @${settings.telegramUsername}`, inline: false },
      { name: "Delivery", value: "1-2 days in Cambodia. Free over $50 or in Siem Reap; otherwise usually $2.", inline: false },
      { name: "Preorders", value: `Preorder items arrive about ${settings.preorderDays} after the deposit is confirmed.`, inline: false },
      { name: "Payment", value: "ABA, KHQR/Bakong, and card checkout are supported. KHR uses the rate shown at checkout.", inline: false },
      { name: "First order", value: `Use ${settings.promoCode} for 10% off your first order.`, inline: false },
      { name: "Warranty", value: `[Read warranty terms](${storePath("warranty")}) or ask in /support.`, inline: false },
      { name: "Commands", value: "/product, /catalog, /bundle, /random, /order, /support, /invite, /ping", inline: false }
    );
}

export function supportRequestEmbed(interaction: ChatInputCommandInteraction, message: string): EmbedBuilder {
  return baseEmbed()
    .setTitle("New support request")
    .addFields(
      { name: "Customer", value: `${escapeMarkdown(interaction.user.tag)} · <@${interaction.user.id}>`, inline: true },
      { name: "Server", value: escapeMarkdown(interaction.guild?.name ?? "DM"), inline: true },
      { name: "Message", value: truncate(message, 3800), inline: false }
    )
    .setFooter({ text: "Reply by email or Telegram; do not post private order data here" });
}

export function announcementEmbed(message: string, authorTag: string): EmbedBuilder {
  return baseEmbed()
    .setTitle("Store announcement")
    .setURL(config.storeUrl)
    .setDescription(truncate(message, 3800))
    .setFooter({ text: `Posted by ${authorTag}` });
}

export function welcomeEmbed(member: GuildMember): EmbedBuilder {
  const settings = getSettings();
  return baseEmbed()
    .setTitle(`Welcome, ${escapeMarkdown(member.user.username)}!`)
    .setDescription(`Welcome to the GearCore community. Use ${settings.promoCode} for 10% off your first order.`)
    .addFields(
      { name: "Shop", value: `[Browse gearcore.store](${config.storeUrl})`, inline: true },
      { name: "Help", value: "Use /help or /support if you need assistance.", inline: true }
    );
}
