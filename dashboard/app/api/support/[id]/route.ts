import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { controlFetch } from "@/lib/control";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Props) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json(await controlFetch(`/api/support/${encodeURIComponent(id)}/read`, { method: "POST" }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed." }, { status: 502 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json(await controlFetch(`/api/support/${encodeURIComponent(id)}`, { method: "DELETE" }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed." }, { status: 502 });
  }
}
