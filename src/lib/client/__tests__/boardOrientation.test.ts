import { describe, expect, it } from "vitest";
import { rotatePoint, viewerRotationDegrees } from "../boardOrientation";

describe("viewerRotationDegrees", () => {
  it("2P: seat 0 (physically north) needs a 180 degree flip, seat 1 (already south) needs none", () => {
    expect(viewerRotationDegrees("2p", 0)).toBe(180);
    expect(viewerRotationDegrees("2p", 1)).toBe(0);
  });

  it("4P: maps each seat's inherent position to the bottom", () => {
    expect(viewerRotationDegrees("4p", 0)).toBe(180); // north -> bottom
    expect(viewerRotationDegrees("4p", 1)).toBe(90); // east -> bottom
    expect(viewerRotationDegrees("4p", 2)).toBe(0); // south -> bottom (already there)
    expect(viewerRotationDegrees("4p", 3)).toBe(-90); // west -> bottom
  });
});

describe("rotatePoint", () => {
  it("north (0,-1) rotated 180 degrees lands at south (0,1)", () => {
    expect(rotatePoint(0, -1, 180)).toEqual({ x: 0, y: 1 });
  });

  it("east (1,0) rotated 90 degrees lands at south (0,1)", () => {
    expect(rotatePoint(1, 0, 90)).toEqual({ x: 0, y: 1 });
  });

  it("west (-1,0) rotated -90 degrees lands at south (0,1)", () => {
    expect(rotatePoint(-1, 0, -90)).toEqual({ x: 0, y: 1 });
  });

  it("0 degrees is the identity transform", () => {
    expect(rotatePoint(3, -5, 0)).toEqual({ x: 3, y: -5 });
  });

  it("a 2P-style asymmetric layout still flips near/far correctly under 180 degrees", () => {
    // territory0 spans y 0..5 ("near the top"), territory1 spans y 7..12 ("near the bottom"),
    // even though neither is centered on the rotation pivot at the origin.
    const territory0Point = rotatePoint(2, 5, 180); // y=5 -> -5
    const territory1Point = rotatePoint(2, 7, 180); // y=7 -> -7
    // After rotation, territory1's point must be the more negative (i.e. renders further
    // "up" than territory0 once the viewer's own bounding box is recomputed) - wait, we
    // want the OPPOSITE: territory0 (the viewer's own side in this scenario) should end up
    // with the larger relative y (closer to the bottom).
    expect(territory1Point.y).toBeLessThan(territory0Point.y);
  });
});
