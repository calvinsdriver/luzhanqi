"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "@/lib/client/localStorageKeys";

export function CreateGameForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [mode, setMode] = useState<"2p" | "4p">("2p");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, nickname }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create the game");
        return;
      }
      saveToken(body.gameKey, body.reconnectToken);
      router.push(`/g/${body.gameKey}`);
    } catch {
      setError("Network error - please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="font-heading text-lg tracking-wide text-accent">Start a new game</h2>

      <label className="flex flex-col gap-1 text-sm">
        Your nickname
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={24}
          required
          placeholder="Commander"
          className="rounded border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1">Players</legend>
        <div className="flex gap-3">
          {(["2p", "4p"] as const).map((value) => (
            <label
              key={value}
              className={`flex-1 cursor-pointer rounded border px-3 py-2 text-center transition-colors duration-150 ${
                mode === value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface-raised text-text-muted"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="sr-only"
              />
              {value === "2p" ? "2 Players" : "4 Players"}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="cursor-pointer rounded bg-accent px-4 py-2 font-heading text-sm tracking-wide text-background transition-colors duration-150 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create Game"}
      </button>
    </form>
  );
}
