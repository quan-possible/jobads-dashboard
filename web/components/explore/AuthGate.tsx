"use client";

import { useEffect, useState } from "react";
import { authStatus, AuthError, login, logout } from "@/lib/explore";
import { useI18n } from "@/lib/i18n/provider";
import { PixelTiles } from "@/components/PixelTiles";
import { ExploreLockContext } from "./lockContext";

type Phase = "checking" | "locked" | "unconfigured" | "open" | "error";

// Wraps the whole Explore surface (both the "Build a chart" and "Find postings"
// tabs). Until a valid session exists, `children` are never rendered — the
// password card stands in their place — so the entire tab is team-access, not
// just the posting lookup. Descendants re-lock on a mid-session 401 through
// ExploreLockContext.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authStatus()
      .then((s) => {
        if (cancelled) return;
        if (s.authenticated) setPhase("open");
        else if (!s.configured) setPhase("unconfigured");
        else setPhase("locked");
      })
      .catch(() => !cancelled && setPhase("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      await login(password);
      setPassword("");
      setPhase("open");
    } catch (err) {
      setAuthError(err instanceof AuthError ? err.message : t.explore.signinFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const onSignOut = async () => {
    try {
      await logout();
    } catch {
      /* clear locally regardless */
    }
    setPhase("locked");
  };

  if (phase === "open") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSignOut}
            className="control border border-card-border px-3 py-1.5 t-caption font-bold uppercase tracking-[0.02em] text-ink-faint transition-colors hover:border-orange hover:text-orange"
          >
            {t.common.signOut}
          </button>
        </div>
        <ExploreLockContext.Provider value={() => setPhase("locked")}>
          {children}
        </ExploreLockContext.Provider>
      </div>
    );
  }

  // Checking / locked / unconfigured / error all share one centered card shell
  // so the non-open phases read as designed, not as unfinished text (U09).
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card card-pad">
        <div className="mb-5 flex items-center gap-3">
          <PixelTiles size={11} className="shrink-0" />
          <div>
            <div className="eyebrow">{t.explore.protected}</div>
            <h2 className="text-[1.1rem] font-bold leading-snug text-navy-deep">{t.explore.lookupTitle}</h2>
          </div>
        </div>

        {phase === "checking" && (
          <p className="t-body-sm leading-relaxed text-ink-faint" aria-busy="true">{t.explore.checking}</p>
        )}

        {phase === "unconfigured" && (
          <p className="t-body-sm leading-relaxed text-ink-soft">{t.explore.unconfigured}</p>
        )}

        {phase === "error" && <p className="t-body-sm leading-relaxed text-neg">{t.explore.authError}</p>}

        {phase === "locked" && (
          <>
            <p className="mb-5 t-body-sm leading-relaxed text-ink-soft">{t.explore.lockedBody}</p>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="t-label font-bold uppercase tracking-[0.05em] text-ink-faint">
                  {t.explore.password}
                </span>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="control border border-card-border bg-surface px-3 py-2 t-body focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
                />
              </label>
              {authError && <p className="t-meta text-neg">{authError}</p>}
              <button
                type="submit"
                disabled={submitting || !password}
                className="control bg-navy px-4 py-2.5 t-meta font-bold uppercase tracking-[0.03em] text-canvas transition-colors enabled:hover:bg-orange disabled:opacity-50"
              >
                {submitting ? t.explore.unlocking : t.explore.unlock}
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-4 text-center t-caption leading-relaxed text-ink-faint">{t.explore.gateHint}</p>
    </div>
  );
}
