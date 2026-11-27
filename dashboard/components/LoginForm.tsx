"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(body.error || "Login failed.");
      setBusy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <label htmlFor="password">Dashboard password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </div>
    </form>
  );
}
