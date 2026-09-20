import { NextRequest, NextResponse } from "next/server";
import { createGame } from "@/lib/server/gameRepo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const mode = body?.mode;
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";

  if (mode !== "2p" && mode !== "4p") {
    return NextResponse.json({ error: "mode must be '2p' or '4p'" }, { status: 400 });
  }
  if (!nickname || nickname.length > 24) {
    return NextResponse.json({ error: "nickname is required (max 24 characters)" }, { status: 400 });
  }

  const result = await createGame(mode, nickname);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.value, { status: 201 });
}
