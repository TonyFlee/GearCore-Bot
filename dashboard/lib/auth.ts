import { cookies } from "next/headers";

export const sessionCookieName = "gearcore_bot_session";
export const sessionMaxAge = 60 * 60 * 12;

function sessionSecret(): string {
  const value = process.env.DASHBOARD_SESSION_SECRET;
  if (!value) throw new Error("DASHBOARD_SESSION_SECRET is not configured.");
  return value;
}

function toBase64Url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(): Promise<string> {
  const payload = toBase64Url(JSON.stringify({ exp: Date.now() + sessionMaxAge * 1000 }));
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await sign(payload);
  if (signature.length !== expected.length || signature !== expected) return false;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(sessionCookieName)?.value);
}
