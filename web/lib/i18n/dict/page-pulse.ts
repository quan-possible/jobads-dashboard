// Static UI copy for app/page.tsx (the Pulse home page).
// API-derived strings (headline sentence, key_points, occupation/industry/skill
// labels, province names, and numbers) are NOT translated here — they remain
// as returned by the API or composed from API data in the page.

export const pulseDict = {
  en: {
    // Hero
    eyebrowPrefix: "Labour Market Pulse",
    lede: "Monthly trends in Canadian job postings.",
    // Headline composed from the postings index ({pct} = |gap|, {dir} = above/below).
    heroFallback: "Canadian job postings",
    heroTemplate: "Canadian job postings are {pct}% {dir} the January 2019 level",
    heroAbove: "above",
    heroBelow: "below",

    // KPI tile labels
    kpiDemandLabel: "Postings index",
    kpiDemandContext: "Jan 2019 = 100",
    kpiDemandDeltaLabel: "vs baseline",
    kpiPostingsLabel: "Monthly postings",
    kpiPostingsContext: "latest month",
    kpiPostingsDeltaLabel: "MoM",
    kpiYoyLabel: "Vs last year",
    kpiYoyContext: "year over year",
    kpiWageLabel: "Median wage",
    kpiWageUnit: "/hr",
    kpiWageInsufficient: "insufficient sample",

    // Postings chart Figure
    demandEyebrow: "Postings over time",
    demandTitle: "Postings relative to the pre-pandemic norm",
    demandNote: "Monthly postings index, January 2019 = 100.",
    keyPointsTitle: "Summary",

    // Movers section — one diverging chart, growth + decline on one scale
    moversEyebrow: "Occupations · year over year",
    moversTitle: "Largest changes in postings",
    moversNote: "Year-over-year change by broad NOC group.",
    moversEmpty: "No broad group changed year over year this month.",
    growingTitle: "Where postings are rising fastest",
    growingNote: "Broad NOC groups with rising postings.",
    growingEmpty: "No broad group grew year over year this month.",
    coolingTitle: "Where postings are falling fastest",
    coolingNote: "Broad NOC groups with the largest declines.",
    coolingEmpty: "No broad group declined year over year this month.",

    // Regional snapshot
    regionalEyebrow: "Regional snapshot",
    regionalTitle: "Postings by province",
    regionalNote: "See Geography for adjusted measures.",
    regionalValueLabel: "Postings",
    trendLabel: "24-mo trend",
    fullMap: "Full map →",

    // Seasonality heatmap
    seasonalityEyebrow: "Seasonality · month by year",
    seasonalityTitle: "When postings peak during the year",
    seasonalityNote: "Each month relative to its annual average; 1.00× = average.",
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

    // ApiDown error card
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "More detail",
    deepLede: "Occupation trends, momentum and breadth.",

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
        title: "Year-over-year change in postings",
        note: "Compared with the same month one year earlier.",
        aria: "Year-over-year percentage change in postings, by month",
      },
      seasonality: {
        eyebrow: "Seasonality · month by year",
        title: "When postings peak during the year",
        note: "Each month relative to its annual average.",
        aria: "Heatmap of monthly postings relative to each year’s average",
      },
      composition: {
        eyebrow: "Occupational mix",
        title: "How the occupation mix changes",
        note: "Monthly share by broad NOC group; smaller groups are Other.",
        aria: "Stacked area of posting share by broad occupation group over time",
      },
      occupationTrends: {
        eyebrow: "Occupation small-multiples",
        title: "Posting trends by occupation",
        note: "Each panel uses its own scale.",
        aria: "Grid of sparkline trends, one per broad occupation group",
      },
      momentum: {
        eyebrow: "Momentum",
        title: "Are postings accelerating or slowing?",
        note: "3-month average minus 12-month average.",
        aria: "Bar chart of the gap between the 3-month and 12-month moving averages",
      },
      diffusion: {
        eyebrow: "Breadth of growth",
        title: "How broad is posting growth?",
        note: "Share of broad NOC groups growing year over year; 3-month average.",
        aria: "Diffusion index of occupation groups with positive year-over-year postings",
      },
    },
  },
  fr: {
    // Hero
    eyebrowPrefix: "Pouls du marché du travail",
    lede: "Tendances mensuelles des offres d’emploi au Canada.",
    heroFallback: "Les offres d’emploi au Canada",
    heroTemplate: "Les offres d’emploi au Canada sont {pct} % {dir} leur niveau de janvier 2019",
    heroAbove: "au-dessus de",
    heroBelow: "en dessous de",

    // KPI tile labels
    kpiDemandLabel: "Indice des offres",
    kpiDemandContext: "janv. 2019 = 100",
    kpiDemandDeltaLabel: "par rapport à la référence",
    kpiPostingsLabel: "Offres mensuelles",
    kpiPostingsContext: "dernier mois",
    kpiPostingsDeltaLabel: "m/m",
    kpiYoyLabel: "Par rapport à l’an dernier",
    kpiYoyContext: "d’une année à l’autre",
    kpiWageLabel: "Salaire médian",
    kpiWageUnit: "/h",
    kpiWageInsufficient: "échantillon insuffisant",

    // Postings chart Figure
    demandEyebrow: "Offres au fil du temps",
    demandTitle: "Offres par rapport à la norme pré-pandémique",
    demandNote: "Indice mensuel des offres, janvier 2019 = 100.",
    keyPointsTitle: "Résumé",

    // Movers section — un seul graphique divergent
    moversEyebrow: "Professions · année sur année",
    moversTitle: "Plus fortes variations des offres",
    moversNote: "Variation annuelle par grand groupe CNP.",
    moversEmpty: "Aucun grand groupe n’a varié sur un an ce mois-ci.",
    growingTitle: "Où les offres augmentent le plus",
    growingNote: "Grands groupes CNP en hausse.",
    growingEmpty: "Aucun grand groupe n’a progressé sur un an ce mois-ci.",
    coolingTitle: "Où les offres diminuent le plus",
    coolingNote: "Grands groupes CNP en plus forte baisse.",
    coolingEmpty: "Aucun grand groupe n’a reculé sur un an ce mois-ci.",

    // Regional snapshot
    regionalEyebrow: "Aperçu régional",
    regionalTitle: "Offres par province",
    regionalNote: "Voir Géographie pour les mesures ajustées.",
    regionalValueLabel: "Offres",
    trendLabel: "Tendance 24 mois",
    fullMap: "Carte complète →",

    // Seasonality heatmap
    seasonalityEyebrow: "Saisonnalité · mois par année",
    seasonalityTitle: "Quand les offres culminent dans l’année",
    seasonalityNote: "Chaque mois par rapport à sa moyenne annuelle; 1,00× = moyenne.",
    monthsShort: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],

    // ApiDown error card
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Plus de détails",
    deepLede: "Tendances, dynamique et ampleur par profession.",

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
        note: "Comparaison avec le même mois un an plus tôt.",
        aria: "Variation en pourcentage des offres sur un an, par mois",
      },
      seasonality: {
        eyebrow: "Saisonnalité · mois par année",
        title: "Quand les offres culminent dans l’année",
        note: "Chaque mois par rapport à sa moyenne annuelle.",
        aria: "Carte de chaleur des offres mensuelles par rapport à la moyenne annuelle",
      },
      composition: {
        eyebrow: "Composition professionnelle",
        title: "Évolution de la composition professionnelle",
        note: "Part mensuelle par grand groupe CNP; les petits groupes sont Autres.",
        aria: "Aires empilées de la part des offres par grand groupe professionnel dans le temps",
      },
      occupationTrends: {
        eyebrow: "Petits multiples · professions",
        title: "Tendances des offres par profession",
        note: "Chaque panneau utilise sa propre échelle.",
        aria: "Grille de mini-tendances, une par grand groupe professionnel",
      },
      momentum: {
        eyebrow: "Dynamique",
        title: "Les offres accélèrent-elles ou ralentissent-elles ?",
        note: "Moyenne sur 3 mois moins moyenne sur 12 mois.",
        aria: "Diagramme à barres de l’écart entre les moyennes mobiles sur 3 et 12 mois",
      },
      diffusion: {
        eyebrow: "Ampleur de la croissance",
        title: "Quelle est l’ampleur de la croissance ?",
        note: "Part des grands groupes CNP en hausse sur un an; moyenne sur 3 mois.",
        aria: "Indice de diffusion des groupes professionnels en hausse sur un an",
      },
    },
  },
} as const;
