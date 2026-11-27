import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { config } from "../config";
import { inviteEmbed } from "../lib/embeds";
import type { BotCommand } from ".";

const permissions =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks |
  PermissionFlagsBits.ReadMessageHistory |
  PermissionFlagsBits.Connect |
  PermissionFlagsBits.Speak;

function inviteUrl(): string {
  const params = new URLSearchParams({
    client_id: config.discordClientId,
    permissions: permissions.toString(),
    scope: "bot applications.commands",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export const inviteCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("invite").setDescription("Get the official GearCore Bot invite link."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ embeds: [inviteEmbed(inviteUrl())] });
  },
};
