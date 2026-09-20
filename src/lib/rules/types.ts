export type NodeId = string;

export type NodeType = "post" | "camp" | "headquarters" | "mountain" | "neutral";

export interface BoardNode {
  id: NodeId;
  type: NodeType;
  /** Territory owner (seat index) this node belongs to, or "neutral" for shared/no-man's-land nodes. */
  territory: number | "neutral";
  /** Layout coordinates for rendering, not used by rules logic. */
  x: number;
  y: number;
  /** Local row/col within the owning territory's 6x5 grid (row 0 = front, row 5 = back). Undefined for neutral/hub nodes. */
  row?: number;
  col?: number;
}

/** An ordered straight-line sequence of nodes that make up one railroad segment. */
export type RailLine = NodeId[];

export interface BoardGraph {
  mode: "2p" | "4p";
  nodes: Record<NodeId, BoardNode>;
  /** Undirected 1-step "road" adjacency, including the extra diagonal edges around camp nodes. */
  roadEdges: Record<NodeId, NodeId[]>;
  railLines: RailLine[];
}

/** Directional rail adjacency derived from `railLines`, used for the corner-turn rule. */
export interface RailAdjacency {
  neighbor: NodeId;
  /** Direction of travel, expressed as a normalized (dx, dy) grid vector. */
  dx: number;
  dy: number;
}

export const PIECE_TYPES = [
  "FIELD_MARSHAL",
  "GENERAL",
  "MAJOR_GENERAL",
  "BRIGADIER_GENERAL",
  "COLONEL",
  "MAJOR",
  "CAPTAIN",
  "LIEUTENANT",
  "ENGINEER",
  "LANDMINE",
  "BOMB",
  "FLAG",
] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

/** The 9 ranked officer types, ordered highest to lowest. Landmine/Bomb/Flag are not ranked. */
export const RANKED_OFFICERS: PieceType[] = [
  "FIELD_MARSHAL",
  "GENERAL",
  "MAJOR_GENERAL",
  "BRIGADIER_GENERAL",
  "COLONEL",
  "MAJOR",
  "CAPTAIN",
  "LIEUTENANT",
  "ENGINEER",
];

export interface Piece {
  id: string;
  type: PieceType;
  seatIndex: number;
  nodeId: NodeId | null;
  status: "in_play" | "captured";
  /** True once this piece's type has been shown to other seats (via combat, game end, or the FM-reveal rule). */
  revealed: boolean;
  /** Permanently true once the piece has moved onto (or started on) a headquarters node. */
  immobilized: boolean;
}

export interface SeatState {
  seatIndex: number;
  nickname: string | null;
  team: number;
  connected: boolean;
  placementConfirmed: boolean;
  flagCaptured: boolean;
  /** Set true once this seat's Field Marshal has been captured (per house rule, reveals the Flag's node). */
  flagRevealed: boolean;
}

export type GameStatus = "lobby" | "setup" | "active" | "finished";

export interface MoveRecord {
  seq: number;
  seatIndex: number;
  from: NodeId;
  to: NodeId;
  result: MoveResultKind;
  /** Piece types revealed to everyone as a result of this move (attacker/defender if combat occurred). */
  revealedTypes: { nodeId: NodeId; type: PieceType }[];
}

export type MoveResultKind =
  | "move"
  | "attacker_wins"
  | "defender_wins"
  | "mutual_destruction"
  | "flag_captured";

export interface WinnerInfo {
  seats: number[];
  reason: "flag_captured" | "team_eliminated";
}

export interface GameState {
  mode: "2p" | "4p";
  status: GameStatus;
  currentTurnSeat: number;
  seats: SeatState[];
  pieces: Piece[];
  moveLog: MoveRecord[];
  winner: WinnerInfo | null;
}

/** Same shape as GameState, but any piece not owned by the requesting seat has `type` masked unless revealed. */
export type PublicPiece = Omit<Piece, "type"> & { type: PieceType | null };

export interface PublicGameState extends Omit<GameState, "pieces"> {
  pieces: PublicPiece[];
  viewerSeat: number;
}

export const ROSTER: Record<PieceType, number> = {
  FIELD_MARSHAL: 1,
  GENERAL: 1,
  MAJOR_GENERAL: 2,
  BRIGADIER_GENERAL: 2,
  COLONEL: 2,
  MAJOR: 2,
  CAPTAIN: 3,
  LIEUTENANT: 3,
  ENGINEER: 3,
  LANDMINE: 3,
  BOMB: 2,
  FLAG: 1,
};

export const PIECES_PER_SEAT = Object.values(ROSTER).reduce((a, b) => a + b, 0); // 25
