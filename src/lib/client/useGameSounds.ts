"use client";

import { useEffect, useRef } from "react";
import type { PublicGameState } from "@/lib/rules/types";
import { playAttackSound, playGameStartSound, playLoseSound, playMoveSound, playTieSound, playWinSound } from "./sound";

/**
 * Watches the polled game state for the transitions that should make noise: a new move
 * appearing in the log (move vs. attack), setup -> active (everyone confirmed placement),
 * and active/setup -> finished (win/lose/tie, from this viewer's seat). Comparing against
 * the latest move's `seq` rather than `moveLog.length` matters because the state endpoint
 * caps the log to the most recent 50 entries - length stops growing past that point, but
 * seq never does.
 */
export function useGameSounds(state: PublicGameState | null) {
  const initializedRef = useRef(false);
  const prevStatusRef = useRef<PublicGameState["status"] | null>(null);
  const prevSeqRef = useRef(0);

  useEffect(() => {
    if (!state) return;
    const latestSeq = state.moveLog.length > 0 ? state.moveLog[state.moveLog.length - 1].seq : 0;

    if (!initializedRef.current) {
      // Don't sound off for history that already existed when this client first loaded
      // (e.g. reconnecting mid-game) - only for transitions witnessed from here on.
      initializedRef.current = true;
      prevStatusRef.current = state.status;
      prevSeqRef.current = latestSeq;
      return;
    }

    if (prevStatusRef.current === "setup" && state.status === "active") {
      playGameStartSound();
    } else if (latestSeq > prevSeqRef.current) {
      const latest = state.moveLog[state.moveLog.length - 1];
      if (latest.result === "move") playMoveSound();
      else playAttackSound();
    }

    if (prevStatusRef.current !== "finished" && state.status === "finished" && state.winner) {
      if (state.winner.reason === "tie") playTieSound();
      else if (state.winner.seats.includes(state.viewerSeat)) playWinSound();
      else playLoseSound();
    }

    prevStatusRef.current = state.status;
    prevSeqRef.current = latestSeq;
  }, [state]);
}
