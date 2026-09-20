"use client";

import { useMemo, useState } from "react";
import type { BoardGraph, PieceType } from "@/lib/rules/types";
import { validatePlacement, type PlacementEntry } from "@/lib/rules/placement";
import { PIECE_LABELS } from "@/lib/rules/pieceRanks";
import { PieceTray } from "./PieceTray";

export function PlacementBoard({
  board,
  seatIndex,
  submitting,
  onConfirm,
}: {
  board: BoardGraph;
  seatIndex: number;
  submitting: boolean;
  onConfirm: (placements: PlacementEntry[]) => void;
}) {
  const [placements, setPlacements] = useState<Record<string, PieceType>>({});
  const [selected, setSelected] = useState<PieceType | null>(null);

  const territoryNodes = useMemo(
    () =>
      Object.values(board.nodes)
        .filter((n) => n.territory === seatIndex)
        .sort((a, b) => (a.row! - b.row!) * 10 + (a.col! - b.col!)),
    [board, seatIndex],
  );

  const placedCounts = useMemo(() => {
    const counts: Partial<Record<PieceType, number>> = {};
    for (const type of Object.values(placements)) counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, [placements]);

  const entries: PlacementEntry[] = Object.entries(placements).map(([nodeId, pieceType]) => ({
    nodeId,
    pieceType,
  }));
  const errors = validatePlacement(board, seatIndex, entries);

  function handleCellClick(nodeId: string) {
    setPlacements((prev) => {
      const next = { ...prev };
      if (selected) {
        next[nodeId] = selected;
      } else if (next[nodeId]) {
        delete next[nodeId];
      }
      return next;
    });
  }

  const rows = 6;
  const cols = 5;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h2 className="font-heading text-lg tracking-wide text-accent">Arrange your forces</h2>
        <p className="text-sm text-text-muted">
          Pick a piece below, then click a square in your territory. Click a placed piece to
          remove it.
        </p>
      </div>

      <PieceTray placedCounts={placedCounts} selected={selected} onSelect={setSelected} />

      <div
        className="grid gap-1 rounded-lg border border-border bg-surface p-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {territoryNodes.map((node) => {
          const placed = placements[node.id];
          const bg =
            node.type === "headquarters"
              ? "bg-primary/40"
              : node.type === "camp"
                ? "bg-accent/10"
                : "bg-surface-raised";
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => handleCellClick(node.id)}
              title={node.id}
              className={`flex aspect-square cursor-pointer items-center justify-center rounded border border-border text-[11px] font-heading transition-colors duration-150 hover:border-accent ${bg}`}
              style={{ gridRow: node.row! + 1, gridColumn: node.col! + 1 }}
            >
              {placed ? PIECE_LABELS[placed] : ""}
            </button>
          );
        })}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="list-inside list-disc text-xs text-danger">
          {errors.slice(0, 5).map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={errors.length > 0 || submitting}
        onClick={() => onConfirm(entries)}
        className="cursor-pointer self-start rounded bg-accent px-4 py-2 font-heading text-sm tracking-wide text-background transition-colors duration-150 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Confirming..." : "Confirm Placement"}
      </button>
    </div>
  );
}
