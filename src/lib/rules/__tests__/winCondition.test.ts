import { describe, expect, it } from "vitest";
import { checkTie, checkWinner, countMovesSinceLastAttack, TIE_MOVES_PER_SEAT } from "../winCondition";
import type { MoveRecord, SeatState } from "../types";

function seat(seatIndex: number, overrides: Partial<SeatState> = {}): SeatState {
  return {
    seatIndex,
    nickname: `Seat ${seatIndex}`,
    team: seatIndex % 2,
    connected: true,
    placementConfirmed: true,
    flagCaptured: false,
    flagRevealed: false,
    ...overrides,
  };
}

function move(seq: number, result: MoveRecord["result"] = "move"): MoveRecord {
  return { seq, seatIndex: seq % 2, from: "a", to: "b", result, revealedTypes: [] };
}

describe("checkWinner", () => {
  it("2P: the seat whose Flag was NOT captured wins", () => {
    const winner = checkWinner([seat(0, { flagCaptured: true }), seat(1)], "2p");
    expect(winner).toEqual({ seats: [1], reason: "flag_captured" });
  });

  it("4P: capturing only one of a team's two Flags does not end the game", () => {
    const winner = checkWinner([seat(0), seat(1), seat(2, { flagCaptured: true }), seat(3)], "4p");
    expect(winner).toBeNull();
  });

  it("4P: both of a team's Flags captured hands the win to the other team", () => {
    const winner = checkWinner(
      [seat(0, { flagCaptured: true }), seat(1), seat(2, { flagCaptured: true }), seat(3)],
      "4p",
    );
    expect(winner).toEqual({ seats: [1, 3], reason: "team_eliminated" });
  });
});

describe("countMovesSinceLastAttack", () => {
  it("counts consecutive trailing non-combat moves", () => {
    const log = [move(1, "attacker_wins"), move(2), move(3), move(4)];
    expect(countMovesSinceLastAttack(log)).toBe(3);
  });

  it("resets to 0 right after a combat move", () => {
    const log = [move(1), move(2), move(3, "mutual_destruction")];
    expect(countMovesSinceLastAttack(log)).toBe(0);
  });

  it("is 0 for an empty log", () => {
    expect(countMovesSinceLastAttack([])).toBe(0);
  });
});

describe("checkTie", () => {
  it("does not trigger before the threshold", () => {
    const log = Array.from({ length: TIE_MOVES_PER_SEAT * 2 - 1 }, (_, i) => move(i + 1));
    expect(checkTie(log, "2p")).toBeNull();
  });

  it("triggers at 15 moves per seat (30 total in 2P) with no attack", () => {
    const log = Array.from({ length: TIE_MOVES_PER_SEAT * 2 }, (_, i) => move(i + 1));
    expect(checkTie(log, "2p")).toEqual({ seats: [], reason: "tie" });
  });

  it("uses a higher threshold for 4P (15 moves per seat, 4 seats)", () => {
    const almostThere = Array.from({ length: TIE_MOVES_PER_SEAT * 4 - 1 }, (_, i) => move(i + 1));
    expect(checkTie(almostThere, "4p")).toBeNull();
    const atThreshold = Array.from({ length: TIE_MOVES_PER_SEAT * 4 }, (_, i) => move(i + 1));
    expect(checkTie(atThreshold, "4p")).toEqual({ seats: [], reason: "tie" });
  });
});
