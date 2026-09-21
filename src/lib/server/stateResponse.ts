import "server-only";
import type { PublicGameState } from "@/lib/rules/types";

// The only client-side use of moveLog (useGameSounds) just needs the single latest entry
// to decide whether to play a move or attack cue - there's no move-log UI anymore, so
// shipping more than that on every response would be pure wasted payload.
const RECENT_MOVE_LOG_SIZE = 1;

export function trimMoveLogForClient(state: PublicGameState): PublicGameState {
  return { ...state, moveLog: state.moveLog.slice(-RECENT_MOVE_LOG_SIZE) };
}
