import type { BoardGraph, NodeId, PieceType } from "./types";
import { ROSTER } from "./types";

export interface PlacementEntry {
  nodeId: NodeId;
  pieceType: PieceType;
}

const REAR_ROWS = [4, 5]; // TERRITORY_ROWS - 2, TERRITORY_ROWS - 1 (back two rows, HQ row included)
const FRONT_ROW = 0;

/**
 * Validates one seat's full 25-piece placement before a game starts. Returns a list of
 * human-readable errors; empty means the placement is valid.
 */
export function validatePlacement(
  board: BoardGraph,
  seatIndex: number,
  placements: PlacementEntry[],
): string[] {
  const errors: string[] = [];

  const counts: Partial<Record<PieceType, number>> = {};
  for (const { pieceType } of placements) {
    counts[pieceType] = (counts[pieceType] ?? 0) + 1;
  }
  for (const [type, expected] of Object.entries(ROSTER) as [PieceType, number][]) {
    const actual = counts[type] ?? 0;
    if (actual !== expected) {
      errors.push(`Expected ${expected} ${type}, got ${actual}`);
    }
  }
  for (const type of Object.keys(counts) as PieceType[]) {
    if (!(type in ROSTER)) errors.push(`Unknown piece type: ${type}`);
  }

  const seenNodes = new Set<NodeId>();
  for (const { nodeId, pieceType } of placements) {
    if (seenNodes.has(nodeId)) {
      errors.push(`Node ${nodeId} is used more than once`);
      continue;
    }
    seenNodes.add(nodeId);

    const node = board.nodes[nodeId];
    if (!node) {
      errors.push(`Unknown node: ${nodeId}`);
      continue;
    }
    if (node.territory !== seatIndex) {
      errors.push(`Node ${nodeId} is not in seat ${seatIndex}'s territory`);
      continue;
    }

    if (pieceType === "FLAG" && node.type !== "headquarters") {
      errors.push(`Flag must be placed on a headquarters node, not ${nodeId}`);
    }
    if (pieceType === "LANDMINE" && (node.row === undefined || !REAR_ROWS.includes(node.row))) {
      errors.push(`Landmine at ${nodeId} must be in the rear two rows`);
    }
    if (pieceType === "BOMB" && node.row === FRONT_ROW) {
      errors.push(`Bomb at ${nodeId} cannot be placed on the front row`);
    }
  }

  return errors;
}
