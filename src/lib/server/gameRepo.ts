import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";
import { generateShortKey } from "./shortKey";
import { generateReconnectToken, hashToken, tokenMatchesHash } from "./tokens";
import { boardForMode } from "@/lib/rules/boardForMode";
import { applyMove } from "@/lib/rules/applyMove";
import { validatePlacement, type PlacementEntry } from "@/lib/rules/placement";
import { buildSeatView } from "@/lib/rules/view";
import { trimMoveLogForClient } from "./stateResponse";
import type { BoardGraph, GameState, MoveRecord, Piece, PublicGameState, SeatState } from "@/lib/rules/types";

export type RepoResult<T> = { ok: true; value: T } | { ok: false; error: string; status: number };

function ok<T>(value: T): RepoResult<T> {
  return { ok: true, value };
}
function fail<T>(error: string, status = 400): RepoResult<T> {
  return { ok: false, error, status };
}

interface GameRow {
  id: string;
  short_key: string;
  mode: "2p" | "4p";
  status: GameState["status"];
  current_turn_seat: number;
  version: number;
  winner: GameState["winner"];
}

interface SeatRow {
  seat_index: number;
  nickname: string;
  reconnect_token_hash: string;
  team: number;
  connected: boolean;
  placement_confirmed: boolean;
  flag_captured: boolean;
  flag_revealed: boolean;
}

interface PieceRow {
  id: string;
  seat_index: number;
  piece_type: Piece["type"];
  node_id: string | null;
  status: Piece["status"];
  revealed: boolean;
  immobilized: boolean;
}

interface MoveRow {
  seq: number;
  seat_index: number;
  from_node: string;
  to_node: string;
  result: MoveRecord["result"];
  revealed_types: MoveRecord["revealedTypes"];
}

export interface LoadedGame {
  gameRow: GameRow;
  board: BoardGraph;
  state: GameState;
}

function seatRowToState(row: SeatRow): SeatState {
  return {
    seatIndex: row.seat_index,
    nickname: row.nickname,
    team: row.team,
    connected: row.connected,
    placementConfirmed: row.placement_confirmed,
    flagCaptured: row.flag_captured,
    flagRevealed: row.flag_revealed,
  };
}

function pieceRowToPiece(row: PieceRow): Piece {
  return {
    id: row.id,
    type: row.piece_type,
    seatIndex: row.seat_index,
    nodeId: row.node_id,
    status: row.status,
    revealed: row.revealed,
    immobilized: row.immobilized,
  };
}

export async function loadGameByKey(shortKey: string): Promise<RepoResult<LoadedGame>> {
  const db = supabaseAdmin();
  const { data: gameRow, error: gameError } = await db
    .from("games")
    .select("id, short_key, mode, status, current_turn_seat, version, winner")
    .eq("short_key", shortKey)
    .maybeSingle();

  if (gameError) return fail(gameError.message, 500);
  if (!gameRow) return fail("Game not found", 404);

  const [{ data: seatRows, error: seatError }, { data: pieceRows, error: pieceError }, { data: moveRows, error: moveError }] =
    await Promise.all([
      db.from("seats").select("*").eq("game_id", gameRow.id).order("seat_index"),
      db.from("pieces").select("*").eq("game_id", gameRow.id),
      db.from("moves").select("*").eq("game_id", gameRow.id).order("seq"),
    ]);

  if (seatError) return fail(seatError.message, 500);
  if (pieceError) return fail(pieceError.message, 500);
  if (moveError) return fail(moveError.message, 500);

  const board = boardForMode(gameRow.mode);
  const state: GameState = {
    mode: gameRow.mode,
    status: gameRow.status,
    currentTurnSeat: gameRow.current_turn_seat,
    seats: (seatRows ?? []).map(seatRowToState),
    pieces: (pieceRows ?? []).map(pieceRowToPiece),
    moveLog: (moveRows ?? []).map((m: MoveRow) => ({
      seq: m.seq,
      seatIndex: m.seat_index,
      from: m.from_node,
      to: m.to_node,
      result: m.result,
      revealedTypes: m.revealed_types,
    })),
    winner: gameRow.winner,
  };

  return ok({ gameRow, board, state });
}

export async function createGame(
  mode: "2p" | "4p",
  nickname: string,
): Promise<RepoResult<{ gameKey: string; seatIndex: number; reconnectToken: string }>> {
  const db = supabaseAdmin();

  let gameId: string | null = null;
  let shortKey = "";
  for (let attempt = 0; attempt < 5 && !gameId; attempt++) {
    shortKey = generateShortKey();
    const { data, error } = await db
      .from("games")
      .insert({ short_key: shortKey, mode })
      .select("id")
      .maybeSingle();
    if (!error && data) {
      gameId = data.id;
    } else if (error && error.code !== "23505") {
      return fail(error.message, 500);
    }
  }
  if (!gameId) return fail("Could not allocate a unique game key, please retry", 500);

  const reconnectToken = generateReconnectToken();
  const { error: seatError } = await db.from("seats").insert({
    game_id: gameId,
    seat_index: 0,
    nickname,
    reconnect_token_hash: hashToken(reconnectToken),
    team: 0,
    connected: true,
    placement_confirmed: false,
  });
  if (seatError) {
    if (seatError.code === "23505") return fail("That nickname is taken in this game", 409);
    return fail(seatError.message, 500);
  }

  return ok({ gameKey: shortKey, seatIndex: 0, reconnectToken });
}

