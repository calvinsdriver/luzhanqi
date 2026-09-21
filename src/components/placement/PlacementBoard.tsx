"use client";

import { useMemo, useState } from "react";
import type { BoardGraph, NodeId, PieceType, PublicPiece } from "@/lib/rules/types";
import { ROSTER } from "@/lib/rules/types";
import { validatePlacement, type PlacementEntry } from "@/lib/rules/placement";
import { BoardCanvas } from "@/components/board/BoardCanvas";
import { PieceTray } from "./PieceTray";

/**
 * The setup screen reuses the exact same BoardCanvas the live game uses (same board
 * graphics, same "your seat is always at the bottom" rotation) rather than a separate grid
 * widget, so the board a player learns during setup is the board they actually play on.
 *
 * Everything here is local React state until "Confirm Placement" is pressed - nothing is
 * sent to the server on every click, so placing, replacing, and removing pieces is always
 * possible right up until you confirm.
 */
export function PlacementBoard({
  board,
  seatIndex,
  opponentPieces,
  submitting,
  error,
  onConfirm,
}: {
  board: BoardGraph;
  seatIndex: number;
  opponentPieces: PublicPiece[];
  submitting: boolean;
  error: string | null;
  onConfirm: (placements: PlacementEntry[]) => void;
}) {
  const [placements, setPlacements] = useState<Record<NodeId, PieceType>>({});
  const [selectedType, setSelectedType] = useState<PieceType | null>(null);

  const placedCounts = useMemo(() => {
    const counts: Partial<Record<PieceType, number>> = {};
    for (const type of Object.values(placements)) counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, [placements]);

  function handleNodeClick(nodeId: NodeId) {
    const node = board.nodes[nodeId];
    if (!node || node.territory !== seatIndex) return; // only your own territory is editable

    const current = placements[nodeId];

    if (selectedType) {
      if (current === selectedType) {
        // clicking a square that already holds the selected type picks it back up
        setPlacements((prev) => {
          const next = { ...prev };
          delete next[nodeId];
          return next;
        });
        return;
      }
      const isNetNewUse = current !== selectedType;
      const remaining = ROSTER[selectedType] - (placedCounts[selectedType] ?? 0);
      if (isNetNewUse && remaining <= 0) return; // none left to place
      setPlacements((prev) => ({ ...prev, [nodeId]: selectedType }));
      return;
    }

    if (current) {
      // nothing held: click a placed piece to pick it up (auto-selects its type so the
      // very next click can drop it somewhere else)
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      setSelectedType(current);
    }
  }

  const ownPieces: PublicPiece[] = Object.entries(placements).map(([nodeId, type]) => ({
    id: `draft-${nodeId}`,
    type,
    seatIndex,
    nodeId,
    status: "in_play",
    revealed: true,
    immobilized: false,
  }));

  const boardPieces = [...opponentPieces.filter((p) => p.seatIndex !== seatIndex), ...ownPieces];

  const highlightedNodes = selectedType
    ? Object.values(board.nodes)
        .filter((n) => n.territory === seatIndex && !placements[n.id])
        .map((n) => n.id)
    : [];

  const entries: PlacementEntry[] = Object.entries(placements).map(([nodeId, pieceType]) => ({
    nodeId,
    pieceType,
  }));
  const errors = validatePlacement(board, seatIndex, entries);

  return (
    <div className="flex h-dvh flex-col overflow-hidden px-4 py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          <BoardCanvas
            board={board}
            pieces={boardPieces}
            seatIndex={seatIndex}
            selectedNode={null}
            highlightedNodes={highlightedNodes}
            onNodeClick={handleNodeClick}
          />
        </div>

        <div className="flex w-full flex-shrink-0 flex-col gap-3 overflow-y-auto lg:w-72 lg:max-h-full">
          <div>
            <h2 className="font-heading text-lg tracking-wide text-accent">Arrange your forces</h2>
            <p className="text-xs text-text-muted">
              Pick a piece, then click a highlighted square in your territory. Click a placed
              piece to pick it up again - you can rearrange freely until you confirm.
            </p>
          </div>

          <PieceTray placedCounts={placedCounts} selected={selectedType} onSelect={setSelectedType} />

          {error && (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
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
      </div>
    </div>
  );
}
