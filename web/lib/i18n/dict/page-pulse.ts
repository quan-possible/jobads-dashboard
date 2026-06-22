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

    // Movers section — one diverging chart, growth + decline on one scale
    moversEyebrow: "Occupations · year over year",
    moversTitle: "Biggest movers in hiring demand",
    moversNote: "Broad occupational groups (NOC) with the largest year-over-year change, growth and decline on one scale.",
    moversEmpty: "No broad group changed year over year this month.",
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
    regionalValueLabel: "Postings",
    trendLabel: "24-mo trend",
    fullMap: "Full map →",

    // Seasonality heatmap
    seasonalityEyebrow: "Seasonality · month by year",
    seasonalityTitle: "When hiring picks up through the year",
    seasonalityNote: "Each cell is that month's active postings relative to its own year's average (1.00× = average), so the seasonal shape shows through the long-run trend. Hover for exact values.",
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

    // ApiDown error card
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn’t responding. Start it with",
    apiDownCmd: "uvicorn api.main:app --port 8530",

    // Section dividers (Core → Deep)
    deepEyebrow: "Going deeper",
    deepLede: "Decomposition and diagnostics for readers who want the mechanics behind the headline.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandRibbon: {
        eyebrow: "Posting demand over time",
        title: "Labour demand: monthly job-ad postings",
        note: "Faint line = raw monthly count · bold = 3-month average · dotted tail = provisional.",
        aria: "Monthly job-ad postings with a 3-month average and a provisional tail",
      },
      yoyBars: {
        eyebrow: "Year over year",
        title: "Growth and decline in postings, year over year",
        note: "Each bar compares a month with the same month a year earlier.",
        aria: "Year-over-year percentage change in postings, by month",
      },
      seasonality: {
        eyebrow: "Seasonality · month by year",
        title: "When in the year is demand strongest?",
        note: "Each cell is that month relative to its own year’s average, so the seasonal shape shows through the trend.",
        aria: "Heatmap of monthly demand relative to each year’s average",
      },
      composition: {
        eyebrow: "Occupational mix",
        title: "How the occupational mix shifts over time",
        note: "Share of monthly postings by broad occupation group (top groups + Other).",
        aria: "Stacked area of posting share by broad occupation group over time",
      },
      stl: {
        eyebrow: "Decomposition",
        title: "Trend, season and shock, pulled apart",
        note: "Classical additive decomposition (a dependency-free stand-in for STL); COVID lands in the remainder.",
        aria: "Four-panel decomposition: observed, trend, seasonal and remainder",
      },
      anomaly: {
        eyebrow: "Anomalies",
        title: "Surprises versus the seasonal expectation",
        note: "Robust z-score on the decomposition remainder; |z| > 3 (orange) flags an anomaly.",
        aria: "Bar chart of robust z-scores flagging anomalous months",
      },
      saVsNsa: {
        eyebrow: "Seasonal adjustment",
        title: "Seasonally adjusted versus raw demand",
        note: "Seasonally adjusted ≈ observed − seasonal (decomposition-based, approximate — not an official X-13 series).",
        aria: "Seasonally adjusted demand against the raw series",
      },
      diffusion: {
        eyebrow: "Breadth of growth",
        title: "Is growth broad or narrow?",
        note: "Share of broad occupation groups with positive year-over-year demand; 50 = evenly split.",
        aria: "Diffusion index of occupation groups with positive year-over-year demand",
      },
      cycle: {
        eyebrow: "Seasonal cycle",
        title: "Each month’s trend across the years",
        note: "Within each panel the line runs 2016 → 2026; the orange line marks that month’s mean.",
        aria: "Cycle plot of each calendar month’s trend across years",
      },
    },
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

    // Movers section — un seul graphique divergent
    moversEyebrow: "Professions · année sur année",
    moversTitle: "Plus fortes variations de la demande",
    moversNote: "Grands groupes professionnels (CNP) avec la plus forte variation sur un an, hausse et baisse sur une même échelle.",
    moversEmpty: "Aucun grand groupe n’a varié sur un an ce mois-ci.",
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
    regionalValueLabel: "Offres",
    trendLabel: "Tendance 24 mois",
    fullMap: "Carte complète →",

    // Seasonality heatmap
    seasonalityEyebrow: "Saisonnalité · mois par année",
    seasonalityTitle: "Quand l'embauche s'accélère dans l'année",
    seasonalityNote: "Chaque cellule représente les offres actives du mois par rapport à la moyenne de son année (1,00× = moyenne), pour révéler la forme saisonnière au-delà de la tendance de fond. Survolez pour les valeurs exactes.",
    monthsShort: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],

    // ApiDown error card
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "L’API ne répond pas. Démarrez-la avec",
    apiDownCmd: "uvicorn api.main:app --port 8530",

    // Section dividers (Core → Deep)
    deepEyebrow: "Pour aller plus loin",
    deepLede: "Décomposition et diagnostics pour qui veut la mécanique derrière le chiffre principal.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandRibbon: {
        eyebrow: "Demande affichée au fil du temps",
        title: "Demande de travail : offres d’emploi mensuelles",
        note: "Ligne pâle = total mensuel brut · ligne grasse = moyenne sur 3 mois · pointillé = provisoire.",
        aria: "Offres d’emploi mensuelles avec moyenne sur trois mois et fin provisoire",
      },
      yoyBars: {
        eyebrow: "D’une année à l’autre",
        title: "Hausse et baisse des offres, sur un an",
        note: "Chaque barre compare un mois au même mois un an plus tôt.",
        aria: "Variation en pourcentage des offres sur un an, par mois",
      },
      seasonality: {
        eyebrow: "Saisonnalité · mois par année",
        title: "Quand la demande est-elle la plus forte dans l’année ?",
        note: "Chaque cellule représente le mois par rapport à la moyenne de son année, révélant la forme saisonnière au-delà de la tendance.",
        aria: "Carte de chaleur de la demande mensuelle par rapport à la moyenne annuelle",
      },
      composition: {
        eyebrow: "Composition professionnelle",
        title: "Comment la composition professionnelle évolue",
        note: "Part des offres mensuelles par grand groupe professionnel (principaux groupes + Autres).",
        aria: "Aires empilées de la part des offres par grand groupe professionnel dans le temps",
      },
      stl: {
        eyebrow: "Décomposition",
        title: "Tendance, saison et choc, séparés",
        note: "Décomposition additive classique (substitut sans dépendance à STL) ; la COVID se loge dans le résidu.",
        aria: "Décomposition en quatre panneaux : observé, tendance, saisonnier et résidu",
      },
      anomaly: {
        eyebrow: "Anomalies",
        title: "Les surprises par rapport à l’attente saisonnière",
        note: "Cote z robuste sur le résidu de la décomposition ; |z| > 3 (orange) signale une anomalie.",
        aria: "Diagramme à barres des cotes z robustes signalant les mois anormaux",
      },
      saVsNsa: {
        eyebrow: "Ajustement saisonnier",
        title: "Demande désaisonnalisée et demande brute",
        note: "Désaisonnalisée ≈ observée − saisonnière (basée sur la décomposition, approximative — pas une série X-13 officielle).",
        aria: "Demande désaisonnalisée par rapport à la série brute",
      },
      diffusion: {
        eyebrow: "Ampleur de la croissance",
        title: "La croissance est-elle large ou étroite ?",
        note: "Part des grands groupes professionnels en hausse sur un an ; 50 = partagé également.",
        aria: "Indice de diffusion des groupes professionnels en hausse sur un an",
      },
      cycle: {
        eyebrow: "Cycle saisonnier",
        title: "La tendance de chaque mois au fil des années",
        note: "Dans chaque panneau, la ligne va de 2016 à 2026 ; la ligne orange marque la moyenne du mois.",
        aria: "Graphique cyclique de la tendance de chaque mois civil au fil des années",
      },
    },
  },
} as const;
