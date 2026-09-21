import type { GameState, MoveRecord, SeatState, WinnerInfo } from "./types";

/** Moves-per-seat with no attack before the game is called a tie. */
export const TIE_MOVES_PER_SEAT = 15;

/**
 * Counts consecutive non-combat moves at the end of the log. Scanning backward from the
 * most recent move (rather than tracking a separate persisted counter) means this stays
 * correct even though the move log clients are shown is capped to a recent window - the
 * scan here always runs against the full history the server has.
 */
export function countMovesSinceLastAttack(moveLog: MoveRecord[]): number {
  let count = 0;
  for (let i = moveLog.length - 1; i >= 0; i--) {
    if (moveLog[i].result !== "move") break;
    count++;
  }
  return count;
}

/**
 * No attack for `TIE_MOVES_PER_SEAT` moves from EACH seat (a stalling deterrent, since
 * Luzhanqi has no other forced-progress rule) ends the game in a tie.
 */
export function checkTie(moveLog: MoveRecord[], mode: GameState["mode"]): WinnerInfo | null {
  const seatCount = mode === "2p" ? 2 : 4;
  if (countMovesSinceLastAttack(moveLog) >= TIE_MOVES_PER_SEAT * seatCount) {
    return { seats: [], reason: "tie" };
  }
  return null;
}

/**
 * Re-derives the win state purely from seats' flagCaptured flags, so the state-fetch
 * endpoint can report a winner without re-running move logic.
 */
export function checkWinner(seats: SeatState[], mode: GameState["mode"]): WinnerInfo | null {
  if (mode === "2p") {
    const loser = seats.find((s) => s.flagCaptured);
    if (!loser) return null;
    const winner = seats.find((s) => s.seatIndex !== loser.seatIndex)!;
    return { seats: [winner.seatIndex], reason: "flag_captured" };
  }

  // 4P: teams are (0,2) and (1,3) - team = seatIndex % 2.
  for (const team of [0, 1]) {
    const teamSeats = seats.filter((s) => s.seatIndex % 2 === team);
    if (teamSeats.length > 0 && teamSeats.every((s) => s.flagCaptured)) {
      const winningTeamSeats = seats.filter((s) => s.seatIndex % 2 !== team).map((s) => s.seatIndex);
      return { seats: winningTeamSeats, reason: "team_eliminated" };
    }
  }
  return null;
}
