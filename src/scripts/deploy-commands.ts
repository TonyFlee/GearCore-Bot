import { REST, Routes } from "discord.js";
import { config } from "../config";
import { commands } from "../commands";

async function main() {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.discordToken);
  const useGuild = process.argv.includes("--guild");

  if (useGuild) {
    if (!config.discordGuildId) throw new Error("Set DISCORD_GUILD_ID to use --guild.");
    console.log(`Registering ${body.length} command(s) in guild ${config.discordGuildId}...`);
    await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), { body });
    console.log("Guild commands registered.");
    return;
  }

  console.log(`Registering ${body.length} global/public command(s)...`);
  await rest.put(Routes.applicationCommands(config.discordClientId), { body });
  console.log("Global commands registered. They may take up to an hour to appear in every server.");
}

main().catch((error) => {
  console.error("Command registration failed:", error);
  process.exitCode = 1;
});
