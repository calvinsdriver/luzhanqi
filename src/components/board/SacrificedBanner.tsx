import type { PublicGameState } from "@/lib/rules/types";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import { isSacrificed } from "@/lib/client/sacrificed";

/**
 * The Flag itself never fights and never moves, so a seat with zero other pieces left is
 * functionally helpless even if their Flag hasn't fallen yet (2P has no other way to end
 * the game short of that, so this can genuinely happen through ordinary attrition).
 *
 * This condition is rare in practice - most games end via a Flag capture well before a
 * side's entire army is gone - so it's rendered as a prominent banner above the board
 * (the same slot/treatment as GameOverBanner) rather than tucked into the side panel,
 * specifically so it's unmistakable on the rare occasion it does fire.
 */
export function SacrificedBanner({ state, seatIndex }: { state: PublicGameState; seatIndex: number }) {
  const { t } = useLanguage();
  if (!isSacrificed(state.pieces, seatIndex)) return null;

  return (
    <div role="alert" className="rounded-lg border border-danger bg-danger/10 p-4 text-center">
      <p className="font-heading text-xl tracking-wide text-danger">{t("sacrificed.title")}</p>
      <p className="mt-1 text-sm text-text-muted">{t("sacrificed.body")}</p>
    </div>
  );
}
