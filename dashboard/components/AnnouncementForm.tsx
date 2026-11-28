"use client";

import { useState } from "react";

export default function AnnouncementForm({ defaultChannelId }: { defaultChannelId: string }) {
  const [message, setMessage] = useState("");
  const [channelId, setChannelId] = useState("");
  const [includeAuto, setIncludeAuto] = useState(true);
  const [mentionEveryone, setMentionEveryone] = useState(false);
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
      body: JSON.stringify({
        message,
        channelId: channelId.trim() || undefined,
        includeAuto,
        mentionEveryone,
      }),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error || "Announcement failed.");
      setBusy(false);
      return;
    }

    const results = Array.isArray(body.results) ? body.results as Array<{ ok: boolean }> : [];
    const failed = results.filter((result) => !result.ok).length;
    setMessage("");
    setSuccess(failed ? `Posted with ${failed} failed channel(s).` : `Announcement posted to ${results.length} channel(s).`);
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
        placeholder={defaultChannelId ? `Leave blank to use saved channel ${defaultChannelId}` : "Leave blank to use the saved channel"}
      />
      <label className="toggle" htmlFor="announcement-auto">
        <input
          id="announcement-auto"
          type="checkbox"
          checked={includeAuto}
          onChange={(event) => setIncludeAuto(event.target.checked)}
        />
        Also post to enabled auto-post channels
      </label>
      <label className="toggle" htmlFor="announcement-mention">
        <input
          id="announcement-mention"
          type="checkbox"
          checked={mentionEveryone}
          onChange={(event) => setMentionEveryone(event.target.checked)}
        />
        Mention everyone (@everyone) outside the embed
      </label>
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
