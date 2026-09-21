"use client";

import { useState } from "react";
import type { PublicGameState } from "@/lib/rules/types";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";

export function WaitingRoom({ gameKey, state }: { gameKey: string; state: PublicGameState }) {
  const { t } = useLanguage();
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
        <h2 className="font-heading text-lg tracking-wide text-accent">{t("waitingroom.title")}</h2>
        <p className="text-sm text-text-muted">
          {seatCount - 1 === 1
            ? t("waitingroom.shareKeyOne")
            : t("waitingroom.shareKeyMany", { n: seatCount - 1 })}
        </p>
      </div>

      <button
        type="button"
        onClick={copyKey}
        className="cursor-pointer rounded border border-accent bg-surface-raised px-4 py-3 text-center font-heading text-2xl tracking-[0.3em] text-accent transition-colors duration-150 hover:bg-accent/10"
        aria-label={t("waitingroom.copyAria")}
      >
        {gameKey}
        <span className="ml-3 text-xs font-body tracking-normal text-text-muted">
          {copied ? t("waitingroom.copied") : t("waitingroom.clickToCopy")}
        </span>
      </button>

      <ul className="flex flex-col gap-2">
        {seats.map((seat, i) => (
          <li
            key={i}
            className="flex items-center justify-between rounded border border-border bg-surface-raised px-3 py-2 text-sm"
          >
            <span>{t("waitingroom.seat", { n: i + 1 })}</span>
            <span className={seat ? "text-text" : "text-text-muted"}>
              {seat ? seat.nickname : t("waitingroom.waitingForPlayer")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
