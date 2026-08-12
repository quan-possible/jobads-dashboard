// Self-contained EN/FR dictionary for app/method/page.tsx.
// Keep in sync with that page only — do NOT wire this into the central dict.
// API-returned coverage and caveat identifiers are localized here at the
// presentation boundary; unknown future values deliberately fall back to the
// server text instead of disappearing.

export const methodDict = {
  en: {
    // ApiDown fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn't responding. Start it with",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Hero
    heroEyebrow: "Method & data",
    heroTitle: "How to read this dashboard.",
    heroIntro:
      "These figures come from online job postings and describe posted hiring demand — not employment, unemployment, vacancies, or hires.",

    // What it measures
    measuresTitle: "What this measures",
    measuresItems: [
      "Posted hiring from Canadian online job ads",
      "Postings by month, region, occupation (NOC), and industry (NAICS)",
      "Wage ranges posted in ads (25th / median / 75th percentile)",
      "Skills mentioned in postings and their relative frequency",
    ],

    // What it does NOT measure
    notMeasuresTitle: "What it does NOT measure",
    notMeasuresItems: [
      "Not employment — how many people hold jobs",
      "Not the unemployment rate",
      "Not job vacancies as defined by Statistics Canada (JVWS)",
      "Not actual hires — a posting may never lead to a hire",
      "A single ad may not equal one open job",
    ],

    // Field coverage figure
    coverageEyebrow: "How complete each field is",
    coverageTitle: "Field coverage",
    coverageNote:
      "Share of all postings that report each field. Wage, remote-work and similar fields are sparse — read them with care.",
    coverageBuiltFrom: "Built from",
    coveragePostingsSpanning: "postings spanning",
    coveragePostingsLabel: "postings",
    coverageLabels: {} as Record<string, string>,

    // Caveats figure
    caveatsEyebrow: "Caveats",
    caveatsTitle: "Things to keep in mind",
    caveatTranslations: {} as Record<string, string>,

    // Category cap figure
    capEyebrow: "Category limit",
    capTitle: "Why charts show up to 10 categories",
    capBody:
      "Public charts display at most 10 categories — the largest groups, with the remainder folded into a single “Other” bar (totals are preserved, never dropped). This limit is a condition of the Vicinity Jobs API terms of service. Signed-in team members see full, uncapped detail on every chart.",

    // Glossary figure
    glossaryEyebrow: "Glossary",
    glossaryTitle: "Key terms defined",
    glossaryTerms: [
      {
        term: "Postings index",
        def: "Monthly active postings indexed to January 2019 = 100. A value of 110 means 10% more postings than in the 2019 baseline.",
      },
      {
        term: "Year over year",
        def: "Change versus the same month a year earlier, expressed as a percentage.",
      },
      {
        term: "Wage range",
        def: "25th percentile / median / 75th percentile of posted hourly wages. Shown only when at least 100 postings list a wage.",
      },
      {
        term: "Location quotient",
        def: "A region's share of postings divided by its share of the labour force. Values above 1 mean the region is over-represented in that type of posting.",
      },
      {
        term: "Distinctive skills / lift",
        def: "A scope's skill share divided by the national share. High lift means a skill appears disproportionately often in this filter.",
      },
      {
        term: "Sample gate, n",
        def: 'Statistics are withheld when fewer than 100 postings support them. Shown as "—" with a note indicating insufficient sample.',
      },
    ],

    // Version / changelog figure
    versionEyebrow: "Version",
    versionTitle: "Changelog",
    versionRelease: "initial public release. Data current through",
    versionGenerated: "generated",
  },

  fr: {
    // ApiDown fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "L'API ne répond pas. Démarrez-la avec",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Hero
    heroEyebrow: "Méthode et données",
    heroTitle: "Comment lire ce tableau de bord.",
    heroIntro:
      "Ces chiffres proviennent d'offres d'emploi en ligne et décrivent la demande d'embauche affichée — non l'emploi, le chômage, les postes vacants ou les embauches.",

    // What it measures
    measuresTitle: "Ce que cela mesure",
    measuresItems: [
      "Embauche affichée dans les offres d'emploi en ligne au Canada",
      "Offres par mois, région, profession (CNP) et industrie (SCIAN)",
      "Fourchettes salariales affichées dans les offres (25e centile / médiane / 75e centile)",
      "Compétences mentionnées dans les offres et leur fréquence relative",
    ],

    // What it does NOT measure
    notMeasuresTitle: "Ce que cela ne mesure PAS",
    notMeasuresItems: [
      "Pas l'emploi — le nombre de personnes en poste",
      "Pas le taux de chômage",
      "Pas les postes vacants au sens de Statistique Canada (EPVS)",
      "Pas les embauches réelles — une offre peut ne mener à aucune embauche",
      "Une seule annonce ne correspond pas nécessairement à un seul poste",
    ],

    // Field coverage figure
    coverageEyebrow: "Complétude de chaque champ",
    coverageTitle: "Couverture des champs",
    coverageNote:
      "Part de l'ensemble des offres qui renseignent chaque champ. Les champs salaire, télétravail et similaires sont peu renseignés — interprétez-les avec prudence.",
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
    caveatsTitle: "Points importants à retenir",
    caveatTranslations: {
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
    capTitle: "Pourquoi les graphiques affichent jusqu’à 10 catégories",
    capBody:
      "Les graphiques publics affichent au plus 10 catégories — les plus grands groupes, le reste étant regroupé dans une seule barre « Autres » (les totaux sont préservés, jamais supprimés). Cette limite découle des conditions d’utilisation de l’API Vicinity Jobs. Les membres de l’équipe connectés voient le détail complet, sans plafond, sur chaque graphique.",

    // Glossary figure
    glossaryEyebrow: "Glossaire",
    glossaryTitle: "Définition des termes clés",
    glossaryTerms: [
      {
        term: "Indice des offres",
        def: "Offres actives mensuelles indexées à janvier 2019 = 100. Une valeur de 110 signifie 10 % d'offres de plus que dans la période de référence de 2019.",
      },
      {
        term: "Variation annuelle",
        def: "Variation par rapport au même mois de l'année précédente, exprimée en pourcentage.",
      },
      {
        term: "Fourchette salariale",
        def: "25e centile / médiane / 75e centile des salaires horaires affichés. Affiché seulement lorsqu'au moins 100 offres indiquent un salaire.",
      },
      {
        term: "Quotient de localisation",
        def: "Part des offres d'une région divisée par sa part de la population active. Une valeur supérieure à 1 signifie que la région est surreprésentée dans ce type d'offres.",
      },
      {
        term: "Compétences distinctives / indice de surreprésentation",
        def: "Part de la compétence dans la portée divisée par la part nationale. Un indice élevé signifie que la compétence apparaît de façon disproportionnée dans ce filtre.",
      },
      {
        term: "Seuil d'échantillon, n",
        def: 'Les statistiques sont retenues lorsque moins de 100 offres les supportent. Affichées comme « — » avec une note indiquant un échantillon insuffisant.',
      },
    ],

    // Version / changelog figure
    versionEyebrow: "Version",
    versionTitle: "Historique des versions",
    versionRelease: "première publication. Données à jour jusqu'au",
    versionGenerated: "généré le",
  },
} as const;
