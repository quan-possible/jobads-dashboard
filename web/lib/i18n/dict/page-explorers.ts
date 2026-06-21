// Static UI copy for occupations and industries explorer pages.
// API-derived strings (group/sector labels, skill labels, key_points, numbers,
// province names, months) stay as returned by the API and are NOT translated here.

export const explorersDict = {
  en: {
    // Occupations-specific copy
    occEyebrow: "Occupations",
    occTitle: "Which occupations employers are hiring for",
    occLede:
      "Posted hiring demand across the ten broad occupational groups (NOC). Select a group to see its trend, pay and most-requested skills — your choice carries across every page.",
    occRankTitle: "Hiring demand by occupational group",
    occRankNote:
      "Active postings this month, with year-over-year change. Click a group to filter the whole dashboard.",
    occSelectHint: "Select a group above to see its trend, pay and most-requested skills.",

    // Industries-specific copy
    indEyebrow: "Industries",
    indTitle: "Which industries are posting jobs",
    indLede:
      "Posted hiring demand across industry sectors (NAICS). Select a sector to see its trend, pay and most-requested skills — your choice carries across every page.",
    indRankTitle: "Hiring demand by industry sector",
    indRankNote:
      "Active postings this month, with year-over-year change. Click a sector to filter the whole dashboard.",
    indSelectHint: "Select a sector above to see its trend, pay and most-requested skills.",

    // Shared figure labels (rank figure eyebrow suffix)
    rankEyebrowSuffix: "year over year",

    // Demand chart figure
    demandEyebrow: "Demand over time",
    demandTitleBase: "Demand vs the 2019 norm",
    demandTitleSelected: "demand vs the 2019 norm",
    demandNote: "Indexed monthly active postings for the current selection, January 2019 = 100.",

    // Selected-group / sector panel
    clearSelection: "Clear selection ✕",

    // KPI tiles
    kpiActive: "Active postings",
    kpiActiveContext: "this month",
    kpiActiveMonthLabel: "MoM",
    kpiVsYear: "Vs last year",
    kpiVsYearContext: "year over year",
    kpiWage: "Median wage",
    kpiWageUnit: "/hr",
    kpiInsufficient: "insufficient sample",

    // Skills figure
    skillsEyebrow: "Skills",
    skillsTitlePrefix: "Most-requested skills in",
    skillsNotePrefix: "Among the",
    skillsNotePostfix: "postings in this selection that list skills.",
    skillsEmpty: "No skill data for this selection.",

    // CSV column headers
    csvCode: "Code",
    csvLabel: "Label",
    csvActive: "Active Postings",
    csvYoy: "YoY (%)",
    csvShare: "Share",

    // SkillBars accessibility
    skillBarsAriaLabel: "Top requested skills",
    skillBarsEmptyText: "No skill data for this selection.",

    // Concentration KPIs
    hhiLabel: "Concentration (HHI)",
    hhiContext: "0–10,000 · higher = more concentrated",
    top5Label: "Top-5 share",
    top5Context: "of demand in the 5 largest groups",
    nGroupsLabel: "Groups",
    nGroupsContext: "broad groups with demand",

    // Composition over time
    compEyebrow: "Mix over time",
    compTitle: "How the composition of demand has shifted",
    compNote: "Share of coded postings by broad group each month (top groups; the rest pooled as “Other”).",

    // Occupation × province heatmap
    matrixEyebrow: "Occupation × province",
    matrixTitle: "Where each occupation concentrates",
    matrixNote: "Location quotient: a cell’s share of a province’s demand vs the national mix. 1.0 = as expected; above 1 = over-represented.",

    // Coverage-stability (industries)
    coverageEyebrow: "Coverage over time",
    coverageTitle: "Share of postings with a usable industry code",
    coverageNote: "Not every posting carries a classifiable NAICS industry. This is the honesty companion to the industry views above.",

    // ApiDown error
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn’t responding. Start it with",
    apiDownCmd: "uvicorn api.main:app --port 8530",
  },
  fr: {
    // Occupations-specific copy
    occEyebrow: "Professions",
    occTitle: "Pour quelles professions les employeurs embauchent-ils?",
    occLede:
      "Demande d’emploi affichée pour les dix grands groupes professionnels (CNP). Sélectionnez un groupe pour voir sa tendance, sa rémunération et ses compétences les plus demandées — votre choix s’applique à toutes les pages.",
    occRankTitle: "Demande d’emploi par grand groupe professionnel",
    occRankNote:
      "Offres actives ce mois-ci, avec variation sur un an. Cliquez sur un groupe pour filtrer le tableau de bord.",
    occSelectHint: "Sélectionnez un groupe ci-dessus pour voir sa tendance, sa rémunération et ses compétences.",

    // Industries-specific copy
    indEyebrow: "Industries",
    indTitle: "Dans quelles industries les offres d’emploi sont-elles publiées?",
    indLede:
      "Demande d’emploi affichée par secteur industriel (SCIAN). Sélectionnez un secteur pour voir sa tendance, sa rémunération et ses compétences les plus demandées — votre choix s’applique à toutes les pages.",
    indRankTitle: "Demande d’emploi par secteur industriel",
    indRankNote:
      "Offres actives ce mois-ci, avec variation sur un an. Cliquez sur un secteur pour filtrer le tableau de bord.",
    indSelectHint: "Sélectionnez un secteur ci-dessus pour voir sa tendance, sa rémunération et ses compétences.",

    // Shared figure labels (rank figure eyebrow suffix)
    rankEyebrowSuffix: "année sur année",

    // Demand chart figure
    demandEyebrow: "Demande au fil du temps",
    demandTitleBase: "Demande par rapport à la norme de 2019",
    demandTitleSelected: "demande par rapport à la norme de 2019",
    demandNote: "Offres actives mensuelles indexées pour la sélection en cours, janvier 2019 = 100.",

    // Selected-group / sector panel
    clearSelection: "Effacer la sélection ✕",

    // KPI tiles
    kpiActive: "Offres actives",
    kpiActiveContext: "ce mois-ci",
    kpiActiveMonthLabel: "m/m",
    kpiVsYear: "Vs l’an dernier",
    kpiVsYearContext: "d’une année à l’autre",
    kpiWage: "Salaire médian",
    kpiWageUnit: " $/h",
    kpiInsufficient: "échantillon insuffisant",

    // Skills figure
    skillsEyebrow: "Compétences",
    skillsTitlePrefix: "Compétences les plus demandées en",
    skillsNotePrefix: "Parmi les",
    skillsNotePostfix: "offres de cette sélection indiquant des compétences.",
    skillsEmpty: "Aucune donnée de compétences pour cette sélection.",

    // CSV column headers
    csvCode: "Code",
    csvLabel: "Étiquette",
    csvActive: "Offres actives",
    csvYoy: "Var. annuelle (%)",
    csvShare: "Part",

    // SkillBars accessibility
    skillBarsAriaLabel: "Compétences les plus demandées",
    skillBarsEmptyText: "Aucune donnée de compétences pour cette sélection.",

    // Concentration KPIs
    hhiLabel: "Concentration (IHH)",
    hhiContext: "0–10 000 · plus élevé = plus concentré",
    top5Label: "Part du top 5",
    top5Context: "de la demande dans les 5 plus grands groupes",
    nGroupsLabel: "Groupes",
    nGroupsContext: "grands groupes avec demande",

    // Composition over time
    compEyebrow: "Composition au fil du temps",
    compTitle: "Comment la composition de la demande a évolué",
    compNote: "Part des offres codées par grand groupe chaque mois (principaux groupes; le reste regroupé sous « Autre »).",

    // Occupation × province heatmap
    matrixEyebrow: "Profession × province",
    matrixTitle: "Où chaque profession se concentre",
    matrixNote: "Quotient de localisation : part d’une profession dans la demande d’une province vs la moyenne nationale. 1,0 = attendu; au-dessus de 1 = surreprésenté.",

    // Coverage-stability (industries)
    coverageEyebrow: "Couverture au fil du temps",
    coverageTitle: "Part des offres avec un code d’industrie utilisable",
    coverageNote: "Toutes les offres ne portent pas un code SCIAN classifiable. C’est le complément d’honnêteté aux vues sectorielles ci-dessus.",

    // ApiDown error
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "L’API ne répond pas. Démarrez-la avec",
    apiDownCmd: "uvicorn api.main:app --port 8530",
  },
} as const;

// Widened type so both "en" and "fr" variants satisfy the same interface
// (avoids TS2719 when an indexed `as const` locale value is passed as a prop).
export type ExplorersDictEntry = { [K in keyof (typeof explorersDict)["en"]]: string };
