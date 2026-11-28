import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { pollComponents } from "../lib/components";
import { pollEmbed } from "../lib/embeds";
import { createPoll } from "../lib/engagement-store";
import { requireManageGuild } from "../lib/permission";
import type { BotCommand } from ".";

export const pollCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a quick community poll.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("question").setDescription("Poll question").setMaxLength(180).setRequired(true))
    .addStringOption((option) => option.setName("option1").setDescription("First choice").setMaxLength(80).setRequired(true))
    .addStringOption((option) => option.setName("option2").setDescription("Second choice").setMaxLength(80).setRequired(true))
    .addStringOption((option) => option.setName("option3").setDescription("Third choice (optional)").setMaxLength(80).setRequired(false))
    .addStringOption((option) => option.setName("option4").setDescription("Fourth choice (optional)").setMaxLength(80).setRequired(false))
    .addIntegerOption((option) =>
      option.setName("minutes").setDescription("How long the poll runs (1-1440, default 10)").setMinValue(1).setMaxValue(1440).setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await requireManageGuild(interaction))) return;
    if (!interaction.guild) {
      await interaction.reply({ content: "Use /poll in a server.", ephemeral: true });
      return;
    }
    const options = [
      interaction.options.getString("option1", true),
      interaction.options.getString("option2", true),
      interaction.options.getString("option3"),
      interaction.options.getString("option4"),
    ].filter((value): value is string => Boolean(value && value.trim()));
    const minutes = interaction.options.getInteger("minutes") ?? 10;
    const poll = createPoll({
      question: interaction.options.getString("question", true).trim(),
      options,
      guildId: interaction.guild.id,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      closesAt: Date.now() + minutes * 60_000,
    });
    await interaction.reply({ embeds: [pollEmbed(poll)], components: pollComponents(poll.id, poll.options) });
  },
};
