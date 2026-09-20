import type { GameState, Piece, PublicGameState, PublicPiece } from "./types";

/**
 * Builds the masked view of `fullState` for one seat. This is the single place that decides
 * whether a piece's type may be shown - get this wrong and a hidden piece's identity leaks.
 *
 * A piece's type is visible to `requestingSeat` when:
 *   - it belongs to that seat (you always see your own pieces), or
 *   - it has been explicitly `revealed` (nothing currently sets this - by this game's house
 *     rule, combat does NOT reveal either piece's identity, unlike the classic base rules -
 *     but the flag stays here as a hook for any future disclosure mechanic), or
 *   - the game has ended, or
 *   - it is that owner's Flag and that owner's Field Marshal has been captured (the one
 *     disclosure this house rule does have: losing your Field Marshal reveals your Flag,
 *     and only your Flag - no other piece).
 */
export function buildSeatView(fullState: GameState, requestingSeat: number): PublicGameState {
  const gameOver = fullState.status === "finished";

  const pieces: PublicPiece[] = fullState.pieces.map((piece: Piece) => {
    const isOwn = piece.seatIndex === requestingSeat;
    const flagRevealedByFmRule =
      piece.type === "FLAG" &&
      (fullState.seats.find((s) => s.seatIndex === piece.seatIndex)?.flagRevealed ?? false);

    const visible = isOwn || piece.revealed || gameOver || flagRevealedByFmRule;

    return {
      ...piece,
      type: visible ? piece.type : null,
    };
  });

  return {
    mode: fullState.mode,
    status: fullState.status,
    currentTurnSeat: fullState.currentTurnSeat,
    seats: fullState.seats,
    moveLog: fullState.moveLog,
    winner: fullState.winner,
    pieces,
    viewerSeat: requestingSeat,
  };
}
