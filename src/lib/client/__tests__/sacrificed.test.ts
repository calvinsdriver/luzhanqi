import { describe, expect, it } from "vitest";
import { isSacrificed } from "../sacrificed";
import type { PublicPiece } from "@/lib/rules/types";

function piece(overrides: Partial<PublicPiece> & Pick<PublicPiece, "id" | "seatIndex">): PublicPiece {
  return { type: "CAPTAIN", nodeId: "P0-0-0", status: "in_play", revealed: false, immobilized: false, ...overrides };
}

describe("isSacrificed", () => {
  it("is false while the seat still has at least one fighting piece", () => {
    const pieces = [
      piece({ id: "a", seatIndex: 0, type: "CAPTAIN", status: "in_play" }),
      piece({ id: "flag", seatIndex: 0, type: "FLAG", status: "in_play" }),
    ];
    expect(isSacrificed(pieces, 0)).toBe(false);
  });

  it("is true once every non-Flag piece for that seat is captured, Flag still in play", () => {
    const pieces = [
      piece({ id: "a", seatIndex: 0, type: "CAPTAIN", status: "captured" }),
      piece({ id: "b", seatIndex: 0, type: "ENGINEER", status: "captured" }),
      piece({ id: "flag", seatIndex: 0, type: "FLAG", status: "in_play" }),
    ];
    expect(isSacrificed(pieces, 0)).toBe(true);
  });

  it("is true when the seat has no pieces recorded at all (e.g. before placement)", () => {
    expect(isSacrificed([], 0)).toBe(true);
  });

  it("only looks at the given seat - an opponent's surviving army doesn't count", () => {
    const pieces = [
      piece({ id: "mine", seatIndex: 0, type: "CAPTAIN", status: "captured" }),
      piece({ id: "theirs", seatIndex: 1, type: "CAPTAIN", status: "in_play" }),
    ];
    expect(isSacrificed(pieces, 0)).toBe(true);
    expect(isSacrificed(pieces, 1)).toBe(false);
  });

  it("a Landmine still in play counts as a remaining piece (it can still defend)", () => {
    const pieces = [
      piece({ id: "mine", seatIndex: 0, type: "LANDMINE", status: "in_play" }),
      piece({ id: "flag", seatIndex: 0, type: "FLAG", status: "in_play" }),
    ];
    expect(isSacrificed(pieces, 0)).toBe(false);
  });

  it("is true once the seat's Flag itself has been captured (4P cascade removes everything)", () => {
    const pieces = [
      piece({ id: "a", seatIndex: 0, type: "CAPTAIN", status: "captured" }),
      piece({ id: "flag", seatIndex: 0, type: "FLAG", status: "captured" }),
    ];
    expect(isSacrificed(pieces, 0)).toBe(true);
  });
});
