import { NextRequest, NextResponse } from "next/server";
import { reconnect } from "@/lib/server/gameRepo";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const result = await reconnect(gameKey.toUpperCase(), token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.value);
}
