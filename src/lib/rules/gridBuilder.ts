import type { BoardNode, NodeId, NodeType } from "./types";

/**
 * Every Luzhanqi territory is internally the same 6-row x 5-col grid:
 * row 0 is the front row (nearest the neutral zone), row 5 is the back row (headquarters).
 * Camps sit at the 4 corners + center of the (rows 1-3, cols 1-3) sub-block, matching the
 * classic board's diamond/X camp pattern. Headquarters sit at (5,1) and (5,3).
 */
export const TERRITORY_ROWS = 6;
export const TERRITORY_COLS = 5;

const CAMP_POSITIONS: [number, number][] = [
  [1, 1],
  [1, 3],
  [3, 1],
  [3, 3],
  [2, 2],
];

const HQ_POSITIONS: [number, number][] = [
  [5, 1],
  [5, 3],
];

function nodeTypeAt(row: number, col: number): NodeType {
  if (HQ_POSITIONS.some(([r, c]) => r === row && c === col)) return "headquarters";
  if (CAMP_POSITIONS.some(([r, c]) => r === row && c === col)) return "camp";
  return "post";
}

export interface TerritoryGrid {
  nodes: BoardNode[];
  roadEdges: Record<NodeId, NodeId[]>;
  idAt: (row: number, col: number) => NodeId;
  campIds: NodeId[];
  hqIds: NodeId[];
  /** All row-0 (front row) node ids, in column order. */
  frontRowIds: NodeId[];
  /** All column-0 and column-4 node ids for each row, in row order (for the outer rails). */
  outerColumnIds: { col0: NodeId[]; col4: NodeId[] };
}

/**
 * Builds one player territory's 30-node sub-graph.
 *
 * @param seatIndex owning seat, used to tag each node's `territory`.
 * @param idPrefix   prefix for this territory's node ids, e.g. "P0" or "P2".
 * @param toXY       maps (row, col) to render coordinates; lets 4P territories rotate 90/180/270.
 */
export function buildTerritoryGrid(
  seatIndex: number,
  idPrefix: string,
  toXY: (row: number, col: number) => { x: number; y: number },
): TerritoryGrid {
  const idAt = (row: number, col: number): NodeId => `${idPrefix}-${row}-${col}`;

  const nodes: BoardNode[] = [];
  const roadEdges: Record<NodeId, NodeId[]> = {};

  for (let row = 0; row < TERRITORY_ROWS; row++) {
    for (let col = 0; col < TERRITORY_COLS; col++) {
      const id = idAt(row, col);
      const { x, y } = toXY(row, col);
      nodes.push({ id, type: nodeTypeAt(row, col), territory: seatIndex, x, y, row, col });
      roadEdges[id] = [];
    }
  }

  const addEdge = (a: NodeId, b: NodeId) => {
    if (!roadEdges[a].includes(b)) roadEdges[a].push(b);
    if (!roadEdges[b].includes(a)) roadEdges[b].push(a);
  };

  for (let row = 0; row < TERRITORY_ROWS; row++) {
    for (let col = 0; col < TERRITORY_COLS; col++) {
      const id = idAt(row, col);
      if (col + 1 < TERRITORY_COLS) addEdge(id, idAt(row, col + 1));
      if (row + 1 < TERRITORY_ROWS) addEdge(id, idAt(row + 1, col));
    }
  }

  // Camps additionally connect diagonally to every in-bounds diagonal neighbor
  // (whether that neighbor is another camp or a plain post) - the classic board's star pattern.
  for (const [row, col] of CAMP_POSITIONS) {
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < TERRITORY_ROWS && nc >= 0 && nc < TERRITORY_COLS) {
        addEdge(idAt(row, col), idAt(nr, nc));
      }
    }
  }

  const campIds = CAMP_POSITIONS.map(([r, c]) => idAt(r, c));
  const hqIds = HQ_POSITIONS.map(([r, c]) => idAt(r, c));
  const frontRowIds = Array.from({ length: TERRITORY_COLS }, (_, col) => idAt(0, col));
  const outerColumnIds = {
    col0: Array.from({ length: TERRITORY_ROWS }, (_, row) => idAt(row, 0)),
    col4: Array.from({ length: TERRITORY_ROWS }, (_, row) => idAt(row, 4)),
  };

  return { nodes, roadEdges, idAt, campIds, hqIds, frontRowIds, outerColumnIds };
}

export function mergeRoadEdges(
  target: Record<NodeId, NodeId[]>,
  extra: Record<NodeId, NodeId[]>,
) {
  for (const [id, neighbors] of Object.entries(extra)) {
    if (!target[id]) target[id] = [];
    for (const n of neighbors) {
      if (!target[id].includes(n)) target[id].push(n);
    }
  }
}

export function addRoadEdge(edges: Record<NodeId, NodeId[]>, a: NodeId, b: NodeId) {
  if (!edges[a]) edges[a] = [];
  if (!edges[b]) edges[b] = [];
  if (!edges[a].includes(b)) edges[a].push(b);
  if (!edges[b].includes(a)) edges[b].push(a);
}
