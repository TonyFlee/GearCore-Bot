import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";
import type { BotStatus } from "@/lib/types";

export async function GET() {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await controlFetch<BotStatus>("/api/status"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bot unavailable." }, { status: 502 });
  }
}
