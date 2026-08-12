// Browser-side client for the private Explore endpoints. These calls are
// credentialed (session cookie) and go through the relative `/api` path so the
// cookie is first-party (a Next rewrite proxies to the FastAPI backend).

import type { AuthStatus, FigJSON, Filters, OverviewResponse, PostingDetail, PostingsResponse } from "./types";

class AuthError extends Error {}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* keep default */
    }
    if (res.status === 401) throw new AuthError(detail);
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function authStatus(): Promise<AuthStatus> {
  const res = await fetch(`/api/auth`, { credentials: "same-origin", cache: "no-store" });
  return jsonOrThrow<AuthStatus>(res);
}

export async function login(password: string): Promise<AuthStatus> {
  const res = await fetch(`/api/auth`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return jsonOrThrow<AuthStatus>(res);
}

export async function logout(): Promise<AuthStatus> {
  const res = await fetch(`/api/auth/logout`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });
  return jsonOrThrow<AuthStatus>(res);
}

export interface PostingQuery extends Filters {
  q?: string;
  limit?: number;
  offset?: number;
}

function postingsQs(query: PostingQuery): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function fetchPostings(query: PostingQuery): Promise<PostingsResponse> {
  const res = await fetch(`/api/postings${postingsQs(query)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return jsonOrThrow<PostingsResponse>(res);
}

export async function fetchExploreOverview(filters: Filters, locale: string): Promise<OverviewResponse> {
  const p = new URLSearchParams({ locale });
  for (const [key, value] of Object.entries(filters)) {
    if (value) p.set(key, value);
  }
  const res = await fetch(`/api/overview?${p.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return jsonOrThrow<OverviewResponse>(res);
}

// The "Build a chart" figure. Explore is team-access, so this goes through the
// same credentialed relative path as the posting lookup: the session cookie
// rides along (first-party, via the Next rewrite) and a 401 surfaces as an
// AuthError so the gate can re-lock. Unlike the old public client this never
// silently swallows the error to null.
export async function fetchExploreFigure(
  params: Record<string, string | number | undefined>,
): Promise<FigJSON> {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  const res = await fetch(`/api/explore/figure${s ? `?${s}` : ""}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return jsonOrThrow<FigJSON>(res);
}

// Client-side figure fetch for the year-anchored charts (TunableFigure). It must
// use the relative `/api` proxied path with credentials so the httpOnly session
// cookie rides along first-party (the absolute `NEXT_PUBLIC_API_BASE` carries no
// cookie and isn't reachable behind the public proxy). Pass `full` from the auth
// context: the server still gates on a valid session, so `full=1` from a logged-
// out client is harmless. Resolves to null on failure so one chart degrades
// gracefully (matches the old public `figureSafe`).
export async function fetchFigure(
  id: string,
  locale: string,
  extra: Record<string, string | number | undefined> = {},
  full = false,
): Promise<FigJSON | null> {
  const p = new URLSearchParams();
  const all: Record<string, string | number | undefined> = { locale, ...extra };
  if (full) all.full = "1";
  for (const [k, v] of Object.entries(all)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  try {
    const res = await fetch(`/api/figure/${id}?${p.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as FigJSON;
  } catch {
    return null;
  }
}

export async function fetchPosting(id: string): Promise<PostingDetail> {
  const res = await fetch(`/api/postings/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return jsonOrThrow<PostingDetail>(res);
}

export { AuthError };
