import { ActivityType, Events, type Client } from "discord.js";

export const readyEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity("gearcore.store", { type: ActivityType.Watching });
    console.log(`Serving ${client.guilds.cache.size} guild(s)`);
  },
};
