// Static UI copy for app/page.tsx (the Pulse home page).
// API-derived strings (headline sentence, key_points, occupation/industry/skill
// labels, province names, and numbers) are NOT translated here — they remain
// as returned by the API or composed from API data in the page.

export const pulseDict = {
  en: {
    // Hero
    eyebrowPrefix: "Labour Market Pulse",
    lede: "A monthly read on posted hiring demand across Canada’s regions, occupations and industries. Job ads measure posted demand — not employment or vacancies.",

    // KPI tile labels
    kpiDemandLabel: "Demand index",
    kpiDemandContext: "2019 = 100",
    kpiDemandDeltaLabel: "vs baseline",
    kpiPostingsLabel: "Active postings",
    kpiPostingsContext: "this month",
    kpiPostingsDeltaLabel: "MoM",
    kpiYoyLabel: "Vs last year",
    kpiYoyContext: "year over year",
    kpiWageLabel: "Median wage",
    kpiWageUnit: "/hr",
    kpiWageInsufficient: "insufficient sample",

    // Demand chart Figure
    demandEyebrow: "Posting demand over time",
    demandTitle: "Demand relative to the pre-pandemic norm",
    demandNote: "Index of monthly active postings, January 2019 = 100. Hover for monthly values.",
    keyPointsTitle: "What stands out",

    // Movers section — both panels share the same eyebrow
    moversEyebrow: "Occupations · year over year",
    growingTitle: "Where hiring demand is climbing fastest",
    growingNote: "Broad occupational groups (NOC) with rising year-over-year demand.",
    growingEmpty: "No broad group grew year over year this month.",
    coolingTitle: "Where demand is cooling most",
    coolingNote: "The broad groups with the largest year-over-year declines.",
    coolingEmpty: "No broad group declined year over year this month.",

    // Regional snapshot
    regionalEyebrow: "Regional snapshot",
    regionalTitle: "Active postings by province this month",
    regionalNote: "Counts of active postings. See Geography for per-capita and concentration views.",
    fullMap: "Full map →",

    // ApiDown error card
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn’t responding. Start it with",
    apiDownCmd: "uvicorn api.main:app --port 8530",
  },
  fr: {
    // Hero
    eyebrowPrefix: "Pouls du marché du travail",
    lede: "Un bilan mensuel de la demande d’emploi affichée dans les régions, professions et industries au Canada. Les offres mesurent la demande affichée — non l’emploi ni les postes vacants.",

    // KPI tile labels
    kpiDemandLabel: "Indice de demande",
    kpiDemandContext: "2019 = 100",
    kpiDemandDeltaLabel: "vs référence",
    kpiPostingsLabel: "Offres actives",
    kpiPostingsContext: "ce mois-ci",
    kpiPostingsDeltaLabel: "m/m",
    kpiYoyLabel: "Vs l’an dernier",
    kpiYoyContext: "d’une année à l’autre",
    kpiWageLabel: "Salaire médian",
    kpiWageUnit: " $/h",
    kpiWageInsufficient: "échantillon insuffisant",

    // Demand chart Figure
    demandEyebrow: "Demande affichée au fil du temps",
    demandTitle: "Demande par rapport à la norme pré-pandémique",
    demandNote: "Indice des offres actives mensuelles, janvier 2019 = 100. Survolez pour les valeurs mensuelles.",
    keyPointsTitle: "Ce qui ressort",

    // Movers section
    moversEyebrow: "Professions · année sur année",
    growingTitle: "Où la demande grimpe le plus vite",
    growingNote: "Grands groupes professionnels (CNP) en hausse d’une année à l’autre.",
    growingEmpty: "Aucun grand groupe n’a progressé sur un an ce mois-ci.",
    coolingTitle: "Où la demande ralentit le plus",
    coolingNote: "Les grands groupes accusant les plus fortes baisses sur un an.",
    coolingEmpty: "Aucun grand groupe n’a reculé sur un an ce mois-ci.",

    // Regional snapshot
    regionalEyebrow: "Aperçu régional",
    regionalTitle: "Offres actives par province ce mois-ci",
    regionalNote: "Nombre d’offres actives. Voir Géographie pour les vues par habitant et de concentration.",
    fullMap: "Carte complète →",

    // ApiDown error card
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "L’API ne répond pas. Démarrez-la avec",
    apiDownCmd: "uvicorn api.main:app --port 8530",
  },
} as const;
