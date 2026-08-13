"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { useI18n } from "@/lib/i18n/provider";
import { PixelTiles } from "@/components/PixelTiles";
import { ExploreLockContext } from "./lockContext";
import styles from "./explore.module.css";

// Wraps the whole Explore surface (both the "Build a chart" and "Find postings"
// tabs). Until a valid session exists, `children` are never rendered — the
// password card stands in their place — so the entire tab is team-access, not
// just the posting lookup. Auth state is the site-wide one (see AuthProvider):
// the same session that unlocks Explore here also serves every chart uncapped.
// Descendants re-lock on a mid-session 401 through ExploreLockContext.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { authenticated, configured, loading, error, login, lock } = useAuth();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      await login(password);
      setPassword("");
    } catch {
      setAuthError(t.explore.signinFailed);
    } finally {
      setSubmitting(false);
    }
  };

  if (authenticated) {
    return (
      <ExploreLockContext.Provider value={lock}>
        {children}
      </ExploreLockContext.Provider>
    );
  }

  // Checking / locked / unconfigured / error all share one centered card shell
  // so the non-open phases read as designed, not as unfinished text (U09).
  return (
    <div className={styles.gateWrap}>
      <div className={styles.gateCard}>
        <div className="mb-5 flex items-center gap-3">
          <PixelTiles size={11} className="shrink-0" />
          <div>
            <div className={styles.eyebrow}>{t.explore.protected}</div>
            <h2 className={styles.gateHeading}>{t.explore.lookupTitle}</h2>
          </div>
        </div>

        {loading && (
          <p className={styles.gateMessage} aria-busy="true">{t.explore.checking}</p>
        )}

        {!loading && error && <p className={`${styles.gateMessage} ${styles.gateError}`}>{t.explore.authError}</p>}

        {!loading && !error && !configured && (
          <p className={styles.gateMessage}>{t.explore.unconfigured}</p>
        )}

        {!loading && !error && configured && (
          <>
            <p className={styles.gateBody}>{t.explore.lockedBody}</p>
            <form onSubmit={onSubmit} className={styles.gateForm}>
              <label className={styles.gateLabel}>
                <span>{t.explore.password}</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.gateInput}
                />
              </label>
              {authError && <p className={`${styles.gateMessage} ${styles.gateError}`}>{authError}</p>}
              <button
                type="submit"
                disabled={submitting || !password}
                className={styles.gateButton}
              >
                {submitting ? t.explore.unlocking : t.explore.unlock}
              </button>
            </form>
          </>
        )}
      </div>
      <p className={styles.gateHint}>{t.explore.gateHint}</p>
    </div>
  );
}
