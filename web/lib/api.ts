// Typed client for the ACLMR API. Used from server components (default) and,
// where interactivity needs it, from client components.

import type {
  Filters,
  GeographyResponse,
  Meta,
  OverviewResponse,
  RequirementsResponse,
  SeriesPoint,
  SkillsResponse,
  WagesResponse,
  WageTrendResponse,
  CompositionResponse,
  ConcentrationResponse,
  MatrixResponse,
  CoverageTrendResponse,
  GeoTrendResponse,
  RankItem,
} from "./types";

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
  overview: (f?: Filters) => get<OverviewResponse>(`/api/overview${qs(f)}`),
  series: (f?: Filters, metric: string = "index") =>
    get<SeriesPoint[]>(`/api/series/postings${qs(f, { metric })}`),
  rank: (dim: "occupations" | "industries", f?: Filters, opts: { limit?: number; order?: string } = {}) =>
    get<RankItem[]>(`/api/rank/${dim}${qs(f, { limit: opts.limit, order: opts.order })}`),
  geography: (f?: Filters, measure: string = "per10k") =>
    get<GeographyResponse>(`/api/geography${qs(f, { measure })}`),
  wages: (f?: Filters, dim: string = "occupation") =>
    get<WagesResponse>(`/api/wages${qs(f, { dim })}`),
  wageTrend: (f?: Filters) => get<WageTrendResponse>(`/api/wages/trend${qs(f)}`),
  composition: (dim: "occupations" | "industries", f?: Filters) =>
    get<CompositionResponse>(`/api/composition/${dim}${qs(f)}`),
  concentration: (dim: "occupations" | "industries", f?: Filters) =>
    get<ConcentrationResponse>(`/api/concentration/${dim}${qs(f)}`),
  matrixOccProvince: (f?: Filters, measure: string = "lq") =>
    get<MatrixResponse>(`/api/matrix/occ-province${qs(f, { measure })}`),
  coverageTrend: (f?: Filters, field: string = "naics") =>
    get<CoverageTrendResponse>(`/api/coverage/trend${qs(f, { field })}`),
  geographyTrend: (f?: Filters) => get<GeoTrendResponse>(`/api/geography/trend${qs(f)}`),
  skills: (f?: Filters, opts: { mode?: string; limit?: number } = {}) =>
    get<SkillsResponse>(`/api/skills${qs(f, { mode: opts.mode, limit: opts.limit })}`),
  requirements: (f?: Filters) => get<RequirementsResponse>(`/api/requirements${qs(f)}`),
};
