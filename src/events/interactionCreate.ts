import { Events, type Interaction } from "discord.js";
import { commands } from "../commands";
import { handleProductButton } from "../lib/components";

export const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (interaction.isAutocomplete()) {
      const command = commands.find((entry) => entry.data.name === interaction.commandName);
      if (!command?.autocomplete) {
        await interaction.respond([]).catch(() => undefined);
        return;
      }
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(`Autocomplete /${interaction.commandName} failed:`, error);
        await interaction.respond([]).catch(() => undefined);
      }
      return;
    }

    if (interaction.isButton()) {
      try {
        const handled = await handleProductButton(interaction);
        if (!handled) await interaction.reply({ content: "That button is no longer available.", ephemeral: true });
      } catch (error) {
        console.error("Button interaction failed:", error);
        await interaction.reply({ content: "Something went wrong with that button.", ephemeral: true }).catch(() => undefined);
      }
      return;
    }

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
