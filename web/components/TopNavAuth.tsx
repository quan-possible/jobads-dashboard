"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { useI18n } from "@/lib/i18n/provider";

// Authenticated sessions keep their site-wide team status and sign-out control
// in the top nav. Signed-out visitors enter through the visible Explore tab,
// whose page-level gate is the single password prompt.
export function TopNavAuth() {
  const { t } = useI18n();
  const a = t.nav.auth;
  const { authenticated, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  if (!authenticated) return null;

  return (
    <div className="relative flex items-center gap-2">
      <span
        className="hidden items-center gap-1.5 rounded-full border border-teal/60 bg-teal/15 px-2.5 py-1 t-caption font-bold uppercase tracking-[0.02em] text-teal-soft sm:inline-flex"
        title={a.fullDetail}
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-teal" />
        {a.teamView}
      </span>
      <button
        type="button"
        onClick={() => {
          setError(null);
          void logout().catch(() => setError(a.signOutFailed));
        }}
        className="cta-pill border border-white/30 px-3 py-1.5 t-caption font-bold uppercase tracking-[0.02em] text-ink-invert/75 transition-colors hover:border-orange hover:text-orange-soft"
      >
        {t.common.signOut}
      </button>
      {error && (
        <span
          role="alert"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 border border-neg/50 bg-navy-deep p-2.5 t-caption leading-snug text-neg shadow-pop"
        >
          {error}
        </span>
      )}
    </div>
  );
}
