// Self-contained i18n dict for the Wages page.
// Do NOT import from or mutate the central dict (pages.ts).
// Translate only static UI copy. API-derived labels, numbers, and wage
// values are never translated.

export const wagesDict = {
  en: {
    // Hero
    eyebrowPrefix: "Wages",
    heroTitle: "Advertised wages",
    heroLede: "Hourly rates, ranges and coverage in job postings.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Related measures",
    deepLede: "Province, education and posting conditions.",

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
        title: "Advertised hourly wages by province",
        note: "25th–75th percentile and median. At least 200 postings with wages.",
        aria: "Dumbbell chart of advertised hourly wage spread by province, 25th to 75th percentile with the median marked",
      },
      wageDemandQuadrant: {
        eyebrow: "Pay vs growth · by occupation",
        title: "Advertised wages and annual posting change",
        note: "Bubble size = postings. Descriptive association only.",
        aria: "Scatter plot of occupations by median advertised wage and year-over-year posting change, with bubble size showing posting volume",
      },
      educationWageProxy: {
        eyebrow: "Credentials vs pay · by occupation",
        title: "Degree requirements and advertised wages",
        note: "Bubble size = postings. Descriptive association only.",
        aria: "Scatter of broad occupation groups by degree-requirement share and median advertised wage, bubble size by volume",
      },
      wageByEducation: {
        eyebrow: "Credential ladder · by education",
        title: "Advertised wages by education requirement",
        note: "Band = 25th–75th percentile · dot = median. Latest month.",
        aria: "Dumbbell ladder of advertised hourly wage 25th–75th percentile band and median by education level",
      },
      conditionsMix: {
        eyebrow: "Posting conditions over time",
        title: "Employment type",
        note: "Share of postings.",
        aria: "Stacked area of the advertised employment-type mix over time",
      },
      languageGap: {
        eyebrow: "Language requirements over time",
        title: "Language requirements",
        note: "Share of postings; pre-2021 data are unstable.",
        aria: "Lines of the share of postings flagging a mandatory English or French requirement over time",
      },
    },
  },
  fr: {
    // Hero
    eyebrowPrefix: "Salaires",
    heroTitle: "Salaires affichés",
    heroLede: "Taux horaires, fourchettes et couverture dans les offres d’emploi.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Mesures connexes",
    deepLede: "Province, scolarité et conditions des offres.",

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
        title: "Salaires horaires affichés par province",
        note: "25e–75e centile et médiane. Au moins 200 offres avec salaire.",
        aria: "Graphique en haltère de l'écart de salaire horaire affiché par province, du 25e au 75e centile avec la médiane indiquée",
      },
      wageDemandQuadrant: {
        eyebrow: "Salaire vs croissance · par profession",
        title: "Salaire affiché et variation annuelle des offres",
        note: "Taille des bulles = offres. Association descriptive seulement.",
        aria: "Nuage de points des professions selon le salaire médian affiché et la variation annuelle des offres, avec taille des bulles selon le volume",
      },
      educationWageProxy: {
        eyebrow: "Diplômes vs salaire · par profession",
        title: "Diplômes exigés et salaires affichés",
        note: "Taille des bulles = offres. Association descriptive seulement.",
        aria: "Nuage de points des grands groupes professionnels selon la part d'exigence de diplôme et le salaire médian affiché, taille des bulles selon le volume",
      },
      wageByEducation: {
        eyebrow: "Échelle des diplômes · par scolarité",
        title: "Salaires affichés par exigence de scolarité",
        note: "Bande = 25e–75e centile · point = médiane. Dernier mois.",
        aria: "Graphique en haltères du salaire horaire affiché (bande du 25e au 75e centile et médiane) par niveau de scolarité",
      },
      conditionsMix: {
        eyebrow: "Conditions des offres au fil du temps",
        title: "Type d’emploi",
        note: "Part des offres.",
        aria: "Aires empilées de la composition des types d'emploi affichés au fil du temps",
      },
      languageGap: {
        eyebrow: "Exigences linguistiques au fil du temps",
        title: "Exigences linguistiques",
        note: "Part des offres; données instables avant 2021.",
        aria: "Courbes de la part des offres signalant une exigence obligatoire d'anglais ou de français au fil du temps",
      },
    },
  },
} as const;

// Locale entry type — indexed off the dict itself so nested objects (charts)
// stay typed. Mirrors how the Pulse page consumes its dict.
export type WagesDictEntry = (typeof wagesDict)[keyof typeof wagesDict];
