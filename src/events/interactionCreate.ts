import { Events, type Interaction } from "discord.js";
import { commands } from "../commands";

export const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.find((entry) => entry.data.name === interaction.commandName);
    if (!command) {
      await interaction.reply({ content: "That command is no longer available.", ephemeral: true });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Command /${interaction.commandName} failed:`, error);
      const content = "Something went wrong while running that command. Please try again.";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true }).catch(() => undefined);
      } else {
        await interaction.reply({ content, ephemeral: true }).catch(() => undefined);
      }
    }
  },
};
