// Self-contained i18n dict for the Wages page.
// Do NOT import from or mutate the central dict (pages.ts).
// Translate only static UI copy. API-derived labels, numbers, and wage
// values are never translated.

export const wagesDict = {
  en: {
    // Hero
    eyebrowPrefix: "Wages",
    heroTitle: "What job ads say about pay.",
    heroLede:
      "Only a share of postings list a wage, so coverage is partial and skewed toward roles where pay is a recruitment signal. This dashboard shows hourly ranges — the 25th percentile, median, and 75th percentile of posted wages — not single point estimates.",

    // Coverage callout
    coverageOf: "of postings in the current window include a wage field.",
    coverageWithheld:
      "Any occupation or province with fewer than",
    coverageWithheldSuffix:
      "wage observations is withheld from the charts below to avoid unreliable estimates.",

    // Wage band over time
    bandEyebrow: "Advertised hourly pay over time",
    bandTitle: "Pay has risen — and spread out",
    bandNote: "Teal band spans the 25th–75th percentile; navy line is the median, by month. Months below the minimum sample are dropped.",
    bandNotEnough: "Not enough wage data for this selection.",
    bandMedian: "Median",

    // Figure — shared eyebrow
    figureEyebrow: "Posted hourly wage · 25th–75th percentile",

    // Figure — occupation
    occTitle: "Hourly wage range by occupation",

    // Figure — province
    provTitle: "Hourly wage range by province",

    // Wage vs demand scatter
    scatterEyebrow: "Pay vs demand · by occupation",
    scatterTitle: "Where pay and hiring demand meet",
    scatterNote: "Each bubble is a broad occupational group: horizontal = posting demand, vertical = median advertised wage, size = volume. Dashed lines mark the medians.",
    scatterNotEnough: "Not enough paired wage-and-demand data for this selection.",

    // Figure — shared note (minSample interpolated by the page)
    notePrefix:
      "Dot = median posted wage. Bar spans the 25th to 75th percentile of wages listed in job ads. Groups with fewer than",
    noteSuffix: "wage observations are withheld.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody:
      "The API isn't responding. Start it with",
  },
  fr: {
    // Hero
    eyebrowPrefix: "Salaires",
    heroTitle: "Ce que les offres d'emploi révèlent sur la rémunération.",
    heroLede:
      "Seulement une partie des offres indiquent un salaire, donc la couverture est partielle et biaisée vers les postes où la rémunération est un signal de recrutement. Ce tableau de bord affiche les fourchettes horaires — le 25e centile, la médiane et le 75e centile des salaires affichés — et non des estimations ponctuelles.",

    // Coverage callout
    coverageOf: "des offres de la période courante indiquent un salaire horaire.",
    coverageWithheld:
      "Toute profession ou province avec moins de",
    coverageWithheldSuffix:
      "observations salariales est retenue des graphiques ci-dessous afin d'éviter des estimations peu fiables.",

    // Wage band over time
    bandEyebrow: "Salaire horaire affiché au fil du temps",
    bandTitle: "La rémunération a augmenté — et s'est dispersée",
    bandNote: "La bande turquoise couvre du 25e au 75e centile; la ligne marine est la médiane, par mois. Les mois sous l'échantillon minimal sont retirés.",
    bandNotEnough: "Données salariales insuffisantes pour cette sélection.",
    bandMedian: "Médiane",

    // Figure — shared eyebrow
    figureEyebrow: "Salaire horaire affiché · 25e–75e centile",

    // Figure — occupation
    occTitle: "Fourchette salariale horaire par profession",

    // Figure — province
    provTitle: "Fourchette salariale horaire par province",

    // Wage vs demand scatter
    scatterEyebrow: "Salaire vs demande · par profession",
    scatterTitle: "Où le salaire et la demande se rencontrent",
    scatterNote: "Chaque bulle est un grand groupe professionnel : horizontal = demande d'offres, vertical = salaire médian affiché, taille = volume. Les lignes pointillées marquent les médianes.",
    scatterNotEnough: "Données appariées salaire-demande insuffisantes pour cette sélection.",

    // Figure — shared note (minSample interpolated by the page)
    notePrefix:
      "Point = salaire horaire médian affiché. La barre couvre du 25e au 75e centile des salaires dans les offres d'emploi. Les groupes de moins de",
    noteSuffix: "observations salariales sont retenus.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody:
      "L'API ne répond pas. Démarrez-la avec",
  },
} as const;

// Widened type so both "en" and "fr" variants satisfy the same interface
// (avoids TS2719 when an indexed `as const` locale value is passed as a prop or used inline).
export type WagesDictEntry = { [K in keyof (typeof wagesDict)["en"]]: string };
