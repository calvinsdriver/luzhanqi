import { NextRequest, NextResponse } from "next/server";
import { authorizeSeat } from "@/lib/server/gameRepo";
import { buildSeatView } from "@/lib/rules/view";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 401 });
  }

  const authorized = await authorizeSeat(gameKey.toUpperCase(), token);
  if (!authorized.ok) {
    return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  }

  const { loaded, seatIndex } = authorized.value;
  const view = buildSeatView(loaded.state, seatIndex);
  return NextResponse.json({
    gameId: loaded.gameRow.id,
    gameKey: loaded.gameRow.short_key,
    mode: loaded.gameRow.mode,
    state: view,
  });
}
