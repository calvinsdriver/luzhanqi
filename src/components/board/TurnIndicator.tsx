import type { PublicGameState } from "@/lib/rules/types";

export function TurnIndicator({ state, seatIndex }: { state: PublicGameState; seatIndex: number }) {
  const current = state.seats.find((s) => s.seatIndex === state.currentTurnSeat);
  const isYou = state.currentTurnSeat === seatIndex;

  return (
    <div className="rounded border border-border bg-surface-raised px-4 py-3 text-sm">
      <span className="text-text-muted">Turn: </span>
      <span className={isYou ? "font-heading text-accent" : "text-text"}>
        {isYou ? "Your move" : (current?.nickname ?? `Seat ${state.currentTurnSeat + 1}`)}
      </span>
    </div>
  );
}
