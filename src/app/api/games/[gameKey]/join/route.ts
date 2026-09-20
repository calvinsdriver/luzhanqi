import { NextRequest, NextResponse } from "next/server";
import { joinGame } from "@/lib/server/gameRepo";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const body = await request.json().catch(() => null);
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";

  if (!nickname || nickname.length > 24) {
    return NextResponse.json({ error: "nickname is required (max 24 characters)" }, { status: 400 });
  }

  const result = await joinGame(gameKey.toUpperCase(), nickname);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.value, { status: 201 });
}
