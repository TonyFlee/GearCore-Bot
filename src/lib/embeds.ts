import { EmbedBuilder, escapeMarkdown, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { config, storePath } from "../config";
import type { StoreProduct } from "../types";
import type { Giveaway, Poll } from "./engagement-store";
import { availabilityLabel, priceLabel, productUrl, truncate } from "./format";
import { PAGE_SIZE } from "./pagination";
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

function productField(product: StoreProduct, number: number) {
  return {
    name: `${number}. ${escapeMarkdown(truncate(product.name, 90))}`,
    value: `${priceLabel(product)}\n${availabilityLabel(product)}\n[View product](${productUrl(product)})`,
    inline: false,
  };
}

export function searchResultsEmbed(products: StoreProduct[], query: string): EmbedBuilder {
  const embed = baseEmbed()
    .setTitle(`Products matching "${truncate(query, 50)}"`)
    .setDescription(`${products.length} result(s) · open a product below.`);
  for (const [index, product] of products.slice(0, 5).entries()) embed.addFields(productField(product, index + 1));
  return embed;
}

export function resultsPageEmbed(products: StoreProduct[], query: string, page: number, pages: number): EmbedBuilder {
  const offset = page * PAGE_SIZE;
  const embed = baseEmbed()
    .setTitle(query ? `Products matching "${truncate(query, 44)}"` : "Featured GearCore products")
    .setDescription(`${products.length} product(s) shown · use the buttons to browse.`);
  for (const [index, product] of products.entries()) embed.addFields(productField(product, offset + index + 1));
  embed.setFooter({ text: `GearCore.Store · page ${page + 1}/${pages}` });
  return embed;
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
      { name: "Commands", value: "/product, /search, /catalog, /featured, /new, /bundle, /random, /wishlist, /order, /support, /ticket, /announce, /schedule, /poll, /giveaway, /remind, /sound, /invite, /help", inline: false }
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

export function ticketPanelEmbed(): EmbedBuilder {
  const settings = getSettings();
  return baseEmbed()
    .setTitle("GearCore support")
    .setDescription("Press the button below to open a private support thread with the GearCore team.")
    .addFields(
      { name: "What to include", value: "Your question, the product name, and when you ordered. Do not post payment details or invoice links here.", inline: false },
      { name: "Other contact", value: `Email ${settings.supportEmail} or Telegram @${settings.telegramUsername}`, inline: false }
    );
}

export function ticketOpenedEmbed(userTag: string): EmbedBuilder {
  return baseEmbed()
    .setTitle("Support ticket opened")
    .setDescription(`Thanks, ${escapeMarkdown(userTag)}. The GearCore team will reply here.`)
    .addFields(
      { name: "Please share", value: "Your question, product name, and order date if relevant.", inline: false },
      { name: "Privacy", value: "Do not post card details, passwords, or private invoice links.", inline: false }
    );
}

export function ticketClosedEmbed(userTag: string): EmbedBuilder {
  return baseEmbed()
    .setTitle("Support ticket closed")
    .setDescription(`Closed by ${escapeMarkdown(userTag)}. Need more help? Open another ticket from the support panel.`);
}

export function pollEmbed(poll: Poll): EmbedBuilder {
  const lines = poll.options.map((option, index) => `${index + 1}. ${escapeMarkdown(option)}`);
  const total = Object.keys(poll.votes).length;
  return baseEmbed()
    .setTitle(`Poll: ${truncate(poll.question, 100)}`)
    .setDescription(`${truncate(lines.join("\n"), 2800)}\n\n${total} vote(s) so far.`)
    .setFooter({ text: `Ends <t:${Math.floor(poll.closesAt / 1000)}:R> · GearCore.Store` });
}

export function pollResultsEmbed(poll: Poll, closed = true): EmbedBuilder {
  const total = Object.keys(poll.votes).length;
  const lines = poll.options.map((option, index) => {
    const count = Object.values(poll.votes).filter((vote) => vote === index).length;
    const percent = total ? Math.round((count / total) * 100) : 0;
    return `${index + 1}. ${escapeMarkdown(option)} — ${count} vote(s), ${percent}%`;
  });
  return baseEmbed()
    .setTitle(`${closed ? "Poll closed" : "Poll results"}: ${truncate(poll.question, 90)}`)
    .setDescription(truncate(lines.join("\n"), 2800))
    .setFooter({ text: `${total} total vote(s) · GearCore.Store` });
}

export function giveawayEmbed(giveaway: Giveaway): EmbedBuilder {
  return baseEmbed()
    .setTitle(`Giveaway: ${truncate(giveaway.prize, 100)}`)
    .setDescription(`Press the button to enter. ${giveaway.entrants.length} entrant(s) so far.`)
    .addFields(
      { name: "Winners", value: String(giveaway.winnerCount), inline: true },
      { name: "Ends", value: `<t:${Math.floor(giveaway.endsAt / 1000)}:R>`, inline: true }
    );
}

export function giveawayResultsEmbed(giveaway: Giveaway, winners: string[]): EmbedBuilder {
  return baseEmbed()
    .setTitle(`Giveaway ended: ${truncate(giveaway.prize, 100)}`)
    .setDescription(winners.length ? `Winners: ${winners.map((id) => `<@${id}>`).join(", ")}` : "No one entered this giveaway.")
    .setFooter({ text: `${giveaway.entrants.length} entrant(s) · GearCore.Store` });
}
