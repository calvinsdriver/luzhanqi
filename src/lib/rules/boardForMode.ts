import type { BoardGraph } from "./types";
import { BOARD_2P } from "./board2p";
import { BOARD_4P } from "./board4p";

/** Pure lookup, safe to import from both server code and client components/hooks. */
export function boardForMode(mode: "2p" | "4p"): BoardGraph {
  return mode === "2p" ? BOARD_2P : BOARD_4P;
}
