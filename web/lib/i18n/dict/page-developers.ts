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
  geo: 'Code de province (p. ex. « ON ») ou valeur API "All Canada".',
  occ: 'Code et libellé CNP (p. ex. « 6 | Vente et services ») ou valeur API "All occupations".',
  ind: 'Code et libellé SCIAN (p. ex. « 62 | Soins de santé ») ou valeur API "All industries".',
  start: "Mois de début de la fenêtre de données (inclus).",
  end: "Mois de fin de la fenêtre de données (inclus).",
});

const EN_ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/meta", purpose: "Dataset metadata: date window, total posting count, field coverage rates, caveats, and glossary.", params: [] },
  { method: "GET", path: "/api/overview", purpose: "High-level snapshot of postings for the active scope: current level, YoY change, and context.", params: EN_SCOPE },
];

const FR_ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/meta", purpose: "Métadonnées du jeu de données : fenêtre temporelle, nombre total d’offres, taux de couverture des champs, mises en garde et glossaire.", params: [] },
  { method: "GET", path: "/api/overview", purpose: "Aperçu des offres pour la portée active : niveau actuel, variation sur un an et contexte.", params: FR_SCOPE },
];

export const developersDict = {
  en: {
    metaTitle: "Developers",
    metaDescription: "Public JSON API over the ACLMR labour-market aggregates.",
    eyebrow: "Developers",
    title: "Public data API",
    ledeIntro: "Read-only JSON for ACLMR labour-market aggregates. Base URL:",
    ledeDocsBefore: "OpenAPI documentation:",
    docsLabel: "/api/docs",
    scopeEyebrow: "Shared parameters",
    scopeTitle: "Scope parameters",
    scopeDesc: "Omitted parameters default to Canada, all occupations and industries, and the latest 12 months.",
    thParam: "Param",
    thType: "Type",
    thDescription: "Description",
    endpointsEyebrow: "Reference",
    endpointsTitle: "Endpoints",
    accessEyebrow: "Access",
    accessTitle: "Aggregate data only",
    accessBody: "No authentication is required. Posting-level Explore data remain private.",
    scopeParams: EN_SCOPE,
    endpoints: EN_ENDPOINTS,
  },
  fr: {
    metaTitle: "Développeurs",
    metaDescription: "API JSON publique sur les agrégats du marché du travail de l’ACLMR.",
    eyebrow: "Développeurs",
    title: "API de données publique",
    ledeIntro: "JSON en lecture seule pour les agrégats du marché du travail de l’ACLMR. URL de base :",
    ledeDocsBefore: "Documentation OpenAPI :",
    docsLabel: "/api/docs",
    scopeEyebrow: "Paramètres partagés",
    scopeTitle: "Paramètres de portée",
    scopeDesc: "Les paramètres omis utilisent le Canada, toutes les professions et industries, et les 12 derniers mois.",
    thParam: "Paramètre",
    thType: "Type",
    thDescription: "Description",
    endpointsEyebrow: "Référence",
    endpointsTitle: "Points de terminaison",
    accessEyebrow: "Accès",
    accessTitle: "Données agrégées seulement",
    accessBody: "Aucune authentification n’est requise. Les données Explorer au niveau des offres restent privées.",
    scopeParams: FR_SCOPE,
    endpoints: FR_ENDPOINTS,
  },
} as const;
