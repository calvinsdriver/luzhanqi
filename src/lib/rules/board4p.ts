import type { BoardGraph, BoardNode, NodeId, RailLine } from "./types";
import { addRoadEdge, buildTerritoryGrid, mergeRoadEdges } from "./gridBuilder";

/**
 * The 129-node 4-player board: four 30-node territories (seats 0-3, no mountains) rotated
 * 0/90/180/270 degrees around a shared 9-node (3x3) central neutral hub. Opposite seats
 * (0,2) and (1,3) are allied teams. See docs/board-authoring-notes.md for the layout
 * rationale, including why the hub's 3-cells-per-edge geometry limits each territory to 3
 * frontline connectors (columns 0, 2 and 4) exactly like the 2P board's mountain-gap pattern.
 */

type HubCell = NodeId;

interface TerritoryOrientation {
  seatIndex: number;
  idPrefix: string;
  toXY: (row: number, col: number) => { x: number; y: number };
  /** Hub cells that this territory's row-0 col 0/2/4 connect into, in that column order. */
  hubConnectors: [HubCell, HubCell, HubCell];
}

function buildBoard4P(): BoardGraph {
  const hubId = (r: number, c: number): HubCell => `H-${r}-${c}`;

  const orientations: TerritoryOrientation[] = [
    {
      // North
      seatIndex: 0,
      idPrefix: "P0",
      toXY: (row, col) => ({ x: col - 2, y: -(row + 2) }),
      hubConnectors: [hubId(0, 0), hubId(0, 1), hubId(0, 2)],
    },
    {
      // East
      seatIndex: 1,
      idPrefix: "P1",
      toXY: (row, col) => ({ x: row + 2, y: col - 2 }),
      hubConnectors: [hubId(0, 2), hubId(1, 2), hubId(2, 2)],
    },
    {
      // South
      seatIndex: 2,
      idPrefix: "P2",
      toXY: (row, col) => ({ x: 2 - col, y: row + 2 }),
      hubConnectors: [hubId(2, 2), hubId(2, 1), hubId(2, 0)],
    },
    {
      // West
      seatIndex: 3,
      idPrefix: "P3",
      toXY: (row, col) => ({ x: -(row + 2), y: 2 - col }),
      hubConnectors: [hubId(2, 0), hubId(1, 0), hubId(0, 0)],
    },
  ];

  const nodes: Record<NodeId, BoardNode> = {};
  const roadEdges: Record<NodeId, NodeId[]> = {};
  const railLines: RailLine[] = [];

  // Central 3x3 neutral hub.
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const id = hubId(r, c);
      nodes[id] = { id, type: "neutral", territory: "neutral", x: c - 1, y: r - 1 };
      roadEdges[id] = [];
    }
  }
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const id = hubId(r, c);
      if (c + 1 < 3) addRoadEdge(roadEdges, id, hubId(r, c + 1));
      if (r + 1 < 3) addRoadEdge(roadEdges, id, hubId(r + 1, c));
    }
  }
  railLines.push(
    [hubId(0, 0), hubId(0, 1), hubId(0, 2)], // top edge ring
    [hubId(0, 2), hubId(1, 2), hubId(2, 2)], // right edge ring
    [hubId(2, 2), hubId(2, 1), hubId(2, 0)], // bottom edge ring
    [hubId(2, 0), hubId(1, 0), hubId(0, 0)], // left edge ring
  );

  for (const orient of orientations) {
    const territory = buildTerritoryGrid(orient.seatIndex, orient.idPrefix, orient.toXY);
    for (const n of territory.nodes) nodes[n.id] = n;
    mergeRoadEdges(roadEdges, territory.roadEdges);

    const [cornerA, mid, cornerB] = orient.hubConnectors;
    addRoadEdge(roadEdges, territory.idAt(0, 0), cornerA);
    addRoadEdge(roadEdges, territory.idAt(0, 2), mid);
    addRoadEdge(roadEdges, territory.idAt(0, 4), cornerB);

    // Outer-column rails, extended into the hub ring at their corner connector.
    railLines.push([...[...territory.outerColumnIds.col0].reverse(), cornerA]);
    railLines.push([...[...territory.outerColumnIds.col4].reverse(), cornerB]);
    // Front-row rail (lateral movement along this territory's front line).
    railLines.push(territory.frontRowIds);
  }

  return { mode: "4p", nodes, roadEdges, railLines };
}

export const BOARD_4P: BoardGraph = buildBoard4P();
