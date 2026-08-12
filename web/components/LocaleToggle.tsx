"use client";

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

const ONE_YEAR = 60 * 60 * 24 * 365;

function persistLocale(next: Locale) {
  // Cookie persistence is an intentional write to browser-owned state.
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function LocaleToggle({ inverted = false }: { inverted?: boolean }) {
  const { locale, t } = useI18n();

  const choose = (next: Locale) => {
    if (next === locale) return;
    persistLocale(next);
    // Re-render the whole server tree under the new locale. A full reload is the
    // most reliable way to re-read the locale cookie across server + client.
    window.location.reload();
  };

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={`control flex shrink-0 overflow-hidden border t-caption font-bold uppercase tracking-[0.04em] ${inverted ? "border-white/30" : "border-card-border"}`}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            aria-pressed={active}
            className={[
              "px-2 py-1 transition-colors",
              active
                ? inverted
                  ? "bg-ink-invert text-navy-deep"
                  : "bg-navy text-canvas"
                : inverted
                  ? "text-ink-invert/65 hover:text-ink-invert"
                  : "text-ink-soft hover:text-orange-deep",
            ].join(" ")}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
