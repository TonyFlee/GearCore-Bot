import { ChannelType, SlashCommandBuilder, type AutocompleteInteraction, type ChatInputCommandInteraction } from "discord.js";
import { deleteSound, listSounds, playSound, stopSound, uploadSound } from "../lib/audio";
import { requireManageGuild } from "../lib/permission";
import type { BotCommand } from ".";

export const soundCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("sound")
    .setDescription("Play or manage soundboard sounds.")
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Play a sound in the voice channel you are in.")
        .addStringOption((option) =>
          option.setName("name").setDescription("Sound to play").setAutocomplete(true).setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("stop").setDescription("Stop the sound currently playing."))
    .addSubcommand((sub) => sub.setName("list").setDescription("List available sounds."))
    .addSubcommand((sub) =>
      sub
        .setName("upload")
        .setDescription("Upload a sound file. Manage Server permission required.")
        .addAttachmentOption((option) =>
          option.setName("file").setDescription("An .opus, .ogg, .mp3, or .wav file").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("Sound name. Defaults to the filename.").setMaxLength(40).setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a sound. Manage Server permission required.")
        .addStringOption((option) => option.setName("name").setDescription("Sound to delete").setAutocomplete(true).setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "Use /sound in a server.", ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "upload") {
      if (!(await requireManageGuild(interaction))) return;
      await interaction.deferReply({ ephemeral: true });
      const result = await uploadSound(interaction.options.getAttachment("file", true), interaction.options.getString("name") ?? undefined);
      await interaction.editReply(result.ok ? `Sound \`${result.name}\` saved. Use /sound play name:${result.name}.` : result.error || "Sound upload failed.");
      return;
    }

    if (subcommand === "delete") {
      if (!(await requireManageGuild(interaction))) return;
      const name = interaction.options.getString("name", true).trim().toLowerCase();
      const removed = deleteSound(name);
      await interaction.reply({ content: removed ? `Deleted sound \`${name}\`.` : "Sound not found.", ephemeral: true });
      return;
    }

    if (subcommand === "list") {
      const sounds = listSounds();
      await interaction.reply({
        content: sounds.length ? `Available sounds: ${sounds.map((name) => `\`${name}\``).join(", ")}` : "No sound files are installed yet.",
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "stop") {
      const stopped = stopSound(interaction.guild.id);
      await interaction.reply({ content: stopped ? "Stopped the sound." : "No sound is playing right now.", ephemeral: true });
      return;
    }

    const name = interaction.options.getString("name", true).trim().toLowerCase();
    const channel = interaction.guild.members.cache.get(interaction.user.id)?.voice.channel;
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      await interaction.reply({ content: "Join a normal voice channel first, then use /sound play.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const result = await playSound(interaction.client, interaction.guild.id, channel.id, name);
    await interaction.editReply(result.ok ? `Playing \`${name}\` in ${channel.name}.` : result.error || "Could not play that sound.");
  },
  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = String(interaction.options.getFocused() ?? "").toLowerCase();
    const sounds = listSounds().filter((name) => name.includes(focused)).slice(0, 25);
    await interaction.respond(sounds.map((name) => ({ name, value: name })));
  },
};
