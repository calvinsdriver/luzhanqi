import type { PublicGameState } from "@/lib/rules/types";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";

export function TurnIndicator({ state, seatIndex }: { state: PublicGameState; seatIndex: number }) {
  const { t } = useLanguage();
  const current = state.seats.find((s) => s.seatIndex === state.currentTurnSeat);
  const isYou = state.currentTurnSeat === seatIndex;

  return (
    <div
      className={`rounded border px-4 py-3 text-center transition-colors duration-150 ${
        isYou ? "border-accent bg-accent/10" : "border-border bg-surface-raised"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-text-muted">{t("turn.label")}</p>
      <p className={`font-heading text-base tracking-wide ${isYou ? "text-accent" : "text-text"}`}>
        {isYou ? t("turn.yourMove") : (current?.nickname ?? t("turn.seat", { n: state.currentTurnSeat + 1 }))}
      </p>
    </div>
  );
}
