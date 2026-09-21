import { describe, expect, it } from "vitest";
import { BOARD_2P } from "../board2p";
import { BOARD_4P } from "../board4p";
import { applyMove } from "../applyMove";
import type { GameState, Piece, SeatState } from "../types";

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

function piece(overrides: Partial<Piece> & Pick<Piece, "id" | "type" | "seatIndex" | "nodeId">): Piece {
  return { status: "in_play", revealed: false, immobilized: false, ...overrides };
}

function baseState2p(pieces: Piece[], overrides: Partial<GameState> = {}): GameState {
  return {
    mode: "2p",
    status: "active",
    currentTurnSeat: 0,
    seats: [seat(0), seat(1)],
    pieces,
    moveLog: [],
    winner: null,
    ...overrides,
  };
}

function baseState4p(pieces: Piece[], overrides: Partial<GameState> = {}): GameState {
  return {
    mode: "4p",
    status: "active",
    currentTurnSeat: 1,
    seats: [seat(0), seat(1), seat(2), seat(3)],
    pieces,
    moveLog: [],
    winner: null,
    ...overrides,
  };
}

describe("applyMove - basic turn handling", () => {
  it("moves a piece and alternates the turn in 2P", () => {
    const state = baseState2p([piece({ id: "a", type: "CAPTAIN", seatIndex: 0, nodeId: "P0-2-0" })]);
    const result = applyMove(BOARD_2P, state, 0, "P0-2-0", "P0-1-0");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextState.pieces[0].nodeId).toBe("P0-1-0");
    expect(result.nextState.currentTurnSeat).toBe(1);
  });

  it("rejects a move attempted out of turn", () => {
    const state = baseState2p([piece({ id: "a", type: "CAPTAIN", seatIndex: 1, nodeId: "P1-2-0" })]);
    const result = applyMove(BOARD_2P, state, 1, "P1-2-0", "P1-1-0");
    expect(result).toEqual({ ok: false, error: "It is not your turn" });
  });

  it("rejects an illegal destination", () => {
    const state = baseState2p([piece({ id: "a", type: "CAPTAIN", seatIndex: 0, nodeId: "P0-2-0" })]);
    const result = applyMove(BOARD_2P, state, 0, "P0-2-0", "P0-4-4");
    expect(result).toEqual({ ok: false, error: "Illegal move" });
  });
});

describe("applyMove - headquarters immobilization", () => {
  it("immobilizes a piece that enters a headquarters node, including your own", () => {
    const state = baseState2p([
      piece({ id: "a", type: "CAPTAIN", seatIndex: 0, nodeId: "P0-4-1" }),
      piece({ id: "b", type: "CAPTAIN", seatIndex: 1, nodeId: "P1-4-1" }),
    ]);

    const first = applyMove(BOARD_2P, state, 0, "P0-4-1", "P0-5-1"); // seat 0's own empty HQ
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const movedPiece = first.nextState.pieces.find((p) => p.id === "a")!;
    expect(movedPiece.immobilized).toBe(true);
    expect(first.nextState.currentTurnSeat).toBe(1);

    const second = applyMove(BOARD_2P, first.nextState, 1, "P1-4-1", "P1-3-1");
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const third = applyMove(BOARD_2P, second.nextState, 0, "P0-5-1", "P0-5-0");
    expect(third).toEqual({ ok: false, error: "That piece is immobilized in a headquarters" });
  });
});

