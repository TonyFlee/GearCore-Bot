import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { ticketPanelComponents } from "../lib/components";
import { ticketPanelEmbed } from "../lib/embeds";
import { requireManageGuild } from "../lib/permission";
import { archiveTicket } from "../lib/ticket-store";
import type { BotCommand } from ".";

export const ticketCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage GearCore private support tickets.")
    .addSubcommand((sub) => sub.setName("panel").setDescription("Post the support ticket button in this channel."))
    .addSubcommand((sub) => sub.setName("close").setDescription("Close the current support ticket thread."))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await requireManageGuild(interaction))) return;

    if (interaction.options.getSubcommand() === "close") {
      const thread = interaction.channel;
      if (!thread?.isThread() || !("topic" in thread) || !String(thread.topic ?? "").startsWith("gearcore-ticket:")) {
        await interaction.reply({ content: "Run this inside a GearCore support ticket thread.", ephemeral: true });
        return;
      }
      const transcript = await archiveTicket(thread, interaction.user.tag);
      await thread.send({ content: "This ticket has been closed by staff." }).catch(() => undefined);
      await thread.setArchived(true, "GearCore ticket closed").catch(() => undefined);
      await thread.setLocked(true, "GearCore ticket closed").catch(() => undefined);
      await interaction.reply({ content: transcript ? `Ticket closed. Transcript saved (${transcript.messages.length} message(s)).` : "Ticket closed.", ephemeral: true });
      return;
    }

    await interaction.reply({
      embeds: [ticketPanelEmbed()],
      components: [ticketPanelComponents()],
    });
  },
};
