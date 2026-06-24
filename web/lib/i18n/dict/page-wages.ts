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

    // Wage vs hiring scatter
    scatterEyebrow: "Pay vs hiring · by occupation",
    scatterTitle: "Where pay and hiring meet",
    scatterNote: "Each bubble is a broad occupational group: horizontal = postings, vertical = median advertised wage, size = volume. Dashed lines mark the medians.",
    scatterNotEnough: "Not enough paired wage-and-hiring data for this selection.",

    // Figure — shared note (minSample interpolated by the page)
    notePrefix:
      "Dot = median posted wage. Bar spans the 25th to 75th percentile of wages listed in job ads. Groups with fewer than",
    noteSuffix: "wage observations are withheld.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody:
      "The API isn't responding. Start it with",

    // Section dividers (Core → Deep)
    deepEyebrow: "Going deeper",
    deepLede:
      "Provincial spread, the pay-versus-hiring quadrant, and posting conditions for readers who want the texture behind the headline pay.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      wageBand: {
        eyebrow: "Advertised hourly pay over time",
        title: "Advertised hourly wage: median and P25–P75 band",
        note: "Wages are advertised, not paid · dotted line = share of postings carrying a wage (right axis).",
        aria: "Median advertised hourly wage with a 25th-to-75th percentile band and a wage-coverage line",
      },
      wageDumbbell: {
        eyebrow: "Advertised pay spread · by province",
        title: "Advertised wage spread by province",
        note: "Bar = P25→P75 range, dot = median · provinces with at least 200 wage-bearing postings.",
        aria: "Dumbbell chart of advertised hourly wage spread by province, P25 to P75 with the median marked",
      },
      wageDemandQuadrant: {
        eyebrow: "Pay vs hiring · by occupation",
        title: "Pay vs momentum: the wage × hiring quadrant (Dec 2024)",
        note: "Bubble area ∝ volume · upper-right = well-paid and growing (correlation, not causation). Median wage shown only for groups that clear the wage-sample floor.",
        aria: "Quadrant scatter of occupations by advertised median wage and year-over-year posting growth, bubble size by volume",
      },
      educationWageProxy: {
        eyebrow: "Credentials vs pay · by occupation",
        title: "Do credential-heavy occupations pay more? (Dec 2024)",
        note: "Each broad occupation group: share of postings asking for a university degree vs median advertised wage · bubble ∝ volume (correlation, not causation). Median wage shown only for groups that clear the wage-sample floor.",
        aria: "Scatter of broad occupation groups by degree-requirement share and median advertised wage, bubble size by volume",
      },
      wageByEducation: {
        eyebrow: "Credential ladder · by education",
        title: "The credential ladder: advertised wage by education level",
        note: "P25–P75 band, dot = median · latest-month posting sample with both a wage and a stated education requirement (correlation, not causation).",
        aria: "Dumbbell ladder of advertised hourly wage P25–P75 band and median by education level",
      },
      conditionsMix: {
        eyebrow: "Posting conditions over time",
        title: "Employment-type mix over time",
        note: "Share of postings by advertised employment type.",
        aria: "Stacked area of the advertised employment-type mix over time",
      },
      languageGap: {
        eyebrow: "Language requirements over time",
        title: "Language requirements: English vs French (mandatory)",
        note: "Share of postings flagging a mandatory language · unstable before 2021 (shaded).",
        aria: "Lines of the share of postings flagging a mandatory English or French requirement over time",
      },
    },
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

    // Wage vs hiring scatter
    scatterEyebrow: "Salaire vs embauche · par profession",
    scatterTitle: "Où le salaire et l'embauche se rencontrent",
    scatterNote: "Chaque bulle est un grand groupe professionnel : horizontal = offres, vertical = salaire médian affiché, taille = volume. Les lignes pointillées marquent les médianes.",
    scatterNotEnough: "Données appariées salaire-embauche insuffisantes pour cette sélection.",

    // Figure — shared note (minSample interpolated by the page)
    notePrefix:
      "Point = salaire horaire médian affiché. La barre couvre du 25e au 75e centile des salaires dans les offres d'emploi. Les groupes de moins de",
    noteSuffix: "observations salariales sont retenus.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody:
      "L'API ne répond pas. Démarrez-la avec",

    // Section dividers (Core → Deep)
    deepEyebrow: "Pour aller plus loin",
    deepLede:
      "L'écart entre provinces, le quadrant salaire-embauche et les conditions des offres, pour qui veut la texture derrière la rémunération principale.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      wageBand: {
        eyebrow: "Salaire horaire affiché au fil du temps",
        title: "Salaire horaire affiché : médiane et bande P25–P75",
        note: "Les salaires sont affichés, non versés · ligne pointillée = part des offres indiquant un salaire (axe de droite).",
        aria: "Salaire horaire médian affiché avec une bande du 25e au 75e centile et une ligne de couverture salariale",
      },
      wageDumbbell: {
        eyebrow: "Écart de salaire affiché · par province",
        title: "Écart de salaire affiché par province",
        note: "Barre = fourchette P25→P75, point = médiane · provinces avec au moins 200 offres porteuses d'un salaire.",
        aria: "Graphique en haltère de l'écart de salaire horaire affiché par province, du P25 au P75 avec la médiane indiquée",
      },
      wageDemandQuadrant: {
        eyebrow: "Salaire vs embauche · par profession",
        title: "Salaire vs élan : le quadrant salaire × embauche (déc. 2024)",
        note: "Aire des bulles ∝ volume · en haut à droite = bien payé et en hausse (corrélation, non causalité). Salaire médian affiché uniquement pour les groupes atteignant le seuil d’échantillon salarial.",
        aria: "Nuage en quadrant des professions selon le salaire médian affiché et la croissance des offres sur un an, taille des bulles selon le volume",
      },
      educationWageProxy: {
        eyebrow: "Diplômes vs salaire · par profession",
        title: "Les professions exigeantes en diplômes paient-elles plus ? (déc. 2024)",
        note: "Chaque grand groupe professionnel : part des offres exigeant un diplôme universitaire vs salaire médian affiché · bulle ∝ volume (corrélation, non causalité). Salaire médian affiché uniquement pour les groupes atteignant le seuil d’échantillon salarial.",
        aria: "Nuage de points des grands groupes professionnels selon la part d'exigence de diplôme et le salaire médian affiché, taille des bulles selon le volume",
      },
      wageByEducation: {
        eyebrow: "Échelle des diplômes · par scolarité",
        title: "L'échelle des diplômes : salaire affiché par niveau de scolarité",
        note: "Bande P25–P75, point = médiane · échantillon du dernier mois avec à la fois un salaire et une exigence de scolarité (corrélation, non causalité).",
        aria: "Graphique en haltères du salaire horaire affiché (bande P25–P75 et médiane) par niveau de scolarité",
      },
      conditionsMix: {
        eyebrow: "Conditions des offres au fil du temps",
        title: "Composition des types d'emploi au fil du temps",
        note: "Part des offres par type d'emploi affiché.",
        aria: "Aires empilées de la composition des types d'emploi affichés au fil du temps",
      },
      languageGap: {
        eyebrow: "Exigences linguistiques au fil du temps",
        title: "Exigences linguistiques : anglais vs français (obligatoire)",
        note: "Part des offres signalant une langue obligatoire · instable avant 2021 (zone ombrée).",
        aria: "Courbes de la part des offres signalant une exigence obligatoire d'anglais ou de français au fil du temps",
      },
    },
  },
} as const;

// Locale entry type — indexed off the dict itself so nested objects (charts)
// stay typed. Mirrors how the Pulse page consumes its dict.
export type WagesDictEntry = (typeof wagesDict)[keyof typeof wagesDict];