export async function joinGame(
  shortKey: string,
  nickname: string,
): Promise<RepoResult<{ seatIndex: number; reconnectToken: string }>> {
  const db = supabaseAdmin();
  const { data: gameRow, error: gameError } = await db
    .from("games")
    .select("id")
    .eq("short_key", shortKey)
    .maybeSingle();
  if (gameError) return fail(gameError.message, 500);
  if (!gameRow) return fail("Game not found", 404);

  const reconnectToken = generateReconnectToken();
  const { data, error } = await db.rpc("join_game", {
    p_game_id: gameRow.id,
    p_nickname: nickname,
    p_reconnect_token_hash: hashToken(reconnectToken),
  });

  if (error) {
    if (error.message.includes("nickname_taken")) {
      return fail("That nickname is taken in this game", 409);
    }
    if (error.message.includes("game_full")) return fail("This game is already full", 409);
    if (error.message.includes("game_not_joinable")) return fail("This game has already started", 409);
    if (error.message.includes("game_not_found")) return fail("Game not found", 404);
    return fail(error.message, 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return ok({ seatIndex: row.seat_index, reconnectToken });
}

async function findSeatByToken(gameId: string, token: string): Promise<SeatRow | null> {
  const db = supabaseAdmin();
  const { data: seatRows } = await db.from("seats").select("*").eq("game_id", gameId);
  for (const seat of seatRows ?? []) {
    if (tokenMatchesHash(token, seat.reconnect_token_hash)) return seat;
  }
  return null;
}

export async function reconnect(
  shortKey: string,
  token: string,
): Promise<RepoResult<{ seatIndex: number }>> {
  const loaded = await loadGameByKey(shortKey);
  if (!loaded.ok) return fail(loaded.error, loaded.status);

  const seat = await findSeatByToken(loaded.value.gameRow.id, token);
  if (!seat) return fail("Invalid reconnect token", 401);

  await supabaseAdmin()
    .from("seats")
    .update({ connected: true })
    .eq("game_id", loaded.value.gameRow.id)
    .eq("seat_index", seat.seat_index);

  return ok({ seatIndex: seat.seat_index });
}

export async function authorizeSeat(
  shortKey: string,
  token: string,
): Promise<RepoResult<{ loaded: LoadedGame; seatIndex: number }>> {
  const loaded = await loadGameByKey(shortKey);
  if (!loaded.ok) return fail(loaded.error, loaded.status);

  const seat = await findSeatByToken(loaded.value.gameRow.id, token);
  if (!seat) return fail("Invalid reconnect token", 401);

  return ok({ loaded: loaded.value, seatIndex: seat.seat_index });
}

export async function confirmPlacement(
  shortKey: string,
  token: string,
  placements: PlacementEntry[],
): Promise<RepoResult<null>> {
  const authorized = await authorizeSeat(shortKey, token);
  if (!authorized.ok) return fail(authorized.error, authorized.status);
  const { loaded, seatIndex } = authorized.value;

  if (loaded.state.status !== "setup") return fail("This game is not in the placement phase", 409);

  const errors = validatePlacement(loaded.board, seatIndex, placements);
  if (errors.length > 0) return fail(errors.join("; "), 422);

  const { error } = await supabaseAdmin().rpc("confirm_placement", {
    p_game_id: loaded.gameRow.id,
    p_seat_index: seatIndex,
    p_pieces: placements,
  });
  if (error) return fail(error.message, 500);

  return ok(null);
}

export async function makeMove(
  shortKey: string,
  token: string,
  from: string,
  to: string,
): Promise<RepoResult<{ move: MoveRecord; state: PublicGameState }>> {
  const authorized = await authorizeSeat(shortKey, token);
  if (!authorized.ok) return fail(authorized.error, authorized.status);
  const { loaded, seatIndex } = authorized.value;

  const result = applyMove(loaded.board, loaded.state, seatIndex, from, to);
  if (!result.ok) return fail(result.error, 422);

  const { data: applied, error } = await supabaseAdmin().rpc("apply_move_diff", {
    p_game_id: loaded.gameRow.id,
    p_expected_version: loaded.gameRow.version,
    p_seat_index: seatIndex,
    p_next_status: result.nextState.status,
    p_next_turn_seat: result.nextState.currentTurnSeat,
    p_winner: result.nextState.winner,
    p_seat_updates: result.nextState.seats.map((s) => ({
      seat_index: s.seatIndex,
      flag_captured: s.flagCaptured,
      flag_revealed: s.flagRevealed,
    })),
    p_piece_updates: result.nextState.pieces.map((p) => ({
      id: p.id,
      node_id: p.nodeId,
      status: p.status,
      revealed: p.revealed,
      immobilized: p.immobilized,
    })),
    p_move: {
      seq: result.move.seq,
      seat_index: result.move.seatIndex,
      from_node: result.move.from,
      to_node: result.move.to,
      result: result.move.result,
      revealed_types: result.move.revealedTypes,
    },
  });
  if (error) return fail(error.message, 500);
  if (applied === false) {
    return fail("Someone else already moved - refresh and try again", 409);
  }

  // The move's resulting state is already sitting in memory from applyMove() above - no
  // need for the route handler to pay for a second round trip (a follow-up GET /state)
  // just to hand the client something it can already be given here for free.
  return ok({ move: result.move, state: trimMoveLogForClient(buildSeatView(result.nextState, seatIndex)) });
}
