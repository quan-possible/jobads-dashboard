// Static UI copy for app/page.tsx (the Pulse home page).
// API-derived labels and numbers are localized by the API or format helpers.

export const pulseDict = {
  en: {
    // Hero
    eyebrowPrefix: "Labour Market Pulse",
    lede: "Monthly postings, wages and occupation mix.",
    heroFallback: "Canadian job postings",

    // KPI tile labels
    kpiDemandLabel: "Postings index",
    kpiDemandContext: "Jan 2019 = 100",
    kpiDemandDeltaLabel: "vs baseline",
    kpiPostingsLabel: "Monthly postings",
    kpiPostingsContext: "latest month",
    kpiPostingsDeltaLabel: "vs previous month",
    kpiYoyLabel: "Annual change",
    kpiYoyContext: "vs last year",
    kpiWageLabel: "Median wage",
    kpiWageUnit: "/hr",
    kpiWageSample: "postings with wages",
    kpiWageInsufficient: "insufficient sample",

    // ApiDown error card
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "By occupation",
    deepLede: "Occupation indexes and change.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandRibbon: {
        eyebrow: "Postings over time",
        title: "Monthly job postings",
        note: "Faint = monthly · bold = 3-month average · dotted = provisional.",
        aria: "Monthly job-ad postings with a 3-month average and a provisional tail",
      },
      yoyBars: {
        eyebrow: "Year over year",
        title: "Annual posting change",
        note: "",
        aria: "Year-over-year percentage change in postings, by month",
      },
      seasonality: {
        eyebrow: "Seasonality · month by year",
        title: "Seasonality by month",
        note: "Each month relative to its annual average.",
        aria: "Heatmap of monthly postings relative to each year’s average",
      },
      composition: {
        eyebrow: "Occupational mix",
        title: "Posting share by occupation",
        note: "Monthly share by broad occupation group; smaller groups are Other.",
        aria: "Stacked area of posting share by broad occupation group over time",
      },
      occupationTrends: {
        eyebrow: "Occupation small-multiples",
        title: "Posting index by occupation",
        note: "Each panel uses its own scale.",
        aria: "Grid of sparkline trends, one per broad occupation group",
      },
      momentum: {
        eyebrow: "Momentum",
        title: "Short-term vs long-term postings",
        note: "3-month average minus 12-month average.",
        aria: "Bar chart of the gap between the 3-month and 12-month moving averages",
      },
      diffusion: {
        eyebrow: "Breadth of growth",
        title: "Occupations with annual posting growth",
        note: "3-month average.",
        aria: "Diffusion index of occupation groups with positive year-over-year postings",
      },
    },
  },
  fr: {
    // Hero
    eyebrowPrefix: "Pouls du marché du travail",
    lede: "Offres mensuelles, salaires et composition professionnelle.",
    heroFallback: "Offres d’emploi au Canada",

    // KPI tile labels
    kpiDemandLabel: "Indice des offres",
    kpiDemandContext: "janv. 2019 = 100",
    kpiDemandDeltaLabel: "par rapport à la référence",
    kpiPostingsLabel: "Offres mensuelles",
    kpiPostingsContext: "dernier mois",
    kpiPostingsDeltaLabel: "par rapport au mois précédent",
    kpiYoyLabel: "Variation annuelle",
    kpiYoyContext: "par rapport à l’an dernier",
    kpiWageLabel: "Salaire médian",
    kpiWageUnit: "/h",
    kpiWageSample: "offres avec salaire",
    kpiWageInsufficient: "échantillon insuffisant",

    // ApiDown error card
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Par profession",
    deepLede: "Indices et variations par profession.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandRibbon: {
        eyebrow: "Offres au fil du temps",
        title: "Offres d’emploi mensuelles",
        note: "Pâle = mensuel · gras = moyenne sur 3 mois · pointillé = provisoire.",
        aria: "Offres d’emploi mensuelles avec moyenne sur trois mois et fin provisoire",
      },
      yoyBars: {
        eyebrow: "D’une année à l’autre",
        title: "Variation annuelle des offres",
        note: "",
        aria: "Variation en pourcentage des offres sur un an, par mois",
      },
      seasonality: {
        eyebrow: "Saisonnalité · mois par année",
        title: "Saisonnalité par mois",
        note: "Chaque mois par rapport à sa moyenne annuelle.",
        aria: "Carte de chaleur des offres mensuelles par rapport à la moyenne annuelle",
      },
      composition: {
        eyebrow: "Composition professionnelle",
        title: "Part des offres par profession",
        note: "Part mensuelle par grand groupe professionnel; les petits groupes sont Autres.",
        aria: "Aires empilées de la part des offres par grand groupe professionnel dans le temps",
      },
      occupationTrends: {
        eyebrow: "Petits multiples · professions",
        title: "Indice des offres par profession",
        note: "Chaque panneau utilise sa propre échelle.",
        aria: "Grille de mini-tendances, une par grand groupe professionnel",
      },
      momentum: {
        eyebrow: "Dynamique",
        title: "Offres à court et à long terme",
        note: "Moyenne sur 3 mois moins moyenne sur 12 mois.",
        aria: "Diagramme à barres de l’écart entre les moyennes mobiles sur 3 et 12 mois",
      },
      diffusion: {
        eyebrow: "Ampleur de la croissance",
        title: "Professions où les offres augmentent sur un an",
        note: "Moyenne sur 3 mois.",
        aria: "Indice de diffusion des groupes professionnels en hausse sur un an",
      },
    },
  },
} as const;
