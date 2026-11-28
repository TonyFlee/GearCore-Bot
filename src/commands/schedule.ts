import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { requireManageGuild } from "../lib/permission";
import { createScheduledAnnouncement, listScheduledAnnouncements, removeScheduledAnnouncement } from "../lib/schedule-store";
import { scheduleAnnouncement } from "../lib/scheduler";
import type { BotCommand } from ".";

export const scheduleCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Schedule GearCore announcements.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Schedule a new announcement.")
        .addStringOption((option) => option.setName("message").setDescription("Announcement text").setMaxLength(1800).setRequired(true))
        .addIntegerOption((option) =>
          option.setName("minutes").setDescription("Minutes from now (1-10080, default 60)").setMinValue(1).setMaxValue(10080).setRequired(false)
        )
        .addChannelOption((option) => option.setName("channel").setDescription("Override the destination channel").setRequired(false))
        .addBooleanOption((option) => option.setName("mention_everyone").setDescription("Mention @everyone outside the embed").setRequired(false))
        .addBooleanOption((option) => option.setName("include_auto").setDescription("Also post to enabled auto channels (default true)").setRequired(false))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List scheduled announcements."))
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a scheduled announcement.")
        .addStringOption((option) => option.setName("id").setDescription("Schedule ID from /schedule list").setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await requireManageGuild(interaction))) return;

    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "list") {
      const items = listScheduledAnnouncements();
      const lines = items.slice(0, 10).map((item) =>
        `\`${item.id}\` · <t:${Math.floor(item.dueAt / 1000)}:R> · ${item.message.slice(0, 80)}${item.mentionEveryone ? " · @everyone" : ""}`
      );
      await interaction.reply({
        content: lines.length ? lines.join("\n") : "No scheduled announcements.",
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "delete") {
      const id = interaction.options.getString("id", true).trim();
      const removed = removeScheduledAnnouncement(id);
      await interaction.reply({ content: removed ? `Deleted schedule \`${id}\`.` : "Schedule not found.", ephemeral: true });
      return;
    }

    const minutes = interaction.options.getInteger("minutes") ?? 60;
    const item = createScheduledAnnouncement({
      message: interaction.options.getString("message", true).trim(),
      channelId: interaction.options.getChannel("channel")?.id ?? "",
      includeAuto: interaction.options.getBoolean("include_auto") ?? true,
      mentionEveryone: interaction.options.getBoolean("mention_everyone") ?? false,
      dueAt: Date.now() + minutes * 60_000,
      createdBy: interaction.user.tag,
    });
    scheduleAnnouncement(interaction.client, item);
    await interaction.reply({
      content: `Scheduled \`${item.id}\` for <t:${Math.floor(item.dueAt / 1000)}:R>.`,
      ephemeral: true,
    });
  },
};
