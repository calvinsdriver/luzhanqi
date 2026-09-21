"use client";

import { memo } from "react";
import type { PublicPiece } from "@/lib/rules/types";
import { PIECE_FULL_NAMES, PieceIcon } from "./pieceIcons";
import { PIECE_LABELS } from "@/lib/rules/pieceRanks";

const CELL = 40;
const TOKEN = CELL * 0.72;

function PieceTokenImpl({
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
  const label = piece.type ? PIECE_LABELS[piece.type] : null;

  return (
    <g
      onClick={onClick}
      style={{ cursor: isSelectable ? "pointer" : "default" }}
      className="transition-opacity duration-150"
    >
      <title>{title}</title>
      <rect
        x={cx - TOKEN / 2}
        y={cy - TOKEN / 2}
        width={TOKEN}
        height={TOKEN}
        rx={4}
        fill={team}
        stroke={isSelected ? "var(--color-accent)" : "rgba(0,0,0,0.4)"}
        strokeWidth={isSelected ? 3 : 1}
      />
      <g transform={`translate(${cx}, ${cy - TOKEN * 0.16})`}>
        <PieceIcon type={piece.type} color="var(--color-text)" size={TOKEN * 0.24} />
      </g>
      {label && (
        <text
          x={cx}
          y={cy + TOKEN * 0.33}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-body)"
          fontWeight={600}
          fontSize={TOKEN * 0.2}
          fill="var(--color-text)"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function propsAreEqual(
  prev: Parameters<typeof PieceTokenImpl>[0],
  next: Parameters<typeof PieceTokenImpl>[0],
): boolean {
  return (
    prev.cx === next.cx &&
    prev.cy === next.cy &&
    prev.isSelected === next.isSelected &&
    prev.isSelectable === next.isSelectable &&
    prev.piece.id === next.piece.id &&
    prev.piece.type === next.piece.type &&
    prev.piece.status === next.piece.status &&
    prev.piece.nodeId === next.piece.nodeId
  );
}

/** Board tokens can number in the hundreds on the 4P board, so this is memoized against a
 * shallow field comparison rather than the default reference-equality check - the piece
 * objects arriving from the poll-and-refetch state hook are freshly parsed JSON every time,
 * so reference equality alone would defeat memoization entirely. */
export const PieceToken = memo(PieceTokenImpl, propsAreEqual);
