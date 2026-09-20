import type { GameState, Piece, PublicGameState, PublicPiece } from "./types";

/**
 * Builds the masked view of `fullState` for one seat. This is the single place that decides
 * whether a piece's type may be shown - get this wrong and a hidden piece's identity leaks.
 *
 * A piece's type is visible to `requestingSeat` when:
 *   - it belongs to that seat (you always see your own pieces), or
 *   - it has been `revealed` (took part in a prior combat), or
 *   - the game has ended, or
 *   - it is that owner's Flag and that owner's Field Marshal has been captured
 *     (the house rule confirmed for this game: losing your Field Marshal reveals your Flag).
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
