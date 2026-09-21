import { NextRequest, NextResponse } from "next/server";
import { makeMove } from "@/lib/server/gameRepo";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const from = typeof body?.from === "string" ? body.from : "";
  const to = typeof body?.to === "string" ? body.to : "";

  if (!token || !from || !to) {
    return NextResponse.json({ error: "token, from and to are required" }, { status: 400 });
  }

  const result = await makeMove(gameKey.toUpperCase(), token, from, to);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  // Includes the resulting masked state so the client can update immediately instead of
  // needing a second round trip (a follow-up GET /state) just to see its own move applied.
  return NextResponse.json({ move: result.value.move, state: result.value.state });
}
