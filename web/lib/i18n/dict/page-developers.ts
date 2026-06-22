// Static UI copy + API-reference content for app/developers/page.tsx.
// Param names, types, and endpoint paths are code (not translated); their
// descriptions and the page chrome are localized (S19).

type Param = { name: string; type: string; desc: string };
type Endpoint = { method: "GET"; path: string; purpose: string; params: Param[] };

function scopeParams(d: {
  geo: string;
  occ: string;
  ind: string;
  start: string;
  end: string;
}): Param[] {
  return [
    { name: "geo", type: "string", desc: d.geo },
    { name: "occ", type: "string", desc: d.occ },
    { name: "ind", type: "string", desc: d.ind },
    { name: "start", type: "YYYY-MM", desc: d.start },
    { name: "end", type: "YYYY-MM", desc: d.end },
  ];
}

const EN_SCOPE = scopeParams({
  geo: 'Province code (e.g. "ON") or "All Canada".',
  occ: 'NOC broad code and label (e.g. "6 | Sales and service") or "All occupations".',
  ind: 'NAICS code and label (e.g. "62 | Health care") or "All industries".',
  start: "Start month of the data window (inclusive).",
  end: "End month of the data window (inclusive).",
});

const FR_SCOPE = scopeParams({
  geo: "Code de province (p. ex. « ON ») ou « All Canada ».",
  occ: "Code et libellé CNP large (p. ex. « 6 | Vente et services ») ou « All occupations ».",
  ind: "Code et libellé SCIAN (p. ex. « 62 | Soins de santé ») ou « All industries ».",
  start: "Mois de début de la fenêtre de données (inclus).",
  end: "Mois de fin de la fenêtre de données (inclus).",
});

const EN_ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/meta", purpose: "Dataset metadata: date window, total posting count, field coverage rates, caveats, and glossary.", params: [] },
  { method: "GET", path: "/api/overview", purpose: "High-level snapshot of posting demand for the active scope: current level, YoY change, and context.", params: EN_SCOPE },
  {
    method: "GET", path: "/api/series/postings", purpose: "Monthly time series of posting demand.",
    params: [{ name: "metric", type: '"index" | "level" | "yoy"', desc: "Demand index (Jan 2019 = 100), raw posting count, or year-over-year % change. Required." }, ...EN_SCOPE],
  },
  {
    method: "GET", path: "/api/rank/{dim}", purpose: "Ranked list of occupations or industries by posting volume or YoY growth.",
    params: [
      { name: "dim", type: '"occupations" | "industries"', desc: "Dimension to rank (path param). Required." },
      { name: "limit", type: "integer", desc: "Number of rows to return. Default: 10." },
      { name: "order", type: '"value" | "yoy"', desc: 'Sort by posting volume or year-over-year change. Default: "value".' },
      ...EN_SCOPE,
    ],
  },
  {
    method: "GET", path: "/api/geography", purpose: "Posting intensity by province using the chosen geographic measure.",
    params: [{ name: "measure", type: '"per10k" | "lq" | "count"', desc: "Postings per 10k labour-force, location quotient, or raw count. Required." }, ...EN_SCOPE],
  },
  {
    method: "GET", path: "/api/wages", purpose: "Posted wage percentiles (p25 / median / p75) broken down by the chosen dimension.",
    params: [{ name: "dim", type: '"occupation" | "province" | "overall"', desc: "Breakdown dimension. Required." }, ...EN_SCOPE],
  },
  {
    method: "GET", path: "/api/skills", purpose: "Top or distinctive skills mentioned in postings within the active scope.",
    params: [
      { name: "mode", type: '"top" | "distinctive"', desc: 'Most frequent skills ("top") or skills with high lift vs. Canada ("distinctive"). Required.' },
      { name: "limit", type: "integer", desc: "Number of skills to return. Default: 20." },
      ...EN_SCOPE,
    ],
  },
  { method: "GET", path: "/api/requirements", purpose: "Share of postings specifying remote/hybrid work, education, or experience requirements.", params: EN_SCOPE },
];

