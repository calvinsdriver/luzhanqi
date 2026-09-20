"use client";

import { useState } from "react";
import type { PublicGameState } from "@/lib/rules/types";

export function WaitingRoom({ gameKey, state }: { gameKey: string; state: PublicGameState }) {
  const [copied, setCopied] = useState(false);
  const seatCount = state.mode === "2p" ? 2 : 4;
  const seats = Array.from({ length: seatCount }, (_, i) => state.seats.find((s) => s.seatIndex === i));

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(gameKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access can be denied - the key is still shown on screen to copy by hand.
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <div>
        <h2 className="font-heading text-lg tracking-wide text-accent">Waiting for players</h2>
        <p className="text-sm text-text-muted">
          Share this key with {seatCount - 1} other {seatCount - 1 === 1 ? "player" : "players"}.
        </p>
      </div>

      <button
        type="button"
        onClick={copyKey}
        className="cursor-pointer rounded border border-accent bg-surface-raised px-4 py-3 text-center font-heading text-2xl tracking-[0.3em] text-accent transition-colors duration-150 hover:bg-accent/10"
        aria-label="Copy game key"
      >
        {gameKey}
        <span className="ml-3 text-xs font-body tracking-normal text-text-muted">
          {copied ? "Copied!" : "Click to copy"}
        </span>
      </button>

      <ul className="flex flex-col gap-2">
        {seats.map((seat, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded border border-border bg-surface-raised px-3 py-2 text-sm"
          >
            <span>Seat {i + 1}</span>
            <span className={seat ? "text-text" : "text-text-muted"}>
              {seat ? seat.nickname : "Waiting for a player..."}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
