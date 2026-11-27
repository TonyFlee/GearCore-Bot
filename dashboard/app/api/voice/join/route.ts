import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";

export async function POST(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json(await controlFetch("/api/voice/join", {
      method: "POST",
      body: JSON.stringify({ guildId: body.guildId, channelId: body.channelId }),
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Join failed." }, { status: 502 });
  }
}
