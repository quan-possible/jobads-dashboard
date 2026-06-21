"use client";

import { useEffect, useState } from "react";
import { authStatus, AuthError, login, logout } from "@/lib/explore";
import { PixelTiles } from "@/components/PixelTiles";
import { ExploreView } from "./ExploreView";

type Phase = "checking" | "locked" | "unconfigured" | "open" | "error";

export function AuthGate() {
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
      setAuthError(err instanceof AuthError ? err.message : "Sign-in failed. Try again.");
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

  if (phase === "checking") {
    return (
      <div className="flex items-center justify-center py-24 text-[0.85rem] text-ink-faint">Checking access…</div>
    );
  }

  if (phase === "open") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSignOut}
            className="control border border-card-border px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.02em] text-ink-faint transition-colors hover:border-orange hover:text-orange"
          >
            Sign out
          </button>
        </div>
        <ExploreView />
      </div>
    );
  }

  // Locked / unconfigured / error all show a centered card.
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card card-pad">
        <div className="mb-5 flex items-center gap-3">
          <PixelTiles size={11} className="shrink-0" />
          <div>
            <div className="eyebrow text-orange">Protected</div>
            <h2 className="text-[1.1rem] font-bold leading-snug text-navy-deep">Posting-level lookup</h2>
          </div>
        </div>

        {phase === "unconfigured" && (
          <p className="text-[0.86rem] leading-relaxed text-ink-soft">
            Access control isn&rsquo;t configured on this server, so the private lookup is unavailable here. On the
            deployed dashboard this view is unlocked with the team password.
          </p>
        )}

        {phase === "error" && (
          <p className="text-[0.86rem] leading-relaxed text-neg">
            Couldn&rsquo;t reach the access service. Confirm the API is running, then reload.
          </p>
        )}

        {phase === "locked" && (
          <>
            <p className="mb-5 text-[0.86rem] leading-relaxed text-ink-soft">
              The individual job postings behind the aggregates are available to the team for verification. Enter the
              dashboard password to continue.
            </p>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Password</span>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="control border border-card-border bg-surface px-3 py-2 text-[0.92rem] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
                />
              </label>
              {authError && <p className="text-[0.78rem] text-neg">{authError}</p>}
              <button
                type="submit"
                disabled={submitting || !password}
                className="control bg-navy px-4 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.03em] text-canvas transition-colors enabled:hover:bg-orange disabled:opacity-50"
              >
                {submitting ? "Unlocking…" : "Unlock"}
              </button>
            </form>
          </>
        )}
      </div>
      <p className="mt-4 text-center text-[0.72rem] leading-relaxed text-ink-faint">
        Aggregated views need no sign-in. Only the raw posting lookup is gated.
      </p>
    </div>
  );
}
