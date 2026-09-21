"use client";

import { useLanguage } from "@/lib/client/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/client/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded border border-border bg-surface-raised p-0.5 text-xs"
    >
      {LANGUAGES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLang(value)}
          aria-pressed={lang === value}
          className={`cursor-pointer rounded px-2 py-1 font-heading tracking-wide transition-colors duration-150 ${
            lang === value ? "bg-accent text-background" : "text-text-muted hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
