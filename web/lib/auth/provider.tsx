"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStatus, login as apiLogin, logout as apiLogout } from "@/lib/explore";
import type { AuthStatus } from "@/lib/types";

// Site-wide auth state. One team session (the Explore password) is the single
// switch: when authenticated, the Explore tab is reachable AND every chart is
// served uncapped (full detail). Mounted once in the root layout so the top-nav
// login affordance and the Explore gate share one source of truth.
//
// After login/logout we call `router.refresh()` so the server components
// re-render: their figures are fetched server-side with (or without) the session
// cookie, so the initial paint already carries the right capped/uncapped view.

interface AuthValue {
  authenticated: boolean;
  configured: boolean;
  loading: boolean;
  /** authStatus() could not reach the access service. */
  error: boolean;
  /** Throws (AuthError) on a bad password so callers can show the message. */
  login: (password: string) => Promise<AuthStatus>;
  logout: () => Promise<void>;
  /** Flip back to locked locally (e.g. a mid-session 401) without a round-trip. */
  lock: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await authStatus();
      setAuthenticated(s.authenticated);
      setConfigured(s.configured);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the first status read until after the initial client paint. This
    // keeps the provider's loading transition explicit without a synchronous
    // state update from the effect body.
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const login = useCallback(
    async (password: string) => {
      const s = await apiLogin(password); // throws AuthError on a bad password
      setAuthenticated(s.authenticated);
      setConfigured(s.configured);
      setError(false);
      setLoading(false);
      router.refresh();
      return s;
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setAuthenticated(false);
      router.refresh();
    }
  }, [router]);

  const lock = useCallback(() => {
    setAuthenticated(false);
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ authenticated, configured, loading, error, login, logout, lock, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
