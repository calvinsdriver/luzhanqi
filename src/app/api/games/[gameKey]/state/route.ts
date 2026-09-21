import { NextRequest, NextResponse } from "next/server";
import { authorizeSeat } from "@/lib/server/gameRepo";
import { buildSeatView } from "@/lib/rules/view";

export const runtime = "nodejs";

// The move log only needs to cover what the UI actually displays (the recent-moves panel).
// Shipping the entire history on every single poll would make the response grow without
// bound over a long game, so it's truncated here - the rules engine itself still sees the
// full history when applying a move (see gameRepo.ts), only the network payload is capped.
const MOVE_LOG_PAGE_SIZE = 50;

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
    state: { ...view, moveLog: view.moveLog.slice(-MOVE_LOG_PAGE_SIZE) },
  });
}
