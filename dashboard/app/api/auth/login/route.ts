import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieName, sessionMaxAge } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!body.password || body.password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: sessionCookieName,
    value: await createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge,
  });
  return response;
}
