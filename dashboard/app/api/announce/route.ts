import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";

export async function POST(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json(await controlFetch("/api/announce", {
      method: "POST",
      body: JSON.stringify({ message: body.message, channelId: body.channelId || undefined, includeAuto: body.includeAuto !== false }),
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Announcement failed." }, { status: 502 });
  }
}
