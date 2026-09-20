import { describe, expect, it } from "vitest";
import { BOARD_2P } from "../board2p";
import { validatePlacement, type PlacementEntry } from "../placement";

const VALID_SEAT0_PLACEMENT: PlacementEntry[] = [
  { nodeId: "P0-3-2", pieceType: "FIELD_MARSHAL" },
  { nodeId: "P0-3-0", pieceType: "GENERAL" },
  { nodeId: "P0-3-1", pieceType: "MAJOR_GENERAL" },
  { nodeId: "P0-3-4", pieceType: "MAJOR_GENERAL" },
  { nodeId: "P0-3-3", pieceType: "BRIGADIER_GENERAL" },
  { nodeId: "P0-2-0", pieceType: "BRIGADIER_GENERAL" },
  { nodeId: "P0-2-1", pieceType: "COLONEL" },
  { nodeId: "P0-2-3", pieceType: "COLONEL" },
  { nodeId: "P0-2-2", pieceType: "MAJOR" },
  { nodeId: "P0-2-4", pieceType: "MAJOR" },
  { nodeId: "P0-1-0", pieceType: "CAPTAIN" },
  { nodeId: "P0-1-2", pieceType: "CAPTAIN" },
  { nodeId: "P0-1-4", pieceType: "CAPTAIN" },
  { nodeId: "P0-1-1", pieceType: "LIEUTENANT" },
  { nodeId: "P0-1-3", pieceType: "LIEUTENANT" },
  { nodeId: "P0-0-2", pieceType: "LIEUTENANT" },
  { nodeId: "P0-0-0", pieceType: "ENGINEER" },
  { nodeId: "P0-0-1", pieceType: "ENGINEER" },
  { nodeId: "P0-0-3", pieceType: "ENGINEER" },
  { nodeId: "P0-4-0", pieceType: "LANDMINE" },
  { nodeId: "P0-4-4", pieceType: "LANDMINE" },
  { nodeId: "P0-5-0", pieceType: "LANDMINE" },
  { nodeId: "P0-5-1", pieceType: "FLAG" },
  { nodeId: "P0-4-1", pieceType: "BOMB" },
  { nodeId: "P0-4-2", pieceType: "BOMB" },
];

describe("validatePlacement", () => {
  it("accepts a full, correctly-arranged 25-piece placement", () => {
    expect(validatePlacement(BOARD_2P, 0, VALID_SEAT0_PLACEMENT)).toEqual([]);
  });

  it("rejects a wrong roster count", () => {
    const bad = VALID_SEAT0_PLACEMENT.filter((p) => p.nodeId !== "P0-0-3"); // drop one Engineer
    const errors = validatePlacement(BOARD_2P, 0, bad);
    expect(errors.some((e) => e.includes("ENGINEER"))).toBe(true);
  });

  it("rejects the Flag off a headquarters node", () => {
    const bad = VALID_SEAT0_PLACEMENT.map((p) =>
      p.nodeId === "P0-5-1" ? { ...p, nodeId: "P0-4-3" } : p,
    );
    const errors = validatePlacement(BOARD_2P, 0, bad);
    expect(errors.some((e) => e.includes("headquarters"))).toBe(true);
  });

  it("rejects a Landmine outside the rear two rows", () => {
    const bad = VALID_SEAT0_PLACEMENT.map((p) =>
      p.nodeId === "P0-4-0" ? { ...p, nodeId: "P0-0-4" } : p,
    );
    const errors = validatePlacement(BOARD_2P, 0, bad);
    expect(errors.some((e) => e.includes("Landmine"))).toBe(true);
  });

  it("rejects a Bomb on the front row", () => {
    const bad = VALID_SEAT0_PLACEMENT.map((p) =>
      p.nodeId === "P0-4-1" ? { ...p, nodeId: "P0-0-4" } : p,
    );
    const errors = validatePlacement(BOARD_2P, 0, bad);
    expect(errors.some((e) => e.includes("Bomb"))).toBe(true);
  });

  it("rejects a node outside the seat's own territory", () => {
    const bad = VALID_SEAT0_PLACEMENT.map((p) =>
      p.nodeId === "P0-0-3" ? { ...p, nodeId: "P1-0-3" } : p,
    );
    const errors = validatePlacement(BOARD_2P, 0, bad);
    expect(errors.some((e) => e.includes("territory"))).toBe(true);
  });

  it("rejects reusing the same node for two pieces", () => {
    const bad = VALID_SEAT0_PLACEMENT.map((p) =>
      p.nodeId === "P0-0-3" ? { ...p, nodeId: "P0-0-1" } : p,
    );
    const errors = validatePlacement(BOARD_2P, 0, bad);
    expect(errors.some((e) => e.includes("used more than once"))).toBe(true);
  });
});
