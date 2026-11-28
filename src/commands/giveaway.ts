import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { giveawayComponents } from "../lib/components";
import { giveawayEmbed } from "../lib/embeds";
import { createGiveaway } from "../lib/engagement-store";
import { requireManageGuild } from "../lib/permission";
import type { BotCommand } from ".";

export const giveawayCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Start a community giveaway.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("prize").setDescription("What players can win").setMaxLength(120).setRequired(true))
    .addIntegerOption((option) =>
      option.setName("minutes").setDescription("Duration in minutes (1-10080, default 60)").setMinValue(1).setMaxValue(10080).setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName("winners").setDescription("Number of winners (1-10, default 1)").setMinValue(1).setMaxValue(10).setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await requireManageGuild(interaction))) return;
    if (!interaction.guild) {
      await interaction.reply({ content: "Use /giveaway in a server.", ephemeral: true });
      return;
    }
    const minutes = interaction.options.getInteger("minutes") ?? 60;
    const winnerCount = interaction.options.getInteger("winners") ?? 1;
    const giveaway = createGiveaway({
      prize: interaction.options.getString("prize", true).trim(),
      guildId: interaction.guild.id,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      winnerCount,
      endsAt: Date.now() + minutes * 60_000,
    });
    await interaction.reply({ embeds: [giveawayEmbed(giveaway)], components: [giveawayComponents(giveaway.id)] });
  },
};
