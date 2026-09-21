"use client";

import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import type { TranslationKey } from "@/lib/client/i18n/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function GameHeader({ gameKey, subtitleKey }: { gameKey: string; subtitleKey?: TranslationKey }) {
  const { t } = useLanguage();

  return (
    <div className="mb-3 flex flex-shrink-0 items-center justify-between gap-3">
      <h1 className="font-heading text-base tracking-wide text-accent sm:text-lg">{t("app.title")}</h1>
      <div className="flex items-center gap-2">
        {subtitleKey && <span className="hidden text-xs text-text-muted sm:inline">{t(subtitleKey)}</span>}
        <span className="rounded border border-border bg-surface-raised px-2.5 py-1 font-heading text-xs tracking-[0.2em] text-text-muted">
          {gameKey}
        </span>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
