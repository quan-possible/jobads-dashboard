// Self-contained i18n dict for the Wages page.
// Do NOT import from or mutate the central dict (pages.ts).
// Translate only static UI copy. API-derived labels, numbers, and wage
// values are never translated.

export const wagesDict = {
  en: {
    // Hero
    eyebrowPrefix: "Wages",
    heroTitle: "Advertised wages in job postings",
    heroLede: "Compare hourly wage levels, ranges and coverage.",

    // Coverage callout
    coverageOf: "of postings include a wage.",
    coverageWithheld:
      "Any occupation or province with fewer than",
    coverageWithheldSuffix:
      "wage observations is withheld.",

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

    // Wage vs postings scatter
    scatterEyebrow: "Pay vs postings · by occupation",
    scatterTitle: "Pay and posting volume",
    scatterNote: "Each bubble is a broad NOC group; size = posting volume.",
    scatterNotEnough: "Not enough paired wage and posting data for this selection.",

    // Figure — shared note (minSample interpolated by the page)
    notePrefix:
      "Dot = median. Bar = 25th–75th percentile. Groups with fewer than",
    noteSuffix: "wage observations are withheld.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",

    // Section dividers (Core → Deep)
    deepEyebrow: "More detail",
    deepLede: "Provincial ranges, credentials and posting conditions.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      wageBand: {
        eyebrow: "Advertised hourly pay over time",
        title: "Advertised hourly wages over time",
        note: "Band = 25th–75th percentile · line = median · dotted = coverage.",
        aria: "Median advertised hourly wage with a 25th-to-75th percentile band and a wage-coverage line",
      },
      wageDumbbell: {
        eyebrow: "Advertised pay spread · by province",
        title: "Advertised wages by province",
        note: "Bar = 25th–75th percentile · dot = median · n ≥ 200.",
        aria: "Dumbbell chart of advertised hourly wage spread by province, P25 to P75 with the median marked",
      },
      wageDemandQuadrant: {
        eyebrow: "Pay vs growth · by occupation",
        title: "Advertised pay and posting growth",
        note: "Bubble = volume. Correlation, not causation.",
        aria: "Quadrant scatter of occupations by advertised median wage and year-over-year posting growth, bubble size by volume",
      },
      educationWageProxy: {
        eyebrow: "Credentials vs pay · by occupation",
        title: "Credentials and advertised pay",
        note: "Bubble = volume. Correlation, not causation.",
        aria: "Scatter of broad occupation groups by degree-requirement share and median advertised wage, bubble size by volume",
      },
      wageByEducation: {
        eyebrow: "Credential ladder · by education",
        title: "Advertised pay by education level",
        note: "Band = 25th–75th percentile · dot = median. Latest month.",
        aria: "Dumbbell ladder of advertised hourly wage P25–P75 band and median by education level",
      },
      conditionsMix: {
        eyebrow: "Posting conditions over time",
        title: "Employment types over time",
        note: "Share of postings by advertised employment type.",
        aria: "Stacked area of the advertised employment-type mix over time",
      },
      languageGap: {
        eyebrow: "Language requirements over time",
        title: "Mandatory language requirements",
        note: "Share of postings; pre-2021 data are unstable.",
        aria: "Lines of the share of postings flagging a mandatory English or French requirement over time",
      },
    },
  },
  fr: {
    // Hero
    eyebrowPrefix: "Salaires",
    heroTitle: "Salaires affichés dans les offres d’emploi",
    heroLede: "Comparez les niveaux, les fourchettes et la couverture des salaires horaires.",

    // Coverage callout
    coverageOf: "des offres indiquent un salaire.",
    coverageWithheld:
      "Toute profession ou province avec moins de",
    coverageWithheldSuffix:
      "observations salariales est masquée.",

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

    // Wage vs postings scatter
    scatterEyebrow: "Salaire vs offres · par profession",
    scatterTitle: "Salaire et volume d’offres",
    scatterNote: "Chaque bulle est un grand groupe CNP; taille = volume d’offres.",
    scatterNotEnough: "Données appariées salaire-offres insuffisantes pour cette sélection.",

    // Figure — shared note (minSample interpolated by the page)
    notePrefix:
      "Point = médiane. Barre = 25e–75e centile. Les groupes comptant moins de",
    noteSuffix: "observations salariales ne sont pas affichés.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Plus de détails",
    deepLede: "Fourchettes provinciales, diplômes et conditions des offres.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      wageBand: {
        eyebrow: "Salaire horaire affiché au fil du temps",
        title: "Salaires horaires affichés au fil du temps",
        note: "Bande = 25e–75e centile · ligne = médiane · pointillé = couverture.",
        aria: "Salaire horaire médian affiché avec une bande du 25e au 75e centile et une ligne de couverture salariale",
      },
      wageDumbbell: {
        eyebrow: "Écart de salaire affiché · par province",
        title: "Salaires affichés par province",
        note: "Barre = 25e–75e centile · point = médiane · n ≥ 200.",
        aria: "Graphique en haltère de l'écart de salaire horaire affiché par province, du P25 au P75 avec la médiane indiquée",
      },
      wageDemandQuadrant: {
        eyebrow: "Salaire vs croissance · par profession",
        title: "Salaire affiché et croissance des offres",
        note: "Bulle = volume. Corrélation, non causalité.",
        aria: "Nuage en quadrant des professions selon le salaire médian affiché et la croissance des offres sur un an, taille des bulles selon le volume",
      },
      educationWageProxy: {
        eyebrow: "Diplômes vs salaire · par profession",
        title: "Diplômes et salaire affiché",
        note: "Bulle = volume. Corrélation, non causalité.",
        aria: "Nuage de points des grands groupes professionnels selon la part d'exigence de diplôme et le salaire médian affiché, taille des bulles selon le volume",
      },
      wageByEducation: {
        eyebrow: "Échelle des diplômes · par scolarité",
        title: "Salaire affiché par niveau de scolarité",
        note: "Bande = 25e–75e centile · point = médiane. Dernier mois.",
        aria: "Graphique en haltères du salaire horaire affiché (bande P25–P75 et médiane) par niveau de scolarité",
      },
      conditionsMix: {
        eyebrow: "Conditions des offres au fil du temps",
        title: "Types d’emploi au fil du temps",
        note: "Part des offres par type d'emploi affiché.",
        aria: "Aires empilées de la composition des types d'emploi affichés au fil du temps",
      },
      languageGap: {
        eyebrow: "Exigences linguistiques au fil du temps",
        title: "Exigences linguistiques obligatoires",
        note: "Part des offres; données instables avant 2021.",
        aria: "Courbes de la part des offres signalant une exigence obligatoire d'anglais ou de français au fil du temps",
      },
    },
  },
} as const;

// Locale entry type — indexed off the dict itself so nested objects (charts)
// stay typed. Mirrors how the Pulse page consumes its dict.
export type WagesDictEntry = (typeof wagesDict)[keyof typeof wagesDict];
