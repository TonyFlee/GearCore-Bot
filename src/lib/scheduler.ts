import type { Client } from "discord.js";
import { postAnnouncement } from "./announce";
import { listScheduledAnnouncements, removeScheduledAnnouncement, type ScheduledAnnouncement } from "./schedule-store";

export function scheduleAnnouncement(client: Client, item: ScheduledAnnouncement): void {
  const delay = Math.max(0, item.dueAt - Date.now());
  setTimeout(async () => {
    try {
      const results = await postAnnouncement(
        client,
        item.message,
        item.createdBy || "Scheduled",
        item.channelId || undefined,
        item.includeAuto,
        item.mentionEveryone
      );
      const failed = results.filter((result) => !result.ok).length;
      console.log(`Scheduled announcement ${item.id} sent: ${results.length - failed} success, ${failed} failed.`);
    } catch (error) {
      console.error(`Scheduled announcement ${item.id} failed:`, error);
    }
    removeScheduledAnnouncement(item.id);
  }, delay);
}

export function resumeScheduledAnnouncements(client: Client): void {
  const items = listScheduledAnnouncements();
  for (const item of items) scheduleAnnouncement(client, item);
  console.log(`Scheduled announcements resumed: ${items.length}.`);
}
