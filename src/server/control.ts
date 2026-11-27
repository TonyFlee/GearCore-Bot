import { timingSafeEqual } from "node:crypto";
import express, { type Request, type Response } from "express";
import type { Client } from "discord.js";
import { config } from "../config";
import { commands } from "../commands";
import { announcementEmbed } from "../lib/embeds";
import { getSettings, updateSettings } from "../lib/settings";
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
      settings: getSettings(),
    });
  });

  app.get("/api/settings", (_req, res) => {
    res.json({ settings: getSettings() });
  });

  app.put("/api/settings", (req, res) => {
    res.json({ settings: updateSettings(req.body ?? {}) });
  });

  app.get("/api/support", (_req, res) => {
    res.json({ requests: listSupportRequests() });
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
    const settings = getSettings();
    const message = String(req.body?.message ?? "").trim();
    const channelId = String(req.body?.channelId ?? settings.announceChannelId).trim();

    if (!settings.announcementsEnabled) {
      res.status(409).json({ error: "Announcements are disabled in settings." });
      return;
    }
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }
    if (!channelId) {
      res.status(400).json({ error: "No announcement channel is configured." });
      return;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    const sendable = channel as { send?: unknown } | null;
    if (!sendable || typeof sendable.send !== "function") {
      res.status(400).json({ error: "I cannot post in that channel." });
      return;
    }

    await (sendable.send as (options: unknown) => Promise<unknown>)({
      embeds: [announcementEmbed(message, "Dashboard")],
      allowedMentions: { parse: [] },
    });
    res.json({ ok: true });
  }));

  app.listen(config.controlPort, "127.0.0.1", () => {
    console.log(`Control API listening on http://127.0.0.1:${config.controlPort}`);
  });
}
