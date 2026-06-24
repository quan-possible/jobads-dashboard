// Static UI copy for app/page.tsx (the Pulse home page).
// API-derived strings (headline sentence, key_points, occupation/industry/skill
// labels, province names, and numbers) are NOT translated here — they remain
// as returned by the API or composed from API data in the page.

export const pulseDict = {
  en: {
    // Hero
    eyebrowPrefix: "Labour Market Pulse",
    lede: "A monthly read on posted hiring across Canada’s regions, occupations and industries. Job ads measure posted demand — not employment or vacancies.",
    // Headline composed from the postings index ({pct} = |gap|, {dir} = above/below).
    heroFallback: "Canada’s hiring",
    heroTemplate: "Canada’s hiring is {pct}% {dir} its 2019 baseline",
    heroAbove: "above",
    heroBelow: "below",

    // KPI tile labels
    kpiDemandLabel: "Postings index",
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

    // Postings chart Figure
    demandEyebrow: "Postings over time",
    demandTitle: "Postings relative to the pre-pandemic norm",
    demandNote: "Index of monthly active postings, January 2019 = 100. Hover for monthly values.",
    keyPointsTitle: "What stands out",
    keyPointsNote: "Descriptive signals only — postings show posted demand, not causes.",

    // Movers section — one diverging chart, growth + decline on one scale
    moversEyebrow: "Occupations · year over year",
    moversTitle: "Biggest movers in hiring",
    moversNote: "Broad occupational groups (NOC) with the largest year-over-year change, growth and decline on one scale.",
    moversEmpty: "No broad group changed year over year this month.",
    growingTitle: "Where hiring is climbing fastest",
    growingNote: "Broad occupational groups (NOC) with rising year-over-year postings.",
    growingEmpty: "No broad group grew year over year this month.",
    coolingTitle: "Where hiring is cooling most",
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
        eyebrow: "Postings over time",
        title: "Posted hiring: monthly job-ad postings",
        note: "Faint line = raw monthly count · bold = 3-month average · dotted tail = provisional. Counts partly reflect scraping coverage over time, not hiring alone.",
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
        title: "When in the year are postings strongest?",
        note: "Each cell is that month relative to its own year’s average, so the seasonal shape shows through the trend.",
        aria: "Heatmap of monthly postings relative to each year’s average",
      },
      composition: {
        eyebrow: "Occupational mix",
        title: "How the occupational mix shifts over time",
        note: "Share of monthly postings by broad occupation group (top groups + Other).",
        aria: "Stacked area of posting share by broad occupation group over time",
      },
      occupationTrends: {
        eyebrow: "Occupation small-multiples",
        title: "Every occupation group’s posting trajectory at a glance",
        note: "Monthly postings 2016–2026, one panel per broad NOC group (each panel scaled to its own peak).",
        aria: "Grid of sparkline trends, one per broad occupation group",
      },
      momentum: {
        eyebrow: "Momentum",
        title: "Is hiring speeding up or cooling?",
        note: "Gap between the 3-month and 12-month averages · teal = accelerating, orange = cooling.",
        aria: "Bar chart of the gap between the 3-month and 12-month moving averages",
      },
      diffusion: {
        eyebrow: "Breadth of growth",
        title: "Is growth broad or narrow?",
        note: "Share of broad occupation groups with positive year-over-year postings; 50 = evenly split (3-month smoothed).",
        aria: "Diffusion index of occupation groups with positive year-over-year postings",
      },
    },
  },
  fr: {
    // Hero
    eyebrowPrefix: "Pouls du marché du travail",
    lede: "Un bilan mensuel de l’embauche affichée dans les régions, professions et industries au Canada. Les offres mesurent la demande affichée — non l’emploi ni les postes vacants.",
    heroFallback: "L’embauche au Canada",
    heroTemplate: "L’embauche au Canada est {pct} % {dir} son niveau de référence de 2019",
    heroAbove: "au-dessus de",
    heroBelow: "en dessous de",

    // KPI tile labels
    kpiDemandLabel: "Indice des offres",
    kpiDemandContext: "2019 = 100",
    kpiDemandDeltaLabel: "vs référence",
    kpiPostingsLabel: "Offres actives",
    kpiPostingsContext: "ce mois-ci",
    kpiPostingsDeltaLabel: "m/m",
    kpiYoyLabel: "Vs l’an dernier",
    kpiYoyContext: "d’une année à l’autre",
    kpiWageLabel: "Salaire médian",
    kpiWageUnit: "/h",
    kpiWageInsufficient: "échantillon insuffisant",

    // Postings chart Figure
    demandEyebrow: "Offres au fil du temps",
    demandTitle: "Offres par rapport à la norme pré-pandémique",
    demandNote: "Indice des offres actives mensuelles, janvier 2019 = 100. Survolez pour les valeurs mensuelles.",
    keyPointsTitle: "Ce qui ressort",
    keyPointsNote: "Signaux descriptifs seulement — les offres montrent la demande affichée, pas les causes.",

    // Movers section — un seul graphique divergent
    moversEyebrow: "Professions · année sur année",
    moversTitle: "Plus fortes variations de l’embauche",
    moversNote: "Grands groupes professionnels (CNP) avec la plus forte variation sur un an, hausse et baisse sur une même échelle.",
    moversEmpty: "Aucun grand groupe n’a varié sur un an ce mois-ci.",
    growingTitle: "Où l’embauche grimpe le plus vite",
    growingNote: "Grands groupes professionnels (CNP) en hausse d’une année à l’autre.",
    growingEmpty: "Aucun grand groupe n’a progressé sur un an ce mois-ci.",
    coolingTitle: "Où l’embauche ralentit le plus",
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
        eyebrow: "Offres au fil du temps",
        title: "Embauche affichée : offres d’emploi mensuelles",
        note: "Ligne pâle = total mensuel brut · ligne grasse = moyenne sur 3 mois · pointillé = provisoire. Les nombres reflètent en partie la couverture de collecte au fil du temps, pas seulement l’embauche.",
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
        title: "Quand les offres sont-elles les plus fortes dans l’année ?",
        note: "Chaque cellule représente le mois par rapport à la moyenne de son année, révélant la forme saisonnière au-delà de la tendance.",
        aria: "Carte de chaleur des offres mensuelles par rapport à la moyenne annuelle",
      },
      composition: {
        eyebrow: "Composition professionnelle",
        title: "Comment la composition professionnelle évolue",
        note: "Part des offres mensuelles par grand groupe professionnel (principaux groupes + Autres).",
        aria: "Aires empilées de la part des offres par grand groupe professionnel dans le temps",
      },
      occupationTrends: {
        eyebrow: "Petits multiples · professions",
        title: "La trajectoire des offres de chaque groupe professionnel d’un coup d’œil",
        note: "Offres mensuelles 2016–2026, un panneau par grand groupe de la CNP (chaque panneau à l’échelle de son propre sommet).",
        aria: "Grille de mini-tendances, une par grand groupe professionnel",
      },
      momentum: {
        eyebrow: "Dynamique",
        title: "L’embauche accélère-t-elle ou ralentit-elle ?",
        note: "Écart entre la moyenne sur 3 mois et celle sur 12 mois · sarcelle = accélère, orange = ralentit.",
        aria: "Diagramme à barres de l’écart entre les moyennes mobiles sur 3 et 12 mois",
      },
      diffusion: {
        eyebrow: "Ampleur de la croissance",
        title: "La croissance est-elle large ou étroite ?",
        note: "Part des grands groupes professionnels en hausse sur un an ; 50 = partagé également (lissé sur 3 mois).",
        aria: "Indice de diffusion des groupes professionnels en hausse sur un an",
      },
    },
  },
} as const;
