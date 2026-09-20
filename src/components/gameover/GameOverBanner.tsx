import type { PublicGameState } from "@/lib/rules/types";

export function GameOverBanner({ state }: { state: PublicGameState }) {
  const winner = state.winner;
  if (!winner) return null;

  const won = winner.seats.includes(state.viewerSeat);
  const names = winner.seats
    .map((s) => state.seats.find((seat) => seat.seatIndex === s)?.nickname ?? `Seat ${s + 1}`)
    .join(" & ");

  const reason = winner.reason === "flag_captured" ? "captured the Flag" : "eliminated the opposing team";

  return (
    <div
      role="alert"
      className="rounded-lg border border-accent bg-surface-raised p-6 text-center"
    >
      <h2 className="font-heading text-2xl tracking-wide text-accent">
        {won ? "Victory" : "Defeat"}
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        {names} {reason}.
      </p>
    </div>
  );
}
