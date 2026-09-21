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

/**
 * English-only abbreviations shown on the board/tray itself; the full title (translated,
 * for either display language) is still always available on hover via each token's
 * <title> element. Chinese has no separate abbreviation - its piece names are already
 * two characters, so the full name is used directly in both places.
 */
export const PIECE_ABBREVIATIONS: Record<PieceType, string> = {
  FIELD_MARSHAL: "FM",
  GENERAL: "GEN",
  MAJOR_GENERAL: "MG",
  BRIGADIER_GENERAL: "BG",
  COLONEL: "COL",
  MAJOR: "MAJ",
  CAPTAIN: "CPT",
  LIEUTENANT: "LT",
  ENGINEER: "ENG",
  LANDMINE: "MINE",
  BOMB: "BOMB",
  FLAG: "FLAG",
};
