"use client";

import type { PublicPiece } from "@/lib/rules/types";
import { PIECE_LABELS } from "@/lib/rules/pieceRanks";

const CELL = 40;

export function PieceToken({
  piece,
  cx,
  cy,
  isSelected,
  isSelectable,
  onClick,
}: {
  piece: PublicPiece;
  cx: number;
  cy: number;
  isSelected: boolean;
  isSelectable: boolean;
  onClick: () => void;
}) {
  const team = piece.seatIndex % 2 === 0 ? "var(--color-team-a)" : "var(--color-team-b)";
  const label = piece.type ? PIECE_LABELS[piece.type] : "?";

  return (
    <g
      onClick={onClick}
      style={{ cursor: isSelectable ? "pointer" : "default" }}
      className="transition-opacity duration-150"
    >
      <circle
        cx={cx}
        cy={cy}
        r={CELL * 0.34}
        fill={team}
        stroke={isSelected ? "var(--color-accent)" : "rgba(0,0,0,0.4)"}
        strokeWidth={isSelected ? 3 : 1}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-body)"
        fontSize={9}
        fill="var(--color-text)"
      >
        {label}
      </text>
    </g>
  );
}
