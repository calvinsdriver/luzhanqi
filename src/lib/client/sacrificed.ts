import type { PublicPiece } from "@/lib/rules/types";

/**
 * True once a seat has no piece left capable of fighting or moving - the Flag itself
 * never does either, so this can be true even before that seat's Flag is actually
 * captured (2P has no other way to end the game short of that, so this can genuinely
 * happen through ordinary attrition).
 */
export function isSacrificed(pieces: PublicPiece[], seatIndex: number): boolean {
  return !pieces.some((p) => p.seatIndex === seatIndex && p.status === "in_play" && p.type !== "FLAG");
}
