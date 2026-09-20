/**
 * Board node coordinates are authored in a fixed, absolute layout (see board2p.ts/board4p.ts
 * and docs/board-authoring-notes.md) - seat 0 always sits at the "north" of that layout,
 * seat 1 at "east" (or "south" in 2P), and so on. Every viewer wants their OWN seat
 * rendered at the bottom of their screen, so BoardCanvas rotates the whole layout per
 * viewer using these two pure helpers before computing any pixel positions.
 *
 * Both 2P and 4P territories are laid out symmetrically around the same pivot point
 * (the board's neutral zone/hub), so a pure rotation around the origin - with no
 * translation - correctly swaps "near" and "far" regardless of where that pivot happens
 * to sit in the board's own coordinate space, because the renderer recomputes its
 * viewBox from the rotated points anyway.
 */

export function viewerRotationDegrees(mode: "2p" | "4p", viewerSeat: number): number {
  const seatCount = mode === "2p" ? 2 : 4;
  return 180 - (360 / seatCount) * viewerSeat;
}

export function rotatePoint(x: number, y: number, degrees: number): { x: number; y: number } {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // Snap away floating-point noise (our rotations are always exact multiples of 90 degrees,
  // so the "true" result is always an exact integer combination of the inputs).
  const round = (v: number) => Math.round(v * 1e6) / 1e6 + 0; // +0 normalizes away -0
  return {
    x: round(x * cos - y * sin),
    y: round(x * sin + y * cos),
  };
}
