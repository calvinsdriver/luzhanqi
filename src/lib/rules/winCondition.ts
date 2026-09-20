import type { GameState, SeatState, WinnerInfo } from "./types";

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
