"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "./supabaseBrowser";
import { boardForMode } from "@/lib/rules/boardForMode";
import { legalMoves } from "@/lib/rules/movement";
import type { NodeId, PublicGameState } from "@/lib/rules/types";

interface StateResponse {
  gameId: string;
  gameKey: string;
  mode: "2p" | "4p";
  state: PublicGameState;
}

interface UseGameChannelResult {
  loading: boolean;
  error: string | null;
  gameId: string | null;
  mode: "2p" | "4p" | null;
  state: PublicGameState | null;
  seatIndex: number;
  selectedNode: NodeId | null;
  legalDestinations: NodeId[];
  selectNode: (nodeId: NodeId | null) => void;
  submitMove: (from: NodeId, to: NodeId) => Promise<{ ok: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useGameChannel(gameKey: string, token: string | null): UseGameChannelResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StateResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchState = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/games/${gameKey}/state?token=${encodeURIComponent(token)}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to load game state");
        return;
      }
      setError(null);
      setData(body);
    } catch {
      setError("Network error while loading game state");
    } finally {
      setLoading(false);
    }
  }, [gameKey, token]);

  useEffect(() => {
    // Fetching-on-mount-and-on-dependency-change is the effect's whole job here; the
    // setState calls happen inside fetchState's own async body, not synchronously in the
    // effect, so this isn't the cascading-render pattern the rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!data?.gameId) return;

    const channel = supabaseBrowser()
      .channel(`game-events-${data.gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_events", filter: `game_id=eq.${data.gameId}` },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(fetchState, 150);
        },
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabaseBrowser().removeChannel(channel);
    };
  }, [data?.gameId, fetchState]);

  const seatIndex = data?.state.viewerSeat ?? -1;

  const legalDestinations = useMemo(() => {
    if (!selectedNode || !data) return [];
    const piece = data.state.pieces.find((p) => p.nodeId === selectedNode && p.status === "in_play");
    if (!piece || piece.seatIndex !== seatIndex || piece.type === null) return [];
    const board = boardForMode(data.mode);
    return legalMoves(board, data.state.pieces, selectedNode, piece.type, seatIndex);
  }, [selectedNode, data, seatIndex]);

  const selectNode = useCallback(
    (nodeId: NodeId | null) => setSelectedNode(nodeId),
    [],
  );

  const submitMove = useCallback(
    async (from: NodeId, to: NodeId) => {
      if (!token) return { ok: false, error: "Not connected" };
      const res = await fetch(`/api/games/${gameKey}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, from, to }),
      });
      const body = await res.json();
      if (!res.ok) return { ok: false, error: body.error ?? "Move failed" };
      setSelectedNode(null);
      await fetchState();
      return { ok: true };
    },
    [gameKey, token, fetchState],
  );

  return {
    loading,
    error,
    gameId: data?.gameId ?? null,
    mode: data?.mode ?? null,
    state: data?.state ?? null,
    seatIndex,
    selectedNode,
    legalDestinations,
    selectNode,
    submitMove,
    refetch: fetchState,
  };
}
