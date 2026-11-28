import type { Client } from "discord.js";
import { giveawayResultsEmbed, pollResultsEmbed } from "./embeds";
import {
  allGiveaways,
  allPolls,
  allReminders,
  endGiveaway,
  getGiveaway,
  getPoll,
  removePoll,
  removeReminder,
} from "./engagement-store";
import { resumeScheduledAnnouncements } from "./scheduler";

async function sendToChannel(client: Client, channelId: string, payload: unknown): Promise<void> {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !("send" in channel) || typeof channel.send !== "function") return;
  await (channel.send as (value: unknown) => Promise<unknown>)(payload).catch(() => undefined);
}

function scheduleReminder(client: Client, reminder: { id: string; userId: string; message: string; dueAt: number }): void {
  const delay = Math.max(0, reminder.dueAt - Date.now());
  setTimeout(async () => {
    const user = await client.users.fetch(reminder.userId).catch(() => null);
    if (user) {
      await user.send(`**GearCore reminder**\n${reminder.message}`).catch(() => undefined);
    }
    removeReminder(reminder.id);
  }, delay);
}

function schedulePoll(client: Client, pollId: string, closesAt: number): void {
  setTimeout(async () => {
    const poll = getPoll(pollId);
    if (!poll) return;
    await sendToChannel(client, poll.channelId, { embeds: [pollResultsEmbed(poll)] });
    removePoll(pollId);
  }, Math.max(0, closesAt - Date.now()));
}

function scheduleGiveaway(client: Client, giveawayId: string, endsAt: number): void {
  setTimeout(async () => {
    const giveaway = getGiveaway(giveawayId);
    if (!giveaway || giveaway.ended) return;
    const entrants = [...giveaway.entrants].sort(() => Math.random() - 0.5);
    const winners = entrants.slice(0, Math.min(giveaway.winnerCount, entrants.length));
    endGiveaway(giveawayId);
    await sendToChannel(client, giveaway.channelId, {
      embeds: [giveawayResultsEmbed({ ...giveaway, ended: true }, winners)],
      allowedMentions: { parse: ["users"] },
    });
  }, Math.max(0, endsAt - Date.now()));
}

export function resumeAutomation(client: Client): void {
  for (const reminder of allReminders()) scheduleReminder(client, reminder);
  for (const poll of allPolls()) schedulePoll(client, poll.id, poll.closesAt);
  for (const giveaway of allGiveaways()) {
    if (!giveaway.ended) scheduleGiveaway(client, giveaway.id, giveaway.endsAt);
  }
  resumeScheduledAnnouncements(client);
  console.log(`Automation resumed: ${allReminders().length} reminder(s), ${allPolls().length} poll(s), ${allGiveaways().length} giveaway(s).`);
}
