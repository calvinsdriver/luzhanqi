"use client";

import { use, useEffect, useState } from "react";
import { JoinGameForm } from "@/components/join/JoinGameForm";
import { WaitingRoom } from "@/components/lobby/WaitingRoom";
import { PlacementBoard } from "@/components/placement/PlacementBoard";
import { BoardCanvas } from "@/components/board/BoardCanvas";
import { TurnIndicator } from "@/components/board/TurnIndicator";
import { SacrificedBanner } from "@/components/board/SacrificedBanner";
import { GameOverBanner } from "@/components/gameover/GameOverBanner";
import { GameHeader } from "@/components/layout/GameHeader";
import { useGameChannel } from "@/lib/client/useGameChannel";
import { useGameSounds } from "@/lib/client/useGameSounds";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import { translateServerError } from "@/lib/client/i18n/translateServerError";
import { readToken } from "@/lib/client/localStorageKeys";
import { boardForMode } from "@/lib/rules/boardForMode";
import type { NodeId } from "@/lib/rules/types";
import type { PlacementEntry } from "@/lib/rules/placement";

export default function GamePage({ params }: PageProps<"/g/[gameKey]">) {
  const { gameKey } = use(params);
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [placementSubmitting, setPlacementSubmitting] = useState(false);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    // localStorage only exists client-side; reading it during the initial render (SSR or
    // hydration) would either throw or mismatch the server-rendered HTML, so this has to
    // happen in an effect rather than as a useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(readToken(gameKey));
  }, [gameKey]);

  const channel = useGameChannel(gameKey, token ?? null);
  useGameSounds(channel.state);

  if (token === undefined) return null; // reading localStorage
  if (token === null) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <p className="mb-4 text-center text-sm text-text-muted">
            {t("gamepage.notJoined", { key: gameKey })}
          </p>
          <JoinGameForm initialGameKey={gameKey} />
        </div>
      </div>
    );
  }

  if (channel.loading) {
    return <p className="flex-1 p-8 text-center text-text-muted">{t("gamepage.loading")}</p>;
  }
  if (channel.error || !channel.state || !channel.mode) {
    return (
      <p className="flex-1 p-8 text-center text-danger" role="alert">
        {channel.error ? translateServerError(channel.error, t) : t("error.somethingWentWrong")}
      </p>
    );
  }

  const { state, mode, seatIndex } = channel;
  const board = boardForMode(mode);

  async function handleConfirmPlacement(placements: PlacementEntry[]) {
    setPlacementSubmitting(true);
    setPlacementError(null);
    try {
      const res = await fetch(`/api/games/${gameKey}/placement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pieces: placements }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPlacementError(body.error ? translateServerError(body.error, t) : t("error.couldNotConfirm"));
        return;
      }
      await channel.refetch();
    } finally {
      setPlacementSubmitting(false);
    }
  }

  async function handleMove(from: string, to: string) {
    setMoveError(null);
    const result = await channel.submitMove(from, to);
    if (!result.ok) setMoveError(result.error ? translateServerError(result.error, t) : t("error.moveFailed"));
  }

  // Clicking the board during an active game means "select my piece, then click a
  // highlighted destination to move it there" - BoardCanvas itself has no opinion on this,
  // it just reports which node was clicked.
  function handleBoardNodeClick(nodeId: NodeId) {
    if (channel.selectedNode && channel.legalDestinations.includes(nodeId)) {
      handleMove(channel.selectedNode, nodeId);
      return;
    }
    const occupant = state!.pieces.find((p) => p.nodeId === nodeId && p.status === "in_play");
    if (occupant && occupant.seatIndex === seatIndex) {
      channel.selectNode(channel.selectedNode === nodeId ? null : nodeId);
      return;
    }
    channel.selectNode(null);
  }

  if (state.status === "lobby") {
    return (
      <div className="flex-1 px-4 py-16">
        <GameHeader gameKey={gameKey} subtitleKey="header.waitingRoom" />
        <WaitingRoom gameKey={gameKey} state={state} />
      </div>
    );
  }

  if (state.status === "setup") {
    const mySeat = state.seats.find((s) => s.seatIndex === seatIndex);
    if (mySeat?.placementConfirmed) {
      return (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center">
            <GameHeader gameKey={gameKey} />
            <p className="text-text-muted">{t("placement.waitingForOthers")}</p>
          </div>
        </div>
      );
    }
    return (
      <PlacementBoard
        board={board}
        gameKey={gameKey}
        seatIndex={seatIndex}
        opponentPieces={state.pieces}
        submitting={placementSubmitting}
        error={placementError}
        onConfirm={handleConfirmPlacement}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden px-4 py-3">
      <GameHeader gameKey={gameKey} subtitleKey={state.status === "finished" ? "header.gameOver" : "header.battle"} />

      <div className="mx-auto mb-3 w-full max-w-3xl flex-shrink-0 space-y-3">
        {state.status === "finished" && <GameOverBanner state={state} />}
        <SacrificedBanner state={state} seatIndex={seatIndex} />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-lg border border-border bg-surface p-3">
          <BoardCanvas
            board={board}
            pieces={state.pieces}
            seatIndex={seatIndex}
            selectedNode={channel.selectedNode}
            highlightedNodes={state.status === "active" ? channel.legalDestinations : []}
            onNodeClick={handleBoardNodeClick}
          />
        </div>

        <div className="flex w-full flex-shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-surface p-4 lg:w-64 lg:max-h-full">
          <TurnIndicator state={state} seatIndex={seatIndex} />
          {moveError && (
            <p role="alert" className="text-xs text-danger">
              {moveError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
