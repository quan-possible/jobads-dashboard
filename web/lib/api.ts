// Typed client for the ACLMR API. `meta` and `overview` are the typed-JSON
// aggregates the UI reads directly. Charts come from the figure bridge, fetched
// server-side with cookie-aware capping by `figureServer` (lib/api.server.ts)
// and client-side by `fetchFigure` (lib/explore.ts); both reuse `API_BASE` here.

import type { Filters, Meta, OverviewResponse } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8530";

function qs(filters: Filters = {}, extra: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filters, ...extra })) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // Aggregates change only on refresh; revalidate hourly.
    next: { revalidate: 3600 },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  meta: () => get<Meta>(`/api/meta`),
  // `locale` localizes the server-built "key points" narrative (S05); scope
  // filters (if any) ride along in the query string.
  overview: (f?: Filters, locale: string = "en") =>
    get<OverviewResponse>(`/api/overview${qs(f, { locale })}`),
};
