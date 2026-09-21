"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "@/lib/client/localStorageKeys";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import { translateServerError } from "@/lib/client/i18n/translateServerError";

export function JoinGameForm({ initialGameKey = "" }: { initialGameKey?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [gameKey, setGameKey] = useState(initialGameKey);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const key = gameKey.trim().toUpperCase();
    try {
      const res = await fetch(`/api/games/${key}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ? translateServerError(body.error, t) : t("error.couldNotJoin"));
        return;
      }
      saveToken(key, body.reconnectToken);
      router.push(`/g/${key}`);
    } catch {
      setError(t("error.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="font-heading text-lg tracking-wide text-accent">{t("home.join.title")}</h2>

      <label className="flex flex-col gap-1 text-sm">
        {t("home.join.keyLabel")}
        <input
          value={gameKey}
          onChange={(e) => setGameKey(e.target.value)}
          maxLength={6}
          required
          placeholder={t("home.join.keyPlaceholder")}
          className="rounded border border-border bg-surface-raised px-3 py-2 uppercase tracking-widest text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("home.join.nicknameLabel")}
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={24}
          required
          placeholder={t("home.join.nicknamePlaceholder")}
          className="rounded border border-border bg-surface-raised px-3 py-2 text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="cursor-pointer rounded border border-accent px-4 py-2 font-heading text-sm tracking-wide text-accent transition-colors duration-150 hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t("home.join.submitting") : t("home.join.submit")}
      </button>
    </form>
  );
}
