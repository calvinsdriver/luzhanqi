"use client";

import { ROSTER, type PieceType } from "@/lib/rules/types";
import { PIECE_LABELS } from "@/lib/rules/pieceRanks";

export function PieceTray({
  placedCounts,
  selected,
  onSelect,
}: {
  placedCounts: Partial<Record<PieceType, number>>;
  selected: PieceType | null;
  onSelect: (type: PieceType | null) => void;
}) {
  const types = Object.keys(ROSTER) as PieceType[];

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {types.map((type) => {
        const remaining = ROSTER[type] - (placedCounts[type] ?? 0);
        const isSelected = selected === type;
        return (
          <button
            key={type}
            type="button"
            disabled={remaining <= 0}
            onClick={() => onSelect(isSelected ? null : type)}
            className={`flex flex-col items-center gap-0.5 rounded border px-2 py-2 text-xs transition-colors duration-150 ${
              isSelected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface-raised text-text"
            } ${remaining <= 0 ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
          >
            <span className="font-heading">{PIECE_LABELS[type]}</span>
            <span className="text-text-muted">x{remaining}</span>
          </button>
        );
      })}
    </div>
  );
}
