"use client";

import { use, useEffect, useState } from "react";
import { JoinGameForm } from "@/components/join/JoinGameForm";
import { WaitingRoom } from "@/components/lobby/WaitingRoom";
import { PlacementBoard } from "@/components/placement/PlacementBoard";
import { BoardCanvas } from "@/components/board/BoardCanvas";
import { TurnIndicator } from "@/components/board/TurnIndicator";
import { CapturedPiecesPanel } from "@/components/board/CapturedPiecesPanel";
import { MoveLogPanel } from "@/components/board/MoveLogPanel";
import { GameOverBanner } from "@/components/gameover/GameOverBanner";
import { useGameChannel } from "@/lib/client/useGameChannel";
import { readToken } from "@/lib/client/localStorageKeys";
import { boardForMode } from "@/lib/rules/boardForMode";
import type { PlacementEntry } from "@/lib/rules/placement";

export default function GamePage({ params }: PageProps<"/g/[gameKey]">) {
  const { gameKey } = use(params);
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

  if (token === undefined) return null; // reading localStorage
  if (token === null) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <p className="mb-4 text-center text-sm text-text-muted">
            You haven&apos;t joined game <span className="text-accent">{gameKey}</span> yet.
          </p>
          <JoinGameForm initialGameKey={gameKey} />
        </div>
      </div>
    );
  }

  if (channel.loading) {
    return <p className="flex-1 p-8 text-center text-text-muted">Loading...</p>;
  }
  if (channel.error || !channel.state || !channel.mode) {
    return <p className="flex-1 p-8 text-center text-danger" role="alert">{channel.error ?? "Something went wrong"}</p>;
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
        setPlacementError(body.error ?? "Could not confirm placement");
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
    if (!result.ok) setMoveError(result.error ?? "Move failed");
  }

  if (state.status === "lobby") {
    return (
      <div className="flex-1 px-4 py-16">
        <WaitingRoom gameKey={gameKey} state={state} />
      </div>
    );
  }

  if (state.status === "setup") {
    const mySeat = state.seats.find((s) => s.seatIndex === seatIndex);
    if (mySeat?.placementConfirmed) {
      return (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-text-muted">Waiting for other players to finish placing their pieces...</p>
        </div>
      );
    }
    return (
      <div className="flex-1 px-4 py-10">
        {placementError && (
          <p role="alert" className="mx-auto mb-4 max-w-2xl text-sm text-danger">
            {placementError}
          </p>
        )}
        <PlacementBoard
          board={board}
          seatIndex={seatIndex}
          submitting={placementSubmitting}
          onConfirm={handleConfirmPlacement}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-8">
      {state.status === "finished" && (
        <div className="mx-auto mb-6 max-w-3xl">
          <GameOverBanner state={state} />
        </div>
      )}

      <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <BoardCanvas
            board={board}
            pieces={state.pieces}
            seatIndex={seatIndex}
            selectedNode={channel.selectedNode}
            legalDestinations={state.status === "active" ? channel.legalDestinations : []}
            onSelectNode={channel.selectNode}
            onMove={handleMove}
          />
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-64">
          <TurnIndicator state={state} seatIndex={seatIndex} />
          {moveError && (
            <p role="alert" className="text-xs text-danger">
              {moveError}
            </p>
          )}
          <div>
            <h3 className="mb-1 text-xs uppercase tracking-wide text-text-muted">Captured</h3>
            <CapturedPiecesPanel state={state} />
          </div>
          <div>
            <h3 className="mb-1 text-xs uppercase tracking-wide text-text-muted">Move log</h3>
            <MoveLogPanel state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}
