import { describe, expect, it } from "vitest";
import { buildSeatView } from "../view";
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

describe("buildSeatView", () => {
  it("always shows the viewer's own pieces, hides an opponent's unrevealed pieces", () => {
    const state: GameState = {
      mode: "2p",
      status: "active",
      currentTurnSeat: 0,
      seats: [seat(0), seat(1)],
      pieces: [
        piece({ id: "own-flag", type: "FLAG", seatIndex: 0, nodeId: "P0-5-1" }),
        piece({ id: "own-captain", type: "CAPTAIN", seatIndex: 0, nodeId: "P0-2-0" }),
        piece({ id: "enemy-hidden", type: "ENGINEER", seatIndex: 1, nodeId: "P1-2-0" }),
        piece({ id: "enemy-revealed", type: "GENERAL", seatIndex: 1, nodeId: "P1-2-1", revealed: true }),
      ],
      moveLog: [],
      winner: null,
    };

    const view = buildSeatView(state, 0);
    const byId = Object.fromEntries(view.pieces.map((p) => [p.id, p]));

    expect(byId["own-flag"].type).toBe("FLAG");
    expect(byId["own-captain"].type).toBe("CAPTAIN");
    expect(byId["enemy-hidden"].type).toBeNull();
    expect(byId["enemy-revealed"].type).toBe("GENERAL");
    expect(view.viewerSeat).toBe(0);
  });

  it("reveals a seat's Flag once that seat's flagRevealed is set (Field Marshal captured)", () => {
    const state: GameState = {
      mode: "2p",
      status: "active",
      currentTurnSeat: 0,
      seats: [seat(0), seat(1, { flagRevealed: true })],
      pieces: [piece({ id: "enemy-flag", type: "FLAG", seatIndex: 1, nodeId: "P1-5-1" })],
      moveLog: [],
      winner: null,
    };

    const view = buildSeatView(state, 0);
    expect(view.pieces[0].type).toBe("FLAG");
  });

  it("reveals every piece once the game has finished", () => {
    const state: GameState = {
      mode: "2p",
      status: "finished",
      currentTurnSeat: 0,
      seats: [seat(0), seat(1)],
      pieces: [piece({ id: "enemy-hidden", type: "ENGINEER", seatIndex: 1, nodeId: "P1-2-0" })],
      moveLog: [],
      winner: { seats: [0], reason: "flag_captured" },
    };

    const view = buildSeatView(state, 0);
    expect(view.pieces[0].type).toBe("ENGINEER");
  });
});
