import type { BoardGraph, NodeId, PieceType } from "./types";

export interface OccupancyPiece {
  nodeId: NodeId | null;
  seatIndex: number;
  status: "in_play" | "captured";
}

interface NodeLineRef {
  line: NodeId[];
  index: number;
}

const lineIndexCache = new WeakMap<BoardGraph, Record<NodeId, NodeLineRef[]>>();

function nodeLineRefs(board: BoardGraph): Record<NodeId, NodeLineRef[]> {
  let cached = lineIndexCache.get(board);
  if (cached) return cached;

  cached = {};
  for (const line of board.railLines) {
    line.forEach((nodeId, index) => {
      if (!cached![nodeId]) cached![nodeId] = [];
      cached![nodeId].push({ line, index });
    });
  }
  lineIndexCache.set(board, cached);
  return cached;
}

/** Team = seatIndex % 2 for both 2P (no allies, degenerates to seat equality) and 4P (0&2 vs 1&3). */
function sameTeam(seatA: number, seatB: number): boolean {
  return seatA % 2 === seatB % 2;
}

function buildOccupancy(pieces: OccupancyPiece[]): Map<NodeId, OccupancyPiece> {
  const map = new Map<NodeId, OccupancyPiece>();
  for (const p of pieces) {
    if (p.status === "in_play" && p.nodeId) map.set(p.nodeId, p);
  }
  return map;
}

/** Road neighbors reachable in one step, excluding own-occupied and any camp node (camps are immune to attack). */
function roadDestinations(
  board: BoardGraph,
  occupancy: Map<NodeId, OccupancyPiece>,
  origin: NodeId,
  moverSeat: number,
): NodeId[] {
  const neighbors = board.roadEdges[origin] ?? [];
  const destinations: NodeId[] = [];
  for (const neighbor of neighbors) {
    const node = board.nodes[neighbor];
    if (!node || node.type === "mountain") continue;
    const occupant = occupancy.get(neighbor);
    if (occupant) {
      if (sameTeam(occupant.seatIndex, moverSeat)) continue; // can't land on your own or an ally's piece
      if (node.type === "camp") continue; // camps are immune to attack - not a legal destination at all
      destinations.push(neighbor);
    } else {
      destinations.push(neighbor);
    }
  }
  return destinations;
}

function straightRailWalk(
  board: BoardGraph,
  occupancy: Map<NodeId, OccupancyPiece>,
  line: NodeId[],
  startIndex: number,
  step: 1 | -1,
  moverSeat: number,
): NodeId[] {
  const destinations: NodeId[] = [];
  for (let i = startIndex + step; i >= 0 && i < line.length; i += step) {
    const nodeId = line[i];
    const node = board.nodes[nodeId];
    if (!node || node.type === "mountain") break;
    const occupant = occupancy.get(nodeId);
    if (occupant) {
      if (!sameTeam(occupant.seatIndex, moverSeat) && node.type !== "camp") {
        destinations.push(nodeId);
      }
      break; // blocked either way - by own piece, an unattackable camp, or a captured enemy square
    }
    destinations.push(nodeId);
  }
  return destinations;
}

function nonEngineerRailDestinations(
  board: BoardGraph,
  occupancy: Map<NodeId, OccupancyPiece>,
  origin: NodeId,
  moverSeat: number,
): NodeId[] {
  const refs = nodeLineRefs(board)[origin] ?? [];
  const destinations = new Set<NodeId>();
  for (const { line, index } of refs) {
    for (const d of straightRailWalk(board, occupancy, line, index, 1, moverSeat)) destinations.add(d);
    for (const d of straightRailWalk(board, occupancy, line, index, -1, moverSeat)) destinations.add(d);
  }
  return [...destinations];
}

/** Engineers may turn corners: full BFS over the rail graph, blocked/capped at the first occupied node per branch. */
function engineerRailDestinations(
  board: BoardGraph,
  occupancy: Map<NodeId, OccupancyPiece>,
  origin: NodeId,
  moverSeat: number,
): NodeId[] {
  const refs = nodeLineRefs(board);
  const destinations = new Set<NodeId>();
  const visited = new Set<NodeId>([origin]);
  const queue: NodeId[] = [origin];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentRefs = refs[current] ?? [];
    const neighbors = new Set<NodeId>();
    for (const { line, index } of currentRefs) {
      if (index + 1 < line.length) neighbors.add(line[index + 1]);
      if (index - 1 >= 0) neighbors.add(line[index - 1]);
    }
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      const node = board.nodes[neighbor];
      if (!node || node.type === "mountain") continue;
      const occupant = occupancy.get(neighbor);
      if (occupant) {
        if (!sameTeam(occupant.seatIndex, moverSeat) && node.type !== "camp") {
          destinations.add(neighbor);
        }
        continue; // blocked - don't expand past this node
      }
      destinations.add(neighbor);
      queue.push(neighbor);
    }
  }
  return [...destinations];
}

/**
 * Legal destinations for the piece at `originNodeId`. Only needs the mover's own type/seat
 * (always known to the caller, since you can only select your own piece) plus positions and
 * ownership of every other piece - never their hidden type - so this is safe to run against
 * either the full server-side GameState or a seat's masked PublicGameState.
 */
export function legalMoves(
  board: BoardGraph,
  pieces: OccupancyPiece[],
  originNodeId: NodeId,
  moverType: PieceType,
  moverSeat: number,
): NodeId[] {
  if (moverType === "FLAG" || moverType === "LANDMINE") return [];

  const occupancy = buildOccupancy(pieces);
  const destinations = new Set<NodeId>();

  for (const d of roadDestinations(board, occupancy, originNodeId, moverSeat)) destinations.add(d);

  const onRail = nodeLineRefs(board)[originNodeId];
  if (onRail && onRail.length > 0) {
    const railDestinations =
      moverType === "ENGINEER"
        ? engineerRailDestinations(board, occupancy, originNodeId, moverSeat)
        : nonEngineerRailDestinations(board, occupancy, originNodeId, moverSeat);
    for (const d of railDestinations) destinations.add(d);
  }

  return [...destinations];
}
