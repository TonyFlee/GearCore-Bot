import { timingSafeEqual } from "node:crypto";
import express, { type Request, type Response } from "express";
import type { Client } from "discord.js";
import { config } from "../config";
import { commands } from "../commands";
import { postAnnouncement } from "../lib/announce";
import { applyPresence } from "../lib/presence";
import { createScheduledAnnouncement, listScheduledAnnouncements, removeScheduledAnnouncement } from "../lib/schedule-store";
import { scheduleAnnouncement } from "../lib/scheduler";
import { getSettings, updateSettings } from "../lib/settings";
import { deleteTicketTranscript, getTicketTranscript, listTicketTranscripts } from "../lib/ticket-store";
import { joinVoiceTarget } from "../lib/voice";
import {
  deleteSupportRequest,
  listSupportRequests,
  markSupportRead,
} from "../lib/support-store";

const startedAt = new Date().toISOString();

function tokenMatches(value: string): boolean {
  const supplied = Buffer.from(value);
  const expected = Buffer.from(config.controlApiToken);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    handler(req, res).catch((error) => {
      console.error("Control API error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Control API failed." });
    });
  };
}

export function startControlServer(client: Client): void {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    if (!tokenMatches(String(req.header("x-control-token") ?? ""))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });

  app.get("/api/status", (_req, res) => {
    const online = client.isReady();
    res.json({
      online,
      uptimeMs: online ? client.uptime : null,
      pingMs: online && client.ws.ping >= 0 ? client.ws.ping : null,
      guilds: online ? client.guilds.cache.size : 0,
      startedAt,
      commands: commands.map((command) => ({ name: command.data.name, description: command.data.description })),
      openSupport: listSupportRequests().filter((request) => request.status === "open").length,
      autoChannels: getSettings().autoChannels.filter((entry) => entry.enabled).length,
      voiceChannels: getSettings().voiceChannels.filter((entry) => entry.enabled).length,
      settings: getSettings(),
    });
  });

  app.get("/api/settings", (_req, res) => {
    res.json({ settings: getSettings() });
  });

  app.put("/api/settings", asyncRoute(async (req, res) => {
    const settings = updateSettings(req.body ?? {});
    await applyPresence(client).catch((error) => {
      console.error("Presence update failed:", error);
    });
    res.json({ settings });
  }));

  app.get("/api/support", (_req, res) => {
    res.json({ requests: listSupportRequests() });
  });

  app.get("/api/transcripts", (_req, res) => {
    const items = listTicketTranscripts().map(({ messages, ...summary }) => ({
      ...summary,
      messageCount: messages.length,
    }));
    res.json({ items });
  });

  app.get("/api/transcripts/:id", (req, res) => {
    const transcript = getTicketTranscript(req.params.id);
    if (!transcript) {
      res.status(404).json({ error: "Transcript not found." });
      return;
    }
    res.json({ transcript });
  });

  app.post("/api/transcripts/:id/delete", (req, res) => {
    const removed = deleteTicketTranscript(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Transcript not found." });
      return;
    }
    res.json({ ok: true });
  });

  app.post("/api/support/:id/read", (req, res) => {
    const updated = markSupportRead(req.params.id);
    if (!updated) {
      res.status(404).json({ error: "Support request not found." });
      return;
    }
    res.json({ ok: true });
  });

  app.delete("/api/support/:id", (req, res) => {
    const removed = deleteSupportRequest(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Support request not found." });
      return;
    }
    res.json({ ok: true });
  });

  app.post("/api/announce", asyncRoute(async (req, res) => {
    const message = String(req.body?.message ?? "").trim();
    const channelId = String(req.body?.channelId ?? "").trim();
    const includeAuto = req.body?.includeAuto !== false;
    const mentionEveryone = req.body?.mentionEveryone === true || req.body?.mentionEveryone === "true" || req.body?.mentionEveryone === "on";

    try {
      const results = await postAnnouncement(client, message, "Dashboard", channelId || undefined, includeAuto, mentionEveryone);
      res.json({ ok: true, results });
    } catch (error) {
      const status = error instanceof Error && error.message.includes("disabled") ? 409 : 400;
      res.status(status).json({ error: error instanceof Error ? error.message : "Announcement failed." });
    }
  }));

  app.get("/api/scheduled", (_req, res) => {
    res.json({ items: listScheduledAnnouncements() });
  });

  app.post("/api/scheduled", asyncRoute(async (req, res) => {
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }
    const minutes = Math.min(Math.max(Number(req.body?.minutes ?? 60), 1), 10080);
    const item = createScheduledAnnouncement({
      message,
      channelId: String(req.body?.channelId ?? "").trim(),
      includeAuto: req.body?.includeAuto !== false,
      mentionEveryone: req.body?.mentionEveryone === true || req.body?.mentionEveryone === "true" || req.body?.mentionEveryone === "on",
      dueAt: Date.now() + minutes * 60_000,
      createdBy: "Dashboard",
    });
    scheduleAnnouncement(client, item);
    res.json({ ok: true, item });
  }));

  app.post("/api/scheduled/:id/delete", (req, res) => {
    const removed = removeScheduledAnnouncement(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Schedule not found." });
      return;
    }
    res.json({ ok: true });
  });

  app.post("/api/voice/join", asyncRoute(async (req, res) => {
    const guildId = String(req.body?.guildId ?? "").trim();
    const channelId = String(req.body?.channelId ?? "").trim();
    if (!channelId) {
      res.status(400).json({ error: "Channel ID is required." });
      return;
    }
    const result = await joinVoiceTarget(client, { guildId, channelId, enabled: true });
    res.json(result);
  }));

  app.listen(config.controlPort, config.controlHost, () => {
    console.log(`Control API listening on http://${config.controlHost}:${config.controlPort}`);
  });
}
