import { Events, type Client } from "discord.js";
import { postStartupAnnouncement } from "../lib/auto-post";
import { applyPresence } from "../lib/presence";
import { joinConfiguredVoiceChannels } from "../lib/voice";

export const readyEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    console.log(`Logged in as ${client.user.tag}`);
    await applyPresence(client);
    console.log(`Serving ${client.guilds.cache.size} guild(s)`);

    const announcements = await postStartupAnnouncement(client).catch((error) => {
      console.error("Startup announcement failed:", error);
      return [];
    });
    const failedAnnouncements = announcements.filter((result) => !result.ok);
    if (failedAnnouncements.length) console.error("Startup announcement failures:", failedAnnouncements);

    const voice = await joinConfiguredVoiceChannels(client).catch((error) => {
      console.error("Voice auto-join failed:", error);
      return [];
    });
    const failedVoice = voice.filter((result) => !result.ok);
    if (failedVoice.length) console.error("Voice auto-join failures:", failedVoice);
  },
};
