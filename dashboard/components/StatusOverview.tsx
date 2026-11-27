"use client";

import { useEffect, useState } from "react";
import type { BotStatus } from "@/lib/types";

type Props = { initialStatus: BotStatus | null; initialError: string };

function uptime(ms: number | null): string {
  if (ms == null) return "—";
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function StatusOverview({ initialStatus, initialError }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) {
        setError("Bot control API is unavailable.");
        return;
      }
      const body = await response.json() as BotStatus;
      setStatus(body);
      setError("");
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {error ? <div className="card error">{error}</div> : null}
      {status ? (
        <>
          <div className="grid">
            <div className="stat">
              <span>Bot</span>
              <strong className="status-line">
                <i className={`dot ${status.online ? "online" : ""}`} />
                {status.online ? "Online" : "Offline"}
              </strong>
            </div>
            <div className="stat"><span>Servers</span><strong>{status.guilds}</strong></div>
            <div className="stat"><span>Latency</span><strong>{status.pingMs ?? "—"} ms</strong></div>
            <div className="stat"><span>Uptime</span><strong>{uptime(status.uptimeMs)}</strong></div>
            <div className="stat"><span>Open support</span><strong>{status.openSupport}</strong></div>
          </div>

          <div className="card">
            <h2>Slash commands</h2>
            <div className="list">
              {status.commands.map((command) => (
                <div key={command.name} className="request">
                  <code>/{command.name}</code>
                  <div className="muted">{command.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Active configuration</h2>
            <div className="grid">
              <div className="stat"><span>Support channel</span><strong>{status.settings.supportChannelId || "—"}</strong></div>
              <div className="stat"><span>Announce channel</span><strong>{status.settings.announceChannelId || "—"}</strong></div>
              <div className="stat"><span>Welcome role</span><strong>{status.settings.welcomeRoleId || "—"}</strong></div>
              <div className="stat"><span>Promo code</span><strong>{status.settings.promoCode || "—"}</strong></div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
