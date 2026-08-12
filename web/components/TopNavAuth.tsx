"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/provider";
import { AuthError } from "@/lib/explore";
import { useI18n } from "@/lib/i18n/provider";

// Site-wide team login, in the top nav. Logged out (and access is configured):
// a "Team log in" button opens a small password popover. Logged in: a status
// chip plus sign-out. A valid session both unlocks the Explore tab and serves
// every chart uncapped, so this control lives globally, not just inside Explore.
export function TopNavAuth() {
  const { t } = useI18n();
  const a = t.nav.auth;
  const { authenticated, configured, loading, login, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close the popover on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // While the first auth check is in flight, or when access control isn't
  // configured on this server, show nothing — there's no login to offer.
  if (loading || !configured) return null;

  if (authenticated) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-teal/60 bg-teal/15 px-2.5 py-1 t-caption font-bold uppercase tracking-[0.02em] text-teal-soft sm:inline-flex"
          title={a.fullDetail}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-teal" />
          {a.teamView}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          className="cta-pill border border-white/30 px-3 py-1.5 t-caption font-bold uppercase tracking-[0.02em] text-ink-invert/75 transition-colors hover:border-orange hover:text-orange-soft"
        >
          {t.common.signOut}
        </button>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      setPassword("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : t.explore.signinFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={[
          "auth-pill px-3 py-1.5 t-caption font-bold uppercase tracking-[0.02em] transition-colors",
          open
            ? "text-orange-soft"
            : "text-orange-soft hover:text-ink-invert",
        ].join(" ")}
      >
        {a.logIn}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={a.title}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-md border border-white/20 bg-navy-deep p-4 text-ink-invert shadow-pop"
        >
          <div className="eyebrow mb-1">{a.title}</div>
          <p className="mb-3 t-caption leading-relaxed text-ink-invert/70">{a.blurb}</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="t-label font-bold uppercase tracking-[0.05em] text-ink-invert/60">
                {t.explore.password}
              </span>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="control border border-white/30 bg-white/10 px-3 py-2 t-body text-ink-invert focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
              />
            </label>
            {error && <p className="t-meta text-neg">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !password}
              className="cta-pill bg-orange px-4 py-2.5 t-meta font-bold uppercase tracking-[0.03em] text-white transition-colors enabled:hover:bg-sand enabled:hover:text-navy-deep disabled:opacity-50"
            >
              {submitting ? t.explore.unlocking : a.signIn}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
