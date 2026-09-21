"use client";

import { ROSTER, type PieceType } from "@/lib/rules/types";
import { PieceIcon } from "@/components/board/pieceIcons";
import { PIECE_ABBREVIATIONS } from "@/lib/rules/pieceRanks";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import type { TranslationKey } from "@/lib/client/i18n/translations";

export function PieceTray({
  placedCounts,
  selected,
  onSelect,
}: {
  placedCounts: Partial<Record<PieceType, number>>;
  selected: PieceType | null;
  onSelect: (type: PieceType | null) => void;
}) {
  const { lang, t } = useLanguage();
  const types = Object.keys(ROSTER) as PieceType[];

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {types.map((type) => {
        const remaining = ROSTER[type] - (placedCounts[type] ?? 0);
        const isSelected = selected === type;
        const fullName = t(`piece.${type}` as TranslationKey);
        const label = lang === "en" ? PIECE_ABBREVIATIONS[type] : fullName;
        return (
          <button
            key={type}
            type="button"
            disabled={remaining <= 0}
            onClick={() => onSelect(isSelected ? null : type)}
            title={fullName}
            className={`flex flex-col items-center gap-1 rounded border px-2 py-2 text-xs transition-colors duration-150 ${
              isSelected
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface-raised text-text"
            } ${remaining <= 0 ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
          >
            <svg viewBox="-16 -16 32 32" className="h-6 w-6">
              <PieceIcon type={type} color={isSelected ? "var(--color-accent)" : "var(--color-text)"} size={11} />
            </svg>
            <span className="text-center font-heading leading-tight">{label}</span>
            <span className="text-text-muted">x{remaining}</span>
          </button>
        );
      })}
    </div>
  );
}
