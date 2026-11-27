const controlUrl = (process.env.BOT_CONTROL_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

export async function controlFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.BOT_CONTROL_TOKEN;
  if (!token) throw new Error("BOT_CONTROL_TOKEN is not configured.");

  const response = await fetch(`${controlUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-control-token": token,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const error = (body as { error?: string } | null)?.error;
    throw new Error(error || `Bot API returned ${response.status}.`);
  }

  return body as T;
}
