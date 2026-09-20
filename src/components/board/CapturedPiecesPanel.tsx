import type { PublicGameState } from "@/lib/rules/types";
import { PIECE_LABELS } from "@/lib/rules/pieceRanks";

export function CapturedPiecesPanel({ state }: { state: PublicGameState }) {
  const captured = state.pieces.filter((p) => p.status === "captured");
  if (captured.length === 0) {
    return <p className="text-xs text-text-muted">No pieces captured yet.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {captured.map((p) => (
        <li
          key={p.id}
          className="rounded border border-border bg-surface-raised px-2 py-1 text-xs"
          title={`Seat ${p.seatIndex + 1}`}
        >
          {p.type ? PIECE_LABELS[p.type] : "?"}
        </li>
      ))}
    </ul>
  );
}
