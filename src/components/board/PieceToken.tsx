"use client";

import type { PublicPiece } from "@/lib/rules/types";
import { PIECE_FULL_NAMES, PieceIcon } from "./pieceIcons";

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
  const title = piece.type ? PIECE_FULL_NAMES[piece.type] : "Unknown piece";

  return (
    <g
      onClick={onClick}
      style={{ cursor: isSelectable ? "pointer" : "default" }}
      className="transition-opacity duration-150"
    >
      <title>{title}</title>
      <circle
        cx={cx}
        cy={cy}
        r={CELL * 0.34}
        fill={team}
        stroke={isSelected ? "var(--color-accent)" : "rgba(0,0,0,0.4)"}
        strokeWidth={isSelected ? 3 : 1}
      />
      <g transform={`translate(${cx}, ${cy})`}>
        <PieceIcon type={piece.type} color="var(--color-text)" size={CELL * 0.19} />
      </g>
    </g>
  );
}
