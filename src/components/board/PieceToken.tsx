"use client";

import { memo } from "react";
import type { PublicPiece } from "@/lib/rules/types";
import { PIECE_FULL_NAMES, PieceIcon } from "./pieceIcons";

const CELL = 40;
const TOKEN = CELL * 0.9;

function PieceTokenImpl({
  piece,
  cx,
  cy,
  isSelected,
  isSelectable,
}: {
  piece: PublicPiece;
  cx: number;
  cy: number;
  isSelected: boolean;
  isSelectable: boolean;
}) {
  const team = piece.seatIndex % 2 === 0 ? "var(--color-team-a)" : "var(--color-team-b)";
  const fullName = piece.type ? PIECE_FULL_NAMES[piece.type] : "Unknown piece";
  // Full titles never fit on one line at board scale ("Brigadier General", "Field Marshal",
  // ...) - wrap onto a second line at the space rather than truncating or abbreviating.
  const nameLines = piece.type ? fullName.split(" ") : ["?"];

  return (
    // data-node-id, not an onClick prop: BoardCanvas handles all clicks via a single
    // delegated listener on the <svg> root (see BoardCanvas.tsx for why - a per-piece
    // callback prop here previously caused a real bug with this component memoized).
    <g data-node-id={piece.nodeId ?? undefined} style={{ cursor: isSelectable ? "pointer" : "default" }}>
      <title>{fullName}</title>
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
      <g transform={`translate(${cx}, ${cy - TOKEN * 0.26})`}>
        <PieceIcon type={piece.type} color="var(--color-text)" size={TOKEN * 0.2} />
      </g>
      {nameLines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={cy + TOKEN * 0.14 + i * TOKEN * 0.155}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-body)"
          fontWeight={600}
          fontSize={TOKEN * 0.135}
          fill="var(--color-text)"
        >
          {line}
        </text>
      ))}
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
 * so reference equality alone would defeat memoization entirely. Every field that affects
 * rendering is listed above, and (unlike an earlier version of this component) there is no
 * callback prop left for that list to ever miss. */
export const PieceToken = memo(PieceTokenImpl, propsAreEqual);
