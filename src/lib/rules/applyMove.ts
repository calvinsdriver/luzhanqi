import type { BoardGraph, GameState, MoveRecord, MoveResultKind, NodeId, Piece } from "./types";
import { legalMoves } from "./movement";
import { resolveCombat } from "./combat";
import { checkWinner } from "./winCondition";

export type ApplyMoveResult =
  | { ok: true; nextState: GameState; move: MoveRecord }
  | { ok: false; error: string };

function nextSeatIndex(state: GameState): number {
  const seatCount = state.mode === "2p" ? 2 : 4;
  let next = (state.currentTurnSeat + 1) % seatCount;
  // 4P: skip any seat whose Flag has already been captured. Always terminates - a team's
  // both seats can never both be captured while the game is still active (that ends it).
  while (state.seats.find((s) => s.seatIndex === next)?.flagCaptured) {
    next = (next + 1) % seatCount;
  }
  return next;
}

export function applyMove(
  board: BoardGraph,
  state: GameState,
  seatIndex: number,
  from: NodeId,
  to: NodeId,
): ApplyMoveResult {
  if (state.status !== "active") {
    return { ok: false, error: "Game is not active" };
  }
  if (state.currentTurnSeat !== seatIndex) {
    return { ok: false, error: "It is not your turn" };
  }

  const mover = state.pieces.find(
    (p) => p.nodeId === from && p.status === "in_play" && p.seatIndex === seatIndex,
  );
  if (!mover) {
    return { ok: false, error: "No piece of yours at that node" };
  }
  if (mover.immobilized) {
    return { ok: false, error: "That piece is immobilized in a headquarters" };
  }

  const legal = legalMoves(board, state.pieces, from, mover.type, seatIndex);
  if (!legal.includes(to)) {
    return { ok: false, error: "Illegal move" };
  }

  const pieces: Piece[] = state.pieces.map((p) => ({ ...p }));
  const seats = state.seats.map((s) => ({ ...s }));
  const findPiece = (id: string) => pieces.find((p) => p.id === id)!;

  const movingPiece = findPiece(mover.id);
  const defenderPiece = pieces.find(
    (p) => p.nodeId === to && p.status === "in_play" && p.seatIndex !== seatIndex,
  );

  // Per this game's house rule, combat never reveals a piece's identity - the opponent's
  // side stays hidden for the whole game except for the one specific disclosure below
  // (a captured Field Marshal reveals that seat's Flag, and only the Flag).
  const revealedTypes: MoveRecord["revealedTypes"] = [];
  let resultKind: MoveResultKind = "move";

  const captureFieldMarshalIfApplicable = (piece: Piece) => {
    if (piece.type === "FIELD_MARSHAL" && piece.status === "captured") {
      const seat = seats.find((s) => s.seatIndex === piece.seatIndex);
      if (seat) seat.flagRevealed = true;
    }
  };

  if (!defenderPiece) {
    movingPiece.nodeId = to;
  } else {
    const combat = resolveCombat(movingPiece.type, defenderPiece.type);
    resultKind = combat.outcome;

    if (combat.attackerSurvives) {
      movingPiece.nodeId = to;
    } else {
      movingPiece.status = "captured";
      movingPiece.nodeId = null;
    }

    if (!combat.defenderSurvives) {
      defenderPiece.status = "captured";
      defenderPiece.nodeId = null;
    }

    captureFieldMarshalIfApplicable(movingPiece);
    captureFieldMarshalIfApplicable(defenderPiece);

    if (combat.outcome === "flag_captured") {
      const defenderSeat = seats.find((s) => s.seatIndex === defenderPiece.seatIndex)!;
      defenderSeat.flagCaptured = true;

      if (state.mode === "4p") {
        for (const piece of pieces) {
          if (piece.seatIndex === defenderPiece.seatIndex && piece.status === "in_play") {
            piece.status = "captured";
            piece.nodeId = null;
          }
        }
      }
    }
  }

  // If the piece that just moved landed on a headquarters, it's immobilized from now on -
  // including a player parking their own piece in their own empty HQ.
  if (movingPiece.status === "in_play" && movingPiece.nodeId) {
    const destNode = board.nodes[movingPiece.nodeId];
    if (destNode?.type === "headquarters") {
      movingPiece.immobilized = true;
    }
  }

  const winner = checkWinner(seats, state.mode);
  const status = winner ? "finished" : state.status;
  const currentTurnSeat = winner ? state.currentTurnSeat : nextSeatIndex({ ...state, seats });

  const move: MoveRecord = {
    seq: state.moveLog.length + 1,
    seatIndex,
    from,
    to,
    result: resultKind,
    revealedTypes,
  };

  const nextState: GameState = {
    ...state,
    pieces,
    seats,
    status,
    currentTurnSeat,
    winner,
    moveLog: [...state.moveLog, move],
  };

  return { ok: true, nextState, move };
}
