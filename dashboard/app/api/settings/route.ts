import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";
import type { BotSettings } from "@/lib/types";

export async function GET() {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await controlFetch<{ settings: BotSettings }>("/api/settings"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bot unavailable." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json(await controlFetch<{ settings: BotSettings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Save failed." }, { status: 502 });
  }
}
