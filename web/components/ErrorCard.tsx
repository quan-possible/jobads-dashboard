"use client";

import { useSyncExternalStore } from "react";
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
      service: "Try again shortly.",
      generic: "Try again.",
    },
  },
  fr: {
    eyebrow: "Une erreur s’est produite",
    retry: "Réessayer",
    titles: { view: "Cette vue n’a pas pu se charger", explore: "Explorer n’a pas pu se charger", page: "Cette page n’a pas pu se charger" },
    bodies: {
      service: "Réessayez dans quelques instants.",
      generic: "Réessayez.",
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
  // The server snapshot remains English for hydration; the client snapshot
  // reads the preference without a setState-in-effect update.
  const locale = useSyncExternalStore(
    () => () => undefined,
    readLocale,
    () => DEFAULT_LOCALE,
  );
  const c = COPY[locale];
  return (
    <div className="container-x py-24">
      <div className="mx-auto max-w-xl border-l-4 border-orange bg-surface-navy p-6 text-center text-ink-invert md:p-8">
        <div className="eyebrow mb-2 !text-orange-soft">{c.eyebrow}</div>
        <h1 className="h-section mb-3 !text-ink-invert">{c.titles[title]}</h1>
        <p className="mb-5 !text-ink-invert/75">{c.bodies[body]}</p>
        <button
          type="button"
          onClick={reset}
          className="control border border-orange/70 px-4 py-2 t-meta font-bold uppercase tracking-[0.02em] text-orange-soft transition-colors hover:border-orange hover:bg-orange hover:text-navy-deep"
        >
          {c.retry}
        </button>
      </div>
    </div>
  );
}
