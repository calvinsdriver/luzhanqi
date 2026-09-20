import type { PublicGameState } from "@/lib/rules/types";

const RESULT_LABEL: Record<string, string> = {
  move: "moved",
  attacker_wins: "captured",
  defender_wins: "was repelled by",
  mutual_destruction: "traded with",
  flag_captured: "captured the Flag from",
};

export function MoveLogPanel({ state }: { state: PublicGameState }) {
  const moves = [...state.moveLog].reverse();
  if (moves.length === 0) {
    return <p className="text-xs text-text-muted">No moves yet.</p>;
  }

  return (
    <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-xs">
      {moves.map((m) => {
        const nickname = state.seats.find((s) => s.seatIndex === m.seatIndex)?.nickname ?? `Seat ${m.seatIndex + 1}`;
        return (
          <li key={m.seq} className="border-b border-border/60 pb-1 text-text-muted">
            <span className="text-text">{nickname}</span> {RESULT_LABEL[m.result] ?? m.result}{" "}
            {m.from} to {m.to}
          </li>
        );
      })}
    </ul>
  );
}