describe("applyMove - combat and the Field Marshal reveal rule", () => {
  it("does not reveal either piece's type just from clashing (house rule: no combat reveal)", () => {
    const state = baseState2p([
      piece({ id: "a", type: "GENERAL", seatIndex: 0, nodeId: "P0-2-0" }),
      piece({ id: "b", type: "CAPTAIN", seatIndex: 1, nodeId: "P0-2-1" }),
    ]);
    const result = applyMove(BOARD_2P, state, 0, "P0-2-0", "P0-2-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextState.pieces.find((p) => p.id === "a")!.revealed).toBe(false);
    expect(result.nextState.pieces.find((p) => p.id === "b")!.revealed).toBe(false);
    expect(result.move.result).toBe("attacker_wins");
  });

  it("reveals the Flag's location once a seat's Field Marshal is captured", () => {
    const state = baseState2p([
      piece({ id: "fm", type: "FIELD_MARSHAL", seatIndex: 0, nodeId: "P0-2-0" }),
      piece({ id: "mine", type: "LANDMINE", seatIndex: 1, nodeId: "P0-2-1" }),
    ]);
    const result = applyMove(BOARD_2P, state, 0, "P0-2-0", "P0-2-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const fm = result.nextState.pieces.find((p) => p.id === "fm")!;
    expect(fm.status).toBe("captured");
    expect(result.nextState.seats.find((s) => s.seatIndex === 0)!.flagRevealed).toBe(true);
  });

  it("ends the game immediately when the Flag is captured in 2P", () => {
    const state = baseState2p([
      piece({ id: "a", type: "ENGINEER", seatIndex: 0, nodeId: "P1-4-1" }),
      piece({ id: "flag", type: "FLAG", seatIndex: 1, nodeId: "P1-5-1" }),
    ]);
    const result = applyMove(BOARD_2P, state, 0, "P1-4-1", "P1-5-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextState.status).toBe("finished");
    expect(result.nextState.winner).toEqual({ seats: [0], reason: "flag_captured" });
  });
});

describe("applyMove - 4P alliances", () => {
  it("cascades piece removal on flag capture but keeps the game active while the ally survives", () => {
    const state = baseState4p([
      piece({ id: "attacker", type: "CAPTAIN", seatIndex: 1, nodeId: "P2-4-1" }),
      piece({ id: "seat2-flag", type: "FLAG", seatIndex: 2, nodeId: "P2-5-1" }),
      piece({ id: "seat2-eng", type: "ENGINEER", seatIndex: 2, nodeId: "P2-0-0" }),
    ]);

    const result = applyMove(BOARD_4P, state, 1, "P2-4-1", "P2-5-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nextState.seats.find((s) => s.seatIndex === 2)!.flagCaptured).toBe(true);
    const removedEngineer = result.nextState.pieces.find((p) => p.id === "seat2-eng")!;
    expect(removedEngineer.status).toBe("captured");
    expect(removedEngineer.nodeId).toBeNull();

    expect(result.nextState.status).toBe("active"); // seat 0 (ally) still has its Flag
    expect(result.nextState.currentTurnSeat).toBe(3); // skips eliminated seat 2
  });

  it("ends the game once both seats of a team have lost their Flag", () => {
    const state = baseState4p(
      [
        piece({ id: "attacker", type: "CAPTAIN", seatIndex: 1, nodeId: "P2-4-1" }),
        piece({ id: "seat2-flag", type: "FLAG", seatIndex: 2, nodeId: "P2-5-1" }),
      ],
      { seats: [seat(0, { flagCaptured: true }), seat(1), seat(2), seat(3)] },
    );

    const result = applyMove(BOARD_4P, state, 1, "P2-4-1", "P2-5-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nextState.status).toBe("finished");
    expect(result.nextState.winner).toEqual({ seats: [1, 3], reason: "team_eliminated" });
  });
});

describe("applyMove - tie by inactivity", () => {
  it("ends the game in a tie after 15 moves per seat with no attack, not one move sooner", () => {
    let state = baseState2p([
      piece({ id: "a", type: "CAPTAIN", seatIndex: 0, nodeId: "P0-2-0" }),
      piece({ id: "b", type: "CAPTAIN", seatIndex: 1, nodeId: "P1-2-0" }),
    ]);

    // Shuffle each piece back and forth between two empty squares - never a combat move.
    for (let round = 0; round < 15; round++) {
      const seat0From = round % 2 === 0 ? "P0-2-0" : "P0-1-0";
      const seat0To = round % 2 === 0 ? "P0-1-0" : "P0-2-0";
      const seat1From = round % 2 === 0 ? "P1-2-0" : "P1-1-0";
      const seat1To = round % 2 === 0 ? "P1-1-0" : "P1-2-0";

      const move0 = applyMove(BOARD_2P, state, 0, seat0From, seat0To);
      expect(move0.ok).toBe(true);
      if (!move0.ok) return;
      state = move0.nextState;

      const isLastHalfMove = round === 14;
      const move1 = applyMove(BOARD_2P, state, 1, seat1From, seat1To);
      expect(move1.ok).toBe(true);
      if (!move1.ok) return;
      state = move1.nextState;

      if (isLastHalfMove) {
        expect(state.status).toBe("finished");
        expect(state.winner).toEqual({ seats: [], reason: "tie" });
      } else {
        expect(state.status).toBe("active");
        expect(state.winner).toBeNull();
      }
    }
  });
});
