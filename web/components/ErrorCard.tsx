"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, type Locale } from "@/lib/i18n/locale";

// Route error boundaries render outside the i18n provider tree, so they can't use
// useI18n. They read the locale cookie directly and fall back to a bilingual copy
// table so a FR user sees a French error, not English (S11).
const COPY = {
  en: {
    eyebrow: "Something went wrong",
    retry: "Retry",
    titles: { view: "This view couldn’t load", explore: "Explore couldn’t load", page: "This page couldn’t load" },
    bodies: {
      service: "The data service may be unavailable. Confirm the API is running on port 8530, then try again.",
      generic: "An unexpected error occurred. Please try again.",
    },
  },
  fr: {
    eyebrow: "Une erreur s’est produite",
    retry: "Réessayer",
    titles: { view: "Cette vue n’a pas pu se charger", explore: "Explorer n’a pas pu se charger", page: "Cette page n’a pas pu se charger" },
    bodies: {
      service: "Le service de données est peut-être indisponible. Vérifiez que l’API tourne sur le port 8530, puis réessayez.",
      generic: "Une erreur inattendue s’est produite. Veuillez réessayer.",
    },
  },
} as const;

function readLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return normalizeLocale(m ? decodeURIComponent(m[1]) : null);
}

export function ErrorCard({
  reset,
  title,
  body = "service",
}: {
  reset: () => void;
  title: "view" | "explore" | "page";
  body?: "service" | "generic";
}) {
  // Read after mount to avoid a hydration mismatch; the error view is client-only.
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => setLocale(readLocale()), []);
  const c = COPY[locale];
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <div className="eyebrow mb-2">{c.eyebrow}</div>
        <h1 className="h-section mb-3">{c.titles[title]}</h1>
        <p className="mb-5 text-ink-soft">{c.bodies[body]}</p>
        <button
          type="button"
          onClick={reset}
          className="control border border-card-border px-4 py-2 t-meta font-bold uppercase tracking-[0.02em] text-navy transition-colors hover:border-orange hover:text-orange"
        >
          {c.retry}
        </button>
      </div>
    </div>
  );
}
