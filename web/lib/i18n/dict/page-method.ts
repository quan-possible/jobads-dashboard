// Self-contained EN/FR dictionary for app/method/page.tsx.
// Keep in sync with that page only — do NOT wire this into the central dict.
// API-returned coverage and caveat identifiers are localized here at the
// presentation boundary; unknown future values deliberately fall back to the
// server text instead of disappearing.

export const methodDict = {
  en: {
    // ApiDown fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Hero
    heroEyebrow: "Method & data",
    heroTitle: "Dashboard methodology",
    heroIntro: "Sources, measures and limitations.",

    // What it measures
    measuresTitle: "Measures",
    measuresItems: [
      "Monthly postings by region, occupation, and industry",
      "Advertised wage ranges",
      "Skills and requirements named in postings",
    ],

    // What it does NOT measure
    notMeasuresTitle: "Not measured",
    notMeasuresItems: [
      "Employment or unemployment",
      "Statistics Canada job vacancies",
      "Actual hires",
      "Open positions: one ad may represent zero, one or several jobs",
    ],

    // Field coverage figure
    coverageEyebrow: "Data coverage",
    coverageTitle: "Available fields",
    coverageNote:
      "Share of postings that report each field.",
    coverageBuiltFrom: "Built from",
    coveragePostingsSpanning: "postings spanning",
    coveragePostingsLabel: "postings",
    coverageLabels: {} as Record<string, string>,

    // Caveats figure
    caveatsEyebrow: "Caveats",
    caveatsTitle: "Limitations",
    caveatTranslations: {
      "Job ads measure posted labor demand, not employment or unemployment.":
        "Job ads measure posted labour demand, not employment or unemployment.",
    } as Record<string, string>,

    // Category cap figure
    capEyebrow: "Category limit",
    capTitle: "Public chart limit",
    capBody:
      "Public charts show up to 10 categories under the Vicinity Jobs API terms. Other preserves the remaining total. Team sessions show full detail.",

    // Glossary figure
    glossaryEyebrow: "Glossary",
    glossaryTitle: "Definitions",
    glossaryTerms: [
      {
        term: "Postings index",
        def: "Monthly postings indexed to January 2019 = 100. A value of 110 is 10% above the baseline.",
      },
      {
        term: "Year over year",
        def: "Change versus the same month a year earlier, expressed as a percentage.",
      },
      {
        term: "Wage range",
        def: "25th percentile, median and 75th percentile of advertised hourly wages. At least 100 postings.",
      },
      {
        term: "Posting concentration",
        def: "Posting share divided by labour-force share. Above 1 means higher concentration.",
      },
      {
        term: "Skills more common in a selected group",
        def: "Skill share in the selected scope divided by its national share.",
      },
      {
        term: "Minimum sample",
        def: 'Statistics with fewer than 100 supporting postings are shown as “—”.',
      },
    ],

  },

  fr: {
    // ApiDown fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Hero
    heroEyebrow: "Méthode et données",
    heroTitle: "Méthodologie du tableau de bord",
    heroIntro: "Sources, mesures et limites.",

    // What it measures
    measuresTitle: "Mesures",
    measuresItems: [
      "Offres mensuelles par région, profession et industrie",
      "Fourchettes salariales affichées",
      "Compétences et exigences mentionnées dans les offres",
    ],

    // What it does NOT measure
    notMeasuresTitle: "Éléments non mesurés",
    notMeasuresItems: [
      "L’emploi ou le chômage",
      "Les postes vacants de Statistique Canada",
      "Les embauches réelles",
      "Les postes ouverts : une annonce peut représenter zéro, un ou plusieurs emplois",
    ],

    // Field coverage figure
    coverageEyebrow: "Couverture des données",
    coverageTitle: "Champs disponibles",
    coverageNote:
      "Part des offres qui renseignent chaque champ.",
    coverageBuiltFrom: "Calculé à partir de",
    coveragePostingsSpanning: "offres couvrant",
    coveragePostingsLabel: "offres",
    coverageLabels: {
      noc_postings: "Profession (CNP)",
      naics_postings: "Industrie (SCIAN)",
      wage_postings: "Salaire",
      remote_field_postings: "Champ sur le télétravail",
    } as Record<string, string>,

    // Caveats figure
    caveatsEyebrow: "Mises en garde",
    caveatsTitle: "Limites",
    caveatTranslations: {
      "Job ads measure posted labour demand, not employment or unemployment.":
        "Les offres d’emploi mesurent la demande de main-d’œuvre affichée, non l’emploi ni le chômage.",
      "Job ads measure posted labor demand, not employment or unemployment.":
        "Les offres d’emploi mesurent la demande de main-d’œuvre affichée, non l’emploi ni le chômage.",
      "The 2025 upstream raw fetch provenance remains under audit; freshness should be read with caution.":
        "La provenance de la collecte brute en amont pour 2025 fait toujours l’objet d’un audit; la fraîcheur des données doit être interprétée avec prudence.",
      "Wages, remote work, language, and detailed experience fields are sparse or historically unstable.":
        "Les champs sur les salaires, le télétravail, la langue et l’expérience détaillée sont peu renseignés ou historiquement instables.",
      "Posting-level lookup is private and may be bounded by the configured lookup window and row limit.":
        "La consultation au niveau des offres est privée et peut être limitée par la période et le nombre maximal de lignes configurés.",
    } as Record<string, string>,

    // Category cap figure
    capEyebrow: "Limite de catégories",
    capTitle: "Limite des graphiques publics",
    capBody:
      "Les graphiques publics montrent jusqu’à 10 catégories selon les conditions de l’API Vicinity Jobs. La catégorie « Autres » conserve le total restant. Les sessions d’équipe affichent le détail complet.",

    // Glossary figure
    glossaryEyebrow: "Glossaire",
    glossaryTitle: "Définitions",
    glossaryTerms: [
      {
        term: "Indice des offres",
        def: "Offres mensuelles indexées à janvier 2019 = 100. Une valeur de 110 dépasse la référence de 10 %.",
      },
      {
        term: "Variation annuelle",
        def: "Variation par rapport au même mois de l'année précédente, exprimée en pourcentage.",
      },
      {
        term: "Fourchette salariale",
        def: "25e centile, médiane et 75e centile des salaires horaires affichés. Au moins 100 offres.",
      },
      {
        term: "Concentration des offres",
        def: "Part des offres divisée par la part de la population active. Plus de 1 indique une concentration élevée.",
      },
      {
        term: "Compétences plus courantes dans un groupe",
        def: "Part d’une compétence dans la sélection divisée par sa part nationale.",
      },
      {
        term: "Échantillon minimal",
        def: 'Les statistiques appuyées par moins de 100 offres sont affichées comme « — ».',
      },
    ],

  },
} as const;
