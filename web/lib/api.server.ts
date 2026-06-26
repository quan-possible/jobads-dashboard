// Server-only figure fetcher. Pages render their charts here, on the server, so
// the initial paint already carries the right view:
//
// - Public (no session cookie): the cached, capped figure — the 10-category
//   public contract, deduped across requests by the Next Data Cache (1h).
// - Team (valid session cookie present): the cookie is forwarded to the API with
//   `full=1` and `cache: "no-store"`, so the figure comes back uncapped and is
//   never shared with a public cache entry. The API still recomputes
//   `uncapped = full AND authed`, so a forwarded-but-invalid cookie falls back to
//   the capped view — the flag alone can never lift the cap.
//
// `cookies()` is a request-time API (opts the route into dynamic rendering); every
// page here is already `force-dynamic`, so this adds no static-render cost.

import "server-only";
import { cookies } from "next/headers";
import { API_BASE } from "./api";
import type { FigJSON } from "./types";

// Must match api/auth.py COOKIE_NAME.
const SESSION_COOKIE = "jobads_session";

function qs(extra: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function figureServer(
  id: string,
  locale: string,
  extra: Record<string, string | number | undefined> = {},
): Promise<FigJSON | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const authed = Boolean(token);

  const params: Record<string, string | number | undefined> = { locale, ...extra };
  if (authed) params.full = "1";

  const init: RequestInit = authed
    ? { headers: { cookie: `${SESSION_COOKIE}=${token}` }, cache: "no-store" }
    : { next: { revalidate: 3600 } };

  try {
    const res = await fetch(`${API_BASE}/api/figure/${id}${qs(params)}`, init);
    if (!res.ok) return null;
    return (await res.json()) as FigJSON;
  } catch {
    return null;
  }
}
