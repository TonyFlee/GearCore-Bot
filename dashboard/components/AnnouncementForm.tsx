"use client";

import { useState } from "react";

export default function AnnouncementForm({ defaultChannelId }: { defaultChannelId: string }) {
  const [message, setMessage] = useState("");
  const [channelId, setChannelId] = useState(defaultChannelId);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/announce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, channelId }),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error || "Announcement failed.");
      setBusy(false);
      return;
    }

    setMessage("");
    setSuccess("Announcement posted to Discord.");
    setBusy(false);
  }

  return (
    <div className="card">
      <label htmlFor="announcement-message">Message</label>
      <textarea
        id="announcement-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Announcement text"
      />
      <label htmlFor="announcement-channel">Channel ID override</label>
      <input
        id="announcement-channel"
        value={channelId}
        onChange={(event) => setChannelId(event.target.value)}
        placeholder="Leave blank to use the saved channel"
      />
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
      <div className="actions">
        <button type="button" onClick={() => void send()} disabled={busy || !message.trim()}>
          {busy ? "Posting..." : "Post announcement"}
        </button>
      </div>
    </div>
  );
}
