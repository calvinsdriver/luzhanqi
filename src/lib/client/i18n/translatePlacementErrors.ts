import type { TranslationKey } from "./translations";

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

/**
 * validatePlacement() (src/lib/rules/placement.ts) is pure rules-engine code with no
 * notion of display language, so it returns fixed-shape English strings. This pattern-
 * matches those known shapes and rebuilds a localized message - anything that doesn't
 * match (which shouldn't happen unless the rules engine's messages change without this
 * being updated) is shown as-is rather than hidden.
 */
export function translatePlacementError(raw: string, t: TFn): string {
  let m: RegExpMatchArray | null;

  if ((m = raw.match(/^Expected (\d+) (\w+), got (\d+)$/))) {
    const [, expected, type, actual] = m;
    const pieceKey = `piece.${type}` as TranslationKey;
    const pieceName = t(pieceKey);
    return t("placementError.expectedCount", { expected, actual, piece: pieceName === pieceKey ? type : pieceName });
  }
  if ((m = raw.match(/^Unknown piece type: (.+)$/))) {
    return t("placementError.unknownPieceType", { type: m[1] });
  }
  if (/ is used more than once$/.test(raw)) return t("placementError.nodeUsedTwice");
  if (/^Unknown node: /.test(raw)) return t("placementError.unknownNode");
  if (/ is not in seat \d+'s territory$/.test(raw)) return t("placementError.wrongTerritory");
  if (/^Flag must be placed on a headquarters node/.test(raw)) return t("placementError.flagNotHQ");
  if (/must be in the rear two rows$/.test(raw)) return t("placementError.landmineNotRear");
  if (/cannot be placed on the front row$/.test(raw)) return t("placementError.bombOnFrontRow");

  return raw;
}

export function translatePlacementErrors(raws: string[], t: TFn): string[] {
  return raws.map((raw) => translatePlacementError(raw, t));
}
