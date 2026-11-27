"use client";

import { useState } from "react";
import type { BotSettings } from "@/lib/types";

const textFields: Array<[keyof BotSettings, string]> = [
  ["supportChannelId", "Support channel ID"],
  ["announceChannelId", "Announcement channel ID"],
  ["welcomeChannelId", "Welcome channel ID"],
  ["welcomeRoleId", "Welcome role ID"],
  ["supportEmail", "Support email"],
  ["telegramUsername", "Telegram username"],
  ["promoCode", "Promo code"],
  ["preorderDays", "Preorder arrival window"],
];

const toggleFields: Array<[keyof BotSettings, string]> = [
  ["supportEnabled", "Support requests enabled"],
  ["announcementsEnabled", "Announcements enabled"],
  ["welcomeEnabled", "Welcome messages and roles enabled"],
  ["productCommandsEnabled", "Product and bundle commands enabled"],
];

export default function SettingsForm({ initialSettings }: { initialSettings: BotSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function update(key: keyof BotSettings, value: string | boolean) {
    setSettings((current) => ({ ...current, [key]: value }) as BotSettings);
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error || "Could not save settings.");
      setBusy(false);
      return;
    }

    setSettings(body.settings as BotSettings);
    setMessage("Settings saved and applied to the bot.");
    setBusy(false);
  }

  return (
    <>
      <div className="card">
        <h2>Channels and contacts</h2>
        {textFields.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              value={String(settings[key] ?? "")}
              onChange={(event) => update(key, event.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Features</h2>
        {toggleFields.map(([key, label]) => (
          <label className="toggle" key={key} htmlFor={key}>
            <input
              id={key}
              type="checkbox"
              checked={Boolean(settings[key])}
              onChange={(event) => update(key, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      <div className="actions">
        <button type="button" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving..." : "Save settings"}
        </button>
      </div>
    </>
  );
}
