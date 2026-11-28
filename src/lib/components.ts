import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type ButtonInteraction,
} from "discord.js";
import { config, storePath } from "../config";
import { productUrl } from "./format";
import { giveawayEmbed, noResultsEmbed, pollEmbed, productEmbed, resultsPageEmbed, ticketClosedEmbed, ticketOpenedEmbed } from "./embeds";
import { enterGiveaway, getGiveaway, getPoll, votePoll } from "./engagement-store";
import { createResultSession, getResultSession, pageSlice } from "./pagination";
import { getSettings } from "./settings";
import { findProduct, getCategoryProducts } from "./store";
import { addToWishlist } from "./wishlist-store";
import { archiveTicket } from "./ticket-store";
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
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`wish:${product.id}`)
      .setLabel("Save")
      .setStyle(ButtonStyle.Secondary)
  );
}

export function helpComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    linkButton("Shop", config.storeUrl),
    linkButton("Warranty", storePath("warranty")),
    linkButton("Invoices", storePath("account/invoices")),
    new ButtonBuilder().setCustomId("ticket:open").setLabel("Get help").setStyle(ButtonStyle.Primary)
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

export function ticketPanelComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("ticket:open").setLabel("Get help").setStyle(ButtonStyle.Primary)
  );
}

export function ticketCloseComponents(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("ticket:close").setLabel("Close ticket").setStyle(ButtonStyle.Danger)
  );
}

export function pollComponents(pollId: string, options: string[]): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let start = 0; start < options.length; start += 5) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
      options.slice(start, start + 5).map((_, index) =>
        new ButtonBuilder()
          .setCustomId(`poll:vote:${pollId}:${start + index}`)
          .setLabel(String(start + index + 1))
          .setStyle(ButtonStyle.Secondary)
      )
    ));
  }
  return rows;
}

export function giveawayComponents(giveawayId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`giveaway:enter:${giveawayId}`).setLabel("Enter giveaway").setStyle(ButtonStyle.Success)
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

  if (customId.startsWith("wish:")) {
    const productId = customId.slice(5);
    const product = await findProduct(productId);
    if (!product) {
      await interaction.reply({ content: "That product is no longer available.", ephemeral: true });
      return true;
    }
    const added = addToWishlist(interaction.user.id, product.id);
    await interaction.reply({
      content: added ? `Saved **${product.name}** to your wishlist.` : "That product is already saved or your wishlist is full.",
      ephemeral: true,
    });
    return true;
  }

  return false;
}

function ticketHost(channel: unknown): any | null {
  if (!channel) return null;
  const value = channel as any;
  if ((value.type === ChannelType.GuildText || value.type === ChannelType.GuildAnnouncement) && value.threads && typeof value.threads.create === "function") {
    return value;
  }
  return null;
}

export async function handleTicketButton(interaction: ButtonInteraction): Promise<boolean> {
  const customId = interaction.customId;

  if (customId === "ticket:open") {
    const settings = getSettings();
    let host = ticketHost(interaction.channel);

    if (settings.supportChannelId) {
      const configured = await interaction.client.channels.fetch(settings.supportChannelId).catch(() => null);
      const configuredHost = ticketHost(configured);
      if (configuredHost && (!interaction.guildId || configuredHost.guild?.id === interaction.guildId)) {
        host = configuredHost;
      }
    }

    if (!host) {
      await interaction.reply({ content: "Support tickets are unavailable in this channel. Use /support instead.", ephemeral: true });
      return true;
    }

    const topic = `gearcore-ticket:${interaction.user.id}`;
    await host.threads.fetchActive().catch(() => undefined);
    const existing = host.threads.cache.find((thread: any) =>
      !thread.archived && String(thread.topic ?? "") === topic
    );
    if (existing) {
      await interaction.reply({ content: `You already have an open ticket: ${existing.toString()}`, ephemeral: true });
      return true;
    }

    const thread = await host.threads.create({
      name: `help-${interaction.user.username}`.slice(0, 90),
      type: ChannelType.PrivateThread,
      topic,
      reason: "GearCore support ticket",
    } as never);
    await thread.members.add(interaction.user.id).catch(() => undefined);
    await thread.send({
      embeds: [ticketOpenedEmbed(interaction.user.tag)],
      components: [ticketCloseComponents()],
      allowedMentions: { parse: [] },
    });
    await interaction.reply({ content: `Support ticket opened: ${thread.toString()}`, ephemeral: true });
    return true;
  }

  if (customId === "ticket:close") {
    const thread = interaction.channel;
    if (!thread?.isThread() || !("topic" in thread) || !String(thread.topic ?? "").startsWith("gearcore-ticket:")) {
      await interaction.reply({ content: "This close button only works inside a GearCore support ticket.", ephemeral: true });
      return true;
    }
    const transcript = await archiveTicket(thread, interaction.user.tag);
    await thread.send({ embeds: [ticketClosedEmbed(interaction.user.tag)] }).catch(() => undefined);
    await thread.setArchived(true, "GearCore ticket closed").catch(() => undefined);
    await thread.setLocked(true, "GearCore ticket closed").catch(() => undefined);
    await interaction.reply({ content: transcript ? `Ticket closed. Transcript saved (${transcript.messages.length} message(s)).` : "Ticket closed.", ephemeral: true });
    return true;
  }

  return false;
}

export async function handleEngagementButton(interaction: ButtonInteraction): Promise<boolean> {
  const customId = interaction.customId;

  if (customId.startsWith("poll:vote:")) {
    const [, , id, rawOption] = customId.split(":");
    const poll = votePoll(id, interaction.user.id, Number(rawOption));
    if (!poll) {
      await interaction.reply({ content: "That poll is closed or your vote could not be counted.", ephemeral: true });
      return true;
    }
    await interaction.deferUpdate();
    await interaction.editReply({ embeds: [pollEmbed(poll)], components: pollComponents(poll.id, poll.options) });
    return true;
  }

  if (customId.startsWith("giveaway:enter:")) {
    const id = customId.slice("giveaway:enter:".length);
    const status = enterGiveaway(id, interaction.user.id);
    if (status === "missing") {
      await interaction.reply({ content: "That giveaway no longer exists.", ephemeral: true });
      return true;
    }
    if (status === "closed") {
      await interaction.reply({ content: "That giveaway has ended.", ephemeral: true });
      return true;
    }
    const giveaway = getGiveaway(id);
    if (!giveaway) return true;
    if (status === "already") {
      await interaction.reply({ content: "You are already entered.", ephemeral: true });
      return true;
    }
    await interaction.deferUpdate();
    await interaction.editReply({ embeds: [giveawayEmbed(giveaway)], components: [giveawayComponents(giveaway.id)] });
    return true;
  }

  return false;
}

