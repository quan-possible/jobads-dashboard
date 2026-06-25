// Typed client for the ACLMR API. Used from server components (default) and,
// where interactivity needs it, from client components. The dashboard renders
// its charts through the figure bridge (`api.figure`); `meta` and `overview`
// are the only typed-JSON aggregates the UI still reads directly.

import type { Filters, Meta, OverviewResponse, FigJSON } from "./types";

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
  // Figure bridge: a redesign2 Plotly factory rendered to figure JSON. `extra`
  // carries optional params the year-anchored charts accept (base_year/end_year),
  // so a client component can re-fetch the same chart for a user-chosen window.
  figure: (id: string, locale: string, extra: Record<string, string | number | undefined> = {}) =>
    get<FigJSON>(`/api/figure/${id}${qs({}, { locale, ...extra })}`),
  // Resilient variant: a single failed figure resolves to null so one bad chart
  // degrades to a per-figure fallback instead of throwing the whole route (S23).
  figureSafe: (id: string, locale: string, extra: Record<string, string | number | undefined> = {}): Promise<FigJSON | null> =>
    get<FigJSON>(`/api/figure/${id}${qs({}, { locale, ...extra })}`).catch(() => null),
  // The Explore "Build a chart" figure is team-access, so it is fetched
  // credentialed from the browser (see `fetchExploreFigure` in lib/explore.ts),
  // not through this public typed client.
};
