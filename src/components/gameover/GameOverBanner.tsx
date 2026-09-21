import type { PublicGameState } from "@/lib/rules/types";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";

export function GameOverBanner({ state }: { state: PublicGameState }) {
  const { t } = useLanguage();
  const winner = state.winner;
  if (!winner) return null;

  if (winner.reason === "tie") {
    return (
      <div role="alert" className="rounded-lg border border-border bg-surface-raised p-6 text-center">
        <h2 className="font-heading text-2xl tracking-wide text-text">{t("gameover.tieTitle")}</h2>
        <p className="mt-2 text-sm text-text-muted">{t("gameover.tieBody")}</p>
      </div>
    );
  }

  const won = winner.seats.includes(state.viewerSeat);
  const names = winner.seats
    .map((s) => state.seats.find((seat) => seat.seatIndex === s)?.nickname ?? t("gameover.seat", { n: s + 1 }))
    .join(" & ");

  const reason = winner.reason === "flag_captured" ? t("gameover.reasonFlag") : t("gameover.reasonTeam");

  return (
    <div role="alert" className="rounded-lg border border-accent bg-surface-raised p-6 text-center">
      <h2 className="font-heading text-2xl tracking-wide text-accent">
        {won ? t("gameover.victory") : t("gameover.defeat")}
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        {names} {reason}.
      </p>
    </div>
  );
}
