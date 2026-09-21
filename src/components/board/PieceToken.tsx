"use client";

import { memo } from "react";
import type { PublicPiece } from "@/lib/rules/types";
import { PieceIcon } from "./pieceIcons";
import { TOKEN_HEIGHT, TOKEN_WIDTH } from "./boardLayout";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import type { TranslationKey } from "@/lib/client/i18n/translations";
import { PIECE_ABBREVIATIONS } from "@/lib/rules/pieceRanks";

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
  const { lang, t } = useLanguage();
  const team = piece.seatIndex % 2 === 0 ? "var(--color-team-a)" : "var(--color-team-b)";
  const fullName = piece.type ? t(`piece.${piece.type}` as TranslationKey) : t("piece.unknown");
  // The full title is always available on hover via <title> below; what's actually drawn
  // on the token itself is the short English abbreviation ("FM", "GEN", ...) in English,
  // or the (already two-character) full name in Chinese, which needs no abbreviating.
  const displayText = piece.type ? (lang === "en" ? PIECE_ABBREVIATIONS[piece.type] : fullName) : "?";

  return (
    // data-node-id, not an onClick prop: BoardCanvas handles all clicks via a single
    // delegated listener on the <svg> root (see BoardCanvas.tsx for why - a per-piece
    // callback prop here previously caused a real bug with this component memoized).
    <g data-node-id={piece.nodeId ?? undefined} style={{ cursor: isSelectable ? "pointer" : "default" }}>
      <title>{fullName}</title>
      <rect
        x={cx - TOKEN_WIDTH / 2}
        y={cy - TOKEN_HEIGHT / 2}
        width={TOKEN_WIDTH}
        height={TOKEN_HEIGHT}
        rx={4}
        fill={team}
        stroke={isSelected ? "var(--color-accent)" : "rgba(0,0,0,0.4)"}
        strokeWidth={isSelected ? 3 : 1}
      />
      <g transform={`translate(${cx}, ${cy - TOKEN_HEIGHT * 0.2})`}>
        <PieceIcon type={piece.type} color="var(--color-text)" size={TOKEN_HEIGHT * 0.26} />
      </g>
      <text
        x={cx}
        y={cy + TOKEN_HEIGHT * 0.26}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-body)"
        fontWeight={600}
        fontSize={TOKEN_HEIGHT * 0.24}
        fill="var(--color-text)"
      >
        {displayText}
      </text>
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
 * callback prop left for that list to ever miss. Reading the language via context (rather
 * than a prop) still re-renders correctly on a language change - memo only bails out on
 * props equality, not on context changes. */
export const PieceToken = memo(PieceTokenImpl, propsAreEqual);
