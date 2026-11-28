import { REST, Routes } from "discord.js";
import { config } from "../config";
import { commands } from "../commands";

async function main() {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.discordToken);
  const clearGuild = process.argv.includes("--clear-guild");
  const clearGlobal = process.argv.includes("--clear-global");
  const useGuild = process.argv.includes("--guild");

  if (clearGlobal) {
    console.log("Clearing global commands...");
    await rest.put(Routes.applicationCommands(config.discordClientId), { body: [] });
    console.log("Global commands cleared.");
    return;
  }

  if (clearGuild) {
    if (!config.discordGuildIds.length) throw new Error("Set DISCORD_GUILD_ID or DISCORD_GUILD_IDS to clear guild commands.");
    console.log(`Clearing guild commands from ${config.discordGuildIds.length} server(s)...`);
    for (const guildId of config.discordGuildIds) {
      await rest.put(Routes.applicationGuildCommands(config.discordClientId, guildId), { body: [] });
    }
    console.log("Guild commands cleared. Refresh Discord to see the change.");
    return;
  }

  if (useGuild) {
    if (!config.discordGuildId) throw new Error("Set DISCORD_GUILD_ID to use --guild.");
    console.log(`Registering ${body.length} command(s) in guild ${config.discordGuildId}...`);
    await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), { body });
    console.log("Guild commands registered. Global commands are unchanged, so duplicates may appear.");
    return;
  }

  console.log(`Registering ${body.length} global/public command(s)...`);
  await rest.put(Routes.applicationCommands(config.discordClientId), { body });

  if (config.discordGuildIds.length) {
    console.log(`Clearing ${config.discordGuildIds.length} guild command set(s) to prevent duplicates...`);
    for (const guildId of config.discordGuildIds) {
      try {
        await rest.put(Routes.applicationGuildCommands(config.discordClientId, guildId), { body: [] });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn(`Could not clear guild commands for ${guildId}: ${message}. Skipping.`);
      }
    }
  }

  console.log("Global commands registered. They may take up to an hour to appear in every server.");
}

main().catch((error) => {
  console.error("Command registration failed:", error);
  process.exitCode = 1;
});
