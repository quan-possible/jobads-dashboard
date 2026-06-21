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
  posting_intensity: number | null;
  postings_new: number | null;
}

export interface RankItem {
  code: string;
  label: string;
  value: number;
  yoy: number | null;
  share: number | null;
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
