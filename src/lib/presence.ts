import { ActivityType, type Client, type PresenceStatusData } from "discord.js";
import { getSettings, type ActivityKind } from "./settings";

const activityTypes: Record<ActivityKind, ActivityType> = {
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
};

export async function applyPresence(client: Client): Promise<void> {
  if (!client.user) return;

  const settings = getSettings();
  client.user.setStatus(settings.presenceStatus as PresenceStatusData);

  const text = settings.statusText.trim();
  if (!text) {
    client.user.setActivity(undefined);
    return;
  }

  const options: { type: ActivityType; url?: string } = {
    type: activityTypes[settings.statusType] ?? ActivityType.Watching,
  };
  if (settings.statusType === "streaming" && settings.statusUrl.trim()) {
    options.url = settings.statusUrl.trim();
  }

  client.user.setActivity(text, options);
}
