import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config";
import { events } from "./events";
import { startControlServer } from "./server/control";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

for (const event of events) {
  (client as unknown as { on: (name: string, listener: (...args: any[]) => void) => void }).on(event.name, event.execute);
}

startControlServer(client);

client.login(config.discordToken).catch((error) => {
  console.error("Discord login failed:", error);
  process.exit(1);
});
