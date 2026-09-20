import type { PieceType } from "./types";
import { rankOf } from "./pieceRanks";

export type CombatOutcome = "attacker_wins" | "defender_wins" | "mutual_destruction" | "flag_captured";

export interface CombatResult {
  outcome: CombatOutcome;
  attackerSurvives: boolean;
  defenderSurvives: boolean;
}

/**
 * Resolves combat between an attacking piece moving onto a defending piece's square.
 * Evaluated in strict precedence order: Flag capture, then Bomb (mutual destruction with
 * anything), then Landmine (Engineers defuse it safely, anyone else dies to it), then plain
 * rank comparison. Camp immunity is enforced by movement.ts, which never offers an
 * enemy-camp-occupied square as an attackable destination in the first place.
 */
export function resolveCombat(attackerType: PieceType, defenderType: PieceType): CombatResult {
  if (defenderType === "FLAG") {
    return { outcome: "flag_captured", attackerSurvives: true, defenderSurvives: false };
  }

  if (attackerType === "BOMB" || defenderType === "BOMB") {
    return { outcome: "mutual_destruction", attackerSurvives: false, defenderSurvives: false };
  }

  if (defenderType === "LANDMINE") {
    if (attackerType === "ENGINEER") {
      return { outcome: "attacker_wins", attackerSurvives: true, defenderSurvives: false };
    }
    return { outcome: "defender_wins", attackerSurvives: false, defenderSurvives: true };
  }

  // attackerType can't be LANDMINE here (landmines never move, so they're never an attacker).
  const attackerRank = rankOf(attackerType)!;
  const defenderRank = rankOf(defenderType)!;

  if (attackerRank === defenderRank) {
    return { outcome: "mutual_destruction", attackerSurvives: false, defenderSurvives: false };
  }
  if (attackerRank > defenderRank) {
    return { outcome: "attacker_wins", attackerSurvives: true, defenderSurvives: false };
  }
  return { outcome: "defender_wins", attackerSurvives: false, defenderSurvives: true };
}
