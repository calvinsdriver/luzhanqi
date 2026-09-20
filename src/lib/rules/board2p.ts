import type { BoardGraph, BoardNode, NodeId } from "./types";
import { addRoadEdge, buildTerritoryGrid, mergeRoadEdges, TERRITORY_ROWS } from "./gridBuilder";

/**
 * The 65-node 2-player board: two 30-node territories (seats 0 and 1) plus a 5-node
 * neutral strip between them. See docs/board-authoring-notes.md for the layout rationale.
 */
function buildBoard2P(): BoardGraph {
  const roadEdges: Record<NodeId, NodeId[]> = {};
  const nodes: Record<NodeId, BoardNode> = {};

  // Seat 0's territory sits "above" the neutral strip: row 0 (front) is nearest the strip.
  const territory0 = buildTerritoryGrid(0, "P0", (row, col) => ({
    x: col,
    y: TERRITORY_ROWS - 1 - row,
  }));
  // Seat 1's territory mirrors it below the strip.
  const territory1 = buildTerritoryGrid(1, "P1", (row, col) => ({
    x: col,
    y: TERRITORY_ROWS + 1 + row,
  }));

  for (const t of [territory0, territory1]) {
    for (const n of t.nodes) nodes[n.id] = n;
    mergeRoadEdges(roadEdges, t.roadEdges);
  }

  const neutralY = TERRITORY_ROWS; // row directly between the two territories
  const NEUTRAL_MOUNTAIN_COLS = [1, 3];
  const NEUTRAL_CONNECTOR_COLS = [0, 2, 4];
  const neutralId = (col: number): NodeId => `N-${col}`;

  for (let col = 0; col < 5; col++) {
    const id = neutralId(col);
    const isMountain = NEUTRAL_MOUNTAIN_COLS.includes(col);
    nodes[id] = {
      id,
      type: isMountain ? "mountain" : "neutral",
      territory: "neutral",
      x: col,
      y: neutralY,
    };
    roadEdges[id] = [];
  }

  for (const col of NEUTRAL_CONNECTOR_COLS) {
    addRoadEdge(roadEdges, neutralId(col), territory0.idAt(0, col));
    addRoadEdge(roadEdges, neutralId(col), territory1.idAt(0, col));
  }
  // Mountain nodes (N-1, N-3) intentionally get no edges at all - they are impassable.

  const railLines = [
    // Outer-column rails: full board length, straight through the neutral strip.
    [
      ...[...territory0.outerColumnIds.col0].reverse(), // back (row5) -> front (row0)
      neutralId(0),
      ...territory1.outerColumnIds.col0, // front (row0) -> back (row5)
    ],
    [
      ...[...territory0.outerColumnIds.col4].reverse(),
      neutralId(4),
      ...territory1.outerColumnIds.col4,
    ],
    // Each side's front-row rail (lateral movement along the front line).
    territory0.frontRowIds,
    territory1.frontRowIds,
  ];

  return { mode: "2p", nodes, roadEdges, railLines };
}

export const BOARD_2P: BoardGraph = buildBoard2P();
