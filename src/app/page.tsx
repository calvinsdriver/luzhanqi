"use client";

import { CreateGameForm } from "@/components/home/CreateGameForm";
import { JoinGameForm } from "@/components/join/JoinGameForm";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/lib/client/i18n/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-2 flex items-center justify-center gap-3">
          <h1 className="text-center font-heading text-3xl tracking-wide text-accent sm:text-4xl">
            {t("app.title")}
          </h1>
        </div>
        <div className="mb-6 flex justify-center">
          <LanguageSwitcher />
        </div>
        <p className="mb-8 text-center text-sm text-text-muted">{t("app.tagline")}</p>

        <div className="grid gap-6 sm:grid-cols-2">
          <CreateGameForm />
          <JoinGameForm />
        </div>
      </div>
    </div>
  );
}
