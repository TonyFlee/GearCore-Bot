import { PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";

export async function requireManageGuild(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (interaction.guild && interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }
  await interaction.reply({
    content: "You need the **Manage Server** permission to use this command.",
    ephemeral: true,
  });
  return false;
}
