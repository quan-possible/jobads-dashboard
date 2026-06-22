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

export interface GeoItem {
  code: string;
  label: string;
  value: number | null;
  count: number | null;
  yoy: number | null;
  per10k: number | null;
  lq: number | null;
  trend: number[] | null;
}

export interface GeographyResponse {
  scope: Scope;
  as_of: string;
  measure: string;
  items: GeoItem[];
}

export interface WageItem {
  code: string;
  label: string;
  p25: number | null;
  median: number | null;
  p75: number | null;
  n: number;
  gated: boolean;
}

export interface WagesResponse {
  scope: Scope;
  as_of: string;
  dim: string;
  min_sample: number;
  items: WageItem[];
}

export interface WageTrendPoint {
  month: string;
  p25: number;
  median: number;
  p75: number;
  n: number;
}

export interface WageTrendResponse {
  scope: Scope;
  as_of: string;
  min_sample: number;
  points: WageTrendPoint[];
}

export interface CompositionGroup {
  code: string;
  label: string;
  values: number[];
}

export interface CompositionResponse {
  scope: Scope;
  as_of: string;
  dim: string;
  months: string[];
  groups: CompositionGroup[];
}

export interface ConcentrationResponse {
  scope: Scope;
  as_of: string;
  dim: string;
  hhi: number;
  top5_share: number;
  n_groups: number;
}

export interface MatrixResponse {
  scope: Scope;
  as_of: string;
  measure: string;
  rows: string[];
  cols: string[];
  z: (number | null)[][];
  counts: (number | null)[][];
}

export interface CoverageTrendResponse {
  scope: Scope;
  field: string;
  months: string[];
  share: number[];
}

export interface GeoTrendResponse {
  scope: Scope;
  measure: string;
  months: string[];
  codes: string[];
  labels: string[];
  values: (number | null)[][];
}

export interface SkillItem {
  code: string;
  label: string;
  group: string | null;
  share: number;
  count: number;
  lift: number | null;
}

export interface SkillsResponse {
  scope: Scope;
  as_of: string;
  mode: string;
  n: number;
  items: SkillItem[];
}

export interface CategoryShare {
  category: string;
  label: string;
  count: number;
  share: number;
}

export interface RequirementsResponse {
  scope: Scope;
  as_of: string;
  n: number;
  remote: CategoryShare[];
  employment_type: CategoryShare[];
  education: CategoryShare[];
  experience: CategoryShare[];
  language: CategoryShare[];
}

export interface Filters {
  geo?: string;
  occ?: string;
  ind?: string;
  start?: string;
  end?: string;
  cmp?: string;
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
