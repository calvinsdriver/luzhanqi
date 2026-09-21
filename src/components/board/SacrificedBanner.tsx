import type { PublicGameState } from "@/lib/rules/types";

/**
 * The Flag itself never fights and never moves, so a seat with zero other pieces left is
 * functionally helpless even if their Flag hasn't fallen yet (2P has no other way to end
 * the game short of that, so this can genuinely happen through ordinary attrition).
 */
export function SacrificedBanner({ state, seatIndex }: { state: PublicGameState; seatIndex: number }) {
  const hasAnyFightingPiece = state.pieces.some(
    (p) => p.seatIndex === seatIndex && p.status === "in_play" && p.type !== "FLAG",
  );
  if (hasAnyFightingPiece) return null;

  return (
    <div role="alert" className="rounded border border-danger bg-danger/10 p-3 text-center">
      <p className="font-heading text-sm tracking-wide text-danger">Sacrificed</p>
      <p className="text-xs text-text-muted">All of your pieces have fallen.</p>
    </div>
  );
}
