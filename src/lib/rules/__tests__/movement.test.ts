import { describe, expect, it } from "vitest";
import { BOARD_2P } from "../board2p";
import { BOARD_4P } from "../board4p";
import { legalMoves, type OccupancyPiece } from "../movement";

function piece(nodeId: string, seatIndex: number): OccupancyPiece {
  return { nodeId, seatIndex, status: "in_play" };
}

describe("legalMoves - road movement", () => {
  it("excludes own-occupied nodes, includes enemy-occupied nodes, excludes enemy-occupied camps", () => {
    const pieces: OccupancyPiece[] = [
      piece("P0-2-0", 0), // the mover itself
      piece("P0-3-0", 0), // own piece - blocks
      piece("P0-2-1", 1), // enemy piece on a plain post - capturable
      piece("P0-1-1", 1), // enemy piece on a camp - not attackable at all
    ];

    const destinations = legalMoves(BOARD_2P, pieces, "P0-2-0", "CAPTAIN", 0);

    expect(destinations).toContain("P0-1-0"); // empty orthogonal neighbor
    expect(destinations).toContain("P0-2-1"); // enemy on plain post - capturable
    expect(destinations).not.toContain("P0-3-0"); // own piece
    expect(destinations).not.toContain("P0-1-1"); // enemy on a camp - immune
  });

  it("gives camps extra diagonal road edges", () => {
    const pieces: OccupancyPiece[] = [piece("P0-2-2", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-2-2", "CAPTAIN", 0);
    // orthogonal
    expect(destinations).toContain("P0-1-2");
    expect(destinations).toContain("P0-3-2");
    expect(destinations).toContain("P0-2-1");
    expect(destinations).toContain("P0-2-3");
    // diagonal (camp-only bonus)
    expect(destinations).toContain("P0-1-1");
    expect(destinations).toContain("P0-1-3");
    expect(destinations).toContain("P0-3-1");
    expect(destinations).toContain("P0-3-3");
  });

  it("cannot move onto or through a mountain", () => {
    const pieces: OccupancyPiece[] = [piece("P0-0-1", 0)];
    // P0-0-1 connects to neutral node N-1, which is a mountain.
    const destinations = legalMoves(BOARD_2P, pieces, "P0-0-1", "CAPTAIN", 0);
    expect(destinations).not.toContain("N-1");
  });
});

describe("legalMoves - rail movement", () => {
  it("moves any distance along a straight rail until blocked, capturing the first enemy", () => {
    const pieces: OccupancyPiece[] = [
      piece("P0-5-0", 0), // mover, back-left corner, start of the vertical rail
      piece("P0-2-0", 1), // enemy several nodes up the rail
    ];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-5-0", "CAPTAIN", 0);

    expect(destinations).toContain("P0-4-0");
    expect(destinations).toContain("P0-3-0");
    expect(destinations).toContain("P0-2-0"); // capture - last reachable node
    expect(destinations).not.toContain("P0-1-0"); // beyond the blocking piece
  });

  it("stops one short of a blocking own piece", () => {
    const pieces: OccupancyPiece[] = [piece("P0-5-0", 0), piece("P0-2-0", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-5-0", "CAPTAIN", 0);

    expect(destinations).toContain("P0-3-0");
    expect(destinations).not.toContain("P0-2-0");
    expect(destinations).not.toContain("P0-1-0");
  });

  it("does not let a non-Engineer turn a rail corner", () => {
    const pieces: OccupancyPiece[] = [piece("P0-3-0", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-3-0", "CAPTAIN", 0);

    expect(destinations).toContain("P0-0-0"); // straight along the vertical rail - fine
    expect(destinations).not.toContain("P0-0-1"); // would require turning onto the horizontal rail
  });

  it("lets an Engineer turn a rail corner", () => {
    const pieces: OccupancyPiece[] = [piece("P0-3-0", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-3-0", "ENGINEER", 0);

    expect(destinations).toContain("P0-0-0");
    expect(destinations).toContain("P0-0-1"); // turned the corner onto the front-row rail
    expect(destinations).toContain("P0-0-4");
  });
});

describe("legalMoves - 2P neutral strip is pass-through only", () => {
  it("cannot road-step onto the neutral strip from the front row", () => {
    const pieces: OccupancyPiece[] = [piece("P0-0-0", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-0-0", "CAPTAIN", 0);
    expect(destinations).not.toContain("N-0");
  });

  it("cannot rail-stop on the neutral strip, but can pass through it onto the opponent's side", () => {
    const pieces: OccupancyPiece[] = [piece("P0-3-0", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-3-0", "CAPTAIN", 0);
    expect(destinations).not.toContain("N-0"); // can't stop mid-crossing
    expect(destinations).toContain("P1-0-0"); // but crossing all the way to the other side is fine
    expect(destinations).toContain("P1-2-0"); // and continuing further into it, same as any other rail move
  });

  it("an Engineer also cannot stop on the neutral strip while turning corners", () => {
    const pieces: OccupancyPiece[] = [piece("P0-3-0", 0)];
    const destinations = legalMoves(BOARD_2P, pieces, "P0-3-0", "ENGINEER", 0);
    expect(destinations).not.toContain("N-0");
    expect(destinations).toContain("P1-0-0");
  });
});

describe("legalMoves - 4P hub is not restricted", () => {
  it("allows stopping on a central hub node", () => {
    const pieces: OccupancyPiece[] = [piece("P0-3-0", 0)];
    const destinations = legalMoves(BOARD_4P, pieces, "P0-3-0", "CAPTAIN", 0);
    expect(destinations).toContain("H-0-0"); // the hub corner this territory's rail feeds into
  });

  it("a rail piece can cross straight through the hub's center to the opposite corner", () => {
    // From a hub corner, the diagonal through-center rail reaches the opposite corner -
    // e.g. all the way from the north territory's hub corner to the south territory's.
    const pieces: OccupancyPiece[] = [piece("H-0-0", 0)];
    const destinations = legalMoves(BOARD_4P, pieces, "H-0-0", "CAPTAIN", 0);
    expect(destinations).toContain("H-2-2");
  });

  it("a rail piece entering at a hub mid-edge cell can cross straight through to the opposite mid-edge", () => {
    const pieces: OccupancyPiece[] = [piece("H-1-0", 0)];
    const destinations = legalMoves(BOARD_4P, pieces, "H-1-0", "CAPTAIN", 0);
    expect(destinations).toContain("H-1-2"); // west mid-edge -> east mid-edge, straight through center
  });
});

describe("legalMoves - stationary pieces", () => {
  it("Flag never has legal moves", () => {
    expect(legalMoves(BOARD_2P, [piece("P0-5-1", 0)], "P0-5-1", "FLAG", 0)).toEqual([]);
  });

  it("Landmine never has legal moves", () => {
    expect(legalMoves(BOARD_2P, [piece("P0-4-0", 0)], "P0-4-0", "LANDMINE", 0)).toEqual([]);
  });
});