const FR_ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/meta", purpose: "Métadonnées du jeu de données : fenêtre temporelle, nombre total d’offres, taux de couverture des champs, mises en garde et glossaire.", params: [] },
  { method: "GET", path: "/api/overview", purpose: "Aperçu de la demande d’offres pour la portée active : niveau actuel, variation sur un an et contexte.", params: FR_SCOPE },
  {
    method: "GET", path: "/api/series/postings", purpose: "Série mensuelle de la demande d’offres.",
    params: [{ name: "metric", type: '"index" | "level" | "yoy"', desc: "Indice de demande (janv. 2019 = 100), nombre brut d’offres, ou variation en % sur un an. Obligatoire." }, ...FR_SCOPE],
  },
  {
    method: "GET", path: "/api/rank/{dim}", purpose: "Liste classée des professions ou industries par volume d’offres ou croissance sur un an.",
    params: [
      { name: "dim", type: '"occupations" | "industries"', desc: "Dimension à classer (paramètre de chemin). Obligatoire." },
      { name: "limit", type: "integer", desc: "Nombre de lignes à retourner. Défaut : 10." },
      { name: "order", type: '"value" | "yoy"', desc: "Trier par volume d’offres ou variation sur un an. Défaut : « value »." },
      ...FR_SCOPE,
    ],
  },
  {
    method: "GET", path: "/api/geography", purpose: "Intensité des offres par province selon la mesure géographique choisie.",
    params: [{ name: "measure", type: '"per10k" | "lq" | "count"', desc: "Offres par 10k de population active, quotient de localisation, ou nombre brut. Obligatoire." }, ...FR_SCOPE],
  },
  {
    method: "GET", path: "/api/wages", purpose: "Percentiles des salaires affichés (p25 / médiane / p75) ventilés selon la dimension choisie.",
    params: [{ name: "dim", type: '"occupation" | "province" | "overall"', desc: "Dimension de ventilation. Obligatoire." }, ...FR_SCOPE],
  },
  {
    method: "GET", path: "/api/skills", purpose: "Compétences les plus fréquentes ou distinctives mentionnées dans les offres de la portée active.",
    params: [
      { name: "mode", type: '"top" | "distinctive"', desc: "Compétences les plus fréquentes (« top ») ou à fort indice vs le Canada (« distinctive »). Obligatoire." },
      { name: "limit", type: "integer", desc: "Nombre de compétences à retourner. Défaut : 20." },
      ...FR_SCOPE,
    ],
  },
  { method: "GET", path: "/api/requirements", purpose: "Part des offres précisant le télétravail/hybride, la scolarité ou l’expérience exigée.", params: FR_SCOPE },
];

export const developersDict = {
  en: {
    metaTitle: "Developers",
    metaDescription: "Public JSON API over the ACLMR labour-market aggregates.",
    eyebrow: "Developers",
    title: "Public data API",
    ledeIntro: "Typed JSON over the ACLMR labour-market aggregates. Read-only and CORS-enabled. Base URL:",
    ledeDocsBefore: "Interactive OpenAPI docs are available at",
    docsLabel: "/api/docs",
    scopeEyebrow: "Shared parameters",
    scopeTitle: "Scope parameters",
    scopeDesc: "Every endpoint that filters data accepts these five shared scope params. Omit any to use the default (all of Canada, all occupations/industries, trailing 12 months).",
    thParam: "Param",
    thType: "Type",
    thDescription: "Description",
    endpointsEyebrow: "Reference",
    endpointsTitle: "Endpoints",
    accessEyebrow: "Access",
    accessTitle: "Aggregate data only",
    accessBody: "These endpoints expose pre-aggregated statistics. The posting-level Explore dataset is private and not part of the public API. No authentication is required for the endpoints listed above.",
    scopeParams: EN_SCOPE,
    endpoints: EN_ENDPOINTS,
  },
  fr: {
    metaTitle: "Développeurs",
    metaDescription: "API JSON publique sur les agrégats du marché du travail de l’ACLMR.",
    eyebrow: "Développeurs",
    title: "API de données publique",
    ledeIntro: "JSON typé sur les agrégats du marché du travail de l’ACLMR. En lecture seule et compatible CORS. URL de base :",
    ledeDocsBefore: "La documentation OpenAPI interactive est disponible à",
    docsLabel: "/api/docs",
    scopeEyebrow: "Paramètres partagés",
    scopeTitle: "Paramètres de portée",
    scopeDesc: "Chaque endpoint qui filtre des données accepte ces cinq paramètres de portée partagés. Omettez-en un pour utiliser la valeur par défaut (tout le Canada, toutes les professions/industries, 12 derniers mois).",
    thParam: "Paramètre",
    thType: "Type",
    thDescription: "Description",
    endpointsEyebrow: "Référence",
    endpointsTitle: "Endpoints",
    accessEyebrow: "Accès",
    accessTitle: "Données agrégées seulement",
    accessBody: "Ces endpoints exposent des statistiques pré-agrégées. Le jeu de données Explorer au niveau des offres est privé et ne fait pas partie de l’API publique. Aucune authentification n’est requise pour les endpoints ci-dessus.",
    scopeParams: FR_SCOPE,
    endpoints: FR_ENDPOINTS,
  },
} as const;
