import { NextRequest, NextResponse } from "next/server";
import { confirmPlacement } from "@/lib/server/gameRepo";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const pieces = Array.isArray(body?.pieces) ? body.pieces : null;

  if (!token || !pieces) {
    return NextResponse.json({ error: "token and pieces are required" }, { status: 400 });
  }

  const result = await confirmPlacement(gameKey.toUpperCase(), token, pieces);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
