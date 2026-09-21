import { PieceType, RANKED_OFFICERS } from "./types";

/** Higher number wins in combat. Only the 9 officer ranks participate in this ladder. */
const RANK_VALUE: Partial<Record<PieceType, number>> = {};
RANKED_OFFICERS.forEach((type, index) => {
  RANK_VALUE[type] = RANKED_OFFICERS.length - index; // Field Marshal = 9, ..., Engineer = 1
});

export function rankOf(type: PieceType): number | undefined {
  return RANK_VALUE[type];
}

export function isRankedOfficer(type: PieceType): boolean {
  return RANK_VALUE[type] !== undefined;
}
