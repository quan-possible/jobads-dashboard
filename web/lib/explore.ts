// Browser-side client for the private Explore endpoints. These calls are
// credentialed (session cookie) and go through the relative `/api` path so the
// cookie is first-party (a Next rewrite proxies to the FastAPI backend).

import type { AuthStatus, Filters, PostingDetail, PostingsResponse } from "./types";

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

export async function fetchPosting(id: string): Promise<PostingDetail> {
  const res = await fetch(`/api/postings/${encodeURIComponent(id)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return jsonOrThrow<PostingDetail>(res);
}

export { AuthError };
