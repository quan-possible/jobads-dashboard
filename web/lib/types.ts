// Response types mirroring the FastAPI Pydantic contract (api/models.py).

export interface Scope {
  geo: string;
  occ: string;
  ind: string;
  start: string;
  end: string;
}

export interface CoverageItem {
  field: string;
  label: string;
  postings: number;
  share: number;
}

export interface Meta {
  generated_at_utc: string;
  source_window: { min_date: string; max_date: string };
  postings_total: number;
  coverage: CoverageItem[];
  caveats: string[];
  latest_month: string;
  earliest_month: string;
  index_base_month: string;
}

export interface SeriesPoint {
  month: string;
  postings: number;
  index: number | null;
  yoy: number | null;
  series?: string | null;
}

export interface Kpis {
  demand_index: number | null;
  demand_index_mom: number | null;
  active_postings: number | null;
  active_mom_pct: number | null;
  active_yoy_pct: number | null;
  median_wage: number | null;
  wage_n: number | null;
  median_wage_trend: number[] | null;
  posting_intensity: number | null;
  postings_new: number | null;
}

export interface RankItem {
  code: string;
  label: string;
  value: number;
  yoy: number | null;
  share: number | null;
  trend: number[] | null;
}

export interface OverviewResponse {
  scope: Scope;
  as_of: string;
  kpis: Kpis;
  series: SeriesPoint[];
  key_points: string[];
  top_growing: RankItem[];
  top_cooling: RankItem[];
}

export interface Filters {
  geo?: string;
  occ?: string;
  ind?: string;
}

// --- Figure bridge (Plotly factories served as figure JSON) ---
// The Python factories own the figure shape; the front-end draws it verbatim, so
// data/layout/frames are intentionally opaque (Plotly's own contract).
export interface FigJSON {
  data: unknown[];
  layout: Record<string, unknown>;
  frames?: unknown[];
}

// --- Private Explore (posting-level lookup) ---

export interface AuthStatus {
  authenticated: boolean;
  configured: boolean;
}

export interface PostingRow {
  posting_id: string;
  month: string;
  date_found: string | null;
  job_title: string | null;
  employer: string | null;
  province: string | null;
  market: string | null;
  occupation: string | null;
  industry: string | null;
  wage_hourly: number | null;
  wage_min: number | null;
  wage_max: number | null;
  employment_type: string | null;
  remote_class: string | null;
  has_description: boolean;
}

export interface PostingsResponse {
  scope: Scope;
  total: number;
  limit: number;
  offset: number;
  items: PostingRow[];
}

export interface PostingDetail extends PostingRow {
  noc_code: string | null;
  noc_label: string | null;
  naics_code: string | null;
  naics_label: string | null;
  wage_unit: string | null;
  duration: string | null;
  experience: string | null;
  experience_details: string | null;
  education: string | null;
  primary_posting_language: string | null;
  data_source: string | null;
  description_full: string | null;
}
