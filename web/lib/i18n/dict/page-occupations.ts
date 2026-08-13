// Static UI copy for app/occupations/page.tsx (the Occupations page).
// Figure bodies come from the API (the redesign2 Plotly factories, served via
// the figure bridge); only the page chrome and figure framing live here.
// EN titles/notes mirror each factory's titled() HEADLINE/SUBTITLE; FR matches
// the voice of page-pulse.ts. Descriptive posting signals only — no causal claims.

export const occupationsDict = {
  en: {
    // Hero
    eyebrow: "Occupations",
    hero: "Job postings by occupation",
    lede: "Compare volume, growth and skills across broad NOC groups.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "More detail",
    deepLede: "Contributions, skills and industry links.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      treemap: {
        eyebrow: "Volume over time",
        title: "Postings by occupation",
        note: "Area = postings. “Unknown” has no assigned NOC code.",
        aria: "Treemap of occupation groups by postings, with a year slider to scrub through time",
      },
      indexedLines: {
        eyebrow: "Indexed growth",
        title: "Posting growth by occupation",
        note: "Base-year average = 100.",
        aria: "Indexed lines of each occupation group’s postings relative to its base-year average",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "Contribution to posting growth",
        note: "Bars sum to the total change; accounting, not causation.",
        aria: "Horizontal bars showing each occupation group’s contribution in percentage points to the total change",
      },
      waterfall: {
        eyebrow: "Reconciling the change",
        title: "Change by occupation",
        note: "Start total + group changes = end total.",
        aria: "Waterfall from the base-year total through each group’s change to the end-year total",
      },
      dumbbell: {
        eyebrow: "Then versus now",
        title: "Postings by occupation: then and now",
        note: "Each line connects the selected years.",
        aria: "Dumbbell chart connecting each occupation group’s base-year and end-year monthly postings",
      },
      skillChurn: {
        eyebrow: "Skill churn",
        title: "Skills gaining and losing share",
        note: "Change in mention share; at least 150 mentions in either year.",
        aria: "Diverging bar chart of the skills gaining and losing the most share of skill mentions between the chosen years",
      },
      aiExposure: {
        eyebrow: "AI exposure · Eloundou β",
        title: "AI exposure and posting change",
        note: "Bubble = volume. Exposure is task-based, not realized automation or a forecast.",
        aria: "Scatter plot of AI task exposure against posting change for each broad occupation group, with quadrant reference lines",
      },
      nocNaicsHeatmap: {
        eyebrow: "Occupations by sector",
        title: "Occupation mix by industry",
        note: "Each column shows an industry’s posting mix.",
        aria: "Heatmap of how each industry sector’s postings split across occupation groups",
      },
    },
  },
  fr: {
    // Hero
    eyebrow: "Professions",
    hero: "Offres d’emploi par profession",
    lede: "Comparez le volume, la croissance et les compétences par grand groupe CNP.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Plus de détails",
    deepLede: "Contributions, compétences et liens sectoriels.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      treemap: {
        eyebrow: "Volume au fil du temps",
        title: "Offres par profession",
        note: "Surface = offres. « Inconnu » signifie qu’aucun code CNP n’est attribué.",
        aria: "Carte proportionnelle des groupes professionnels par offres, avec un curseur annuel pour parcourir le temps",
      },
      indexedLines: {
        eyebrow: "Croissance indexée",
        title: "Croissance des offres par profession",
        note: "Moyenne de l’année de base = 100.",
        aria: "Lignes indexées des offres de chaque groupe professionnel par rapport à sa moyenne de l’année de base",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Contribution à la croissance des offres",
        note: "Les barres totalisent la variation; identité comptable, non causale.",
        aria: "Barres horizontales montrant la contribution de chaque groupe professionnel, en points de pourcentage, à la variation totale",
      },
      waterfall: {
        eyebrow: "Réconcilier la variation",
        title: "Variation par profession",
        note: "Total initial + variations des groupes = total final.",
        aria: "Cascade allant du total de l’année de base, par la variation de chaque groupe, jusqu’au total de l’année finale",
      },
      dumbbell: {
        eyebrow: "Avant et maintenant",
        title: "Offres par profession : avant et maintenant",
        note: "Chaque ligne relie les années choisies.",
        aria: "Graphique en haltères reliant les offres mensuelles de chaque groupe professionnel pour l’année de base et l’année finale",
      },
      skillChurn: {
        eyebrow: "Renouvellement des compétences",
        title: "Compétences en hausse et en baisse",
        note: "Variation de la part des mentions; au moins 150 mentions dans l’une ou l’autre année.",
        aria: "Diagramme à barres divergentes des compétences qui gagnent et perdent le plus de part des mentions entre les années choisies",
      },
      aiExposure: {
        eyebrow: "Exposition à l'IA · β Eloundou",
        title: "Exposition à l’IA et variation des offres",
        note: "Bulle = volume. L’exposition repose sur les tâches; ce n’est ni une prévision ni un taux d’automatisation.",
        aria: "Nuage de points de l'exposition des tâches à l'IA en fonction de la variation des offres pour chaque grand groupe professionnel, avec des lignes de référence en quadrants",
      },
      nocNaicsHeatmap: {
        eyebrow: "Professions par secteur",
        title: "Composition professionnelle par industrie",
        note: "Chaque colonne montre la composition des offres d’une industrie.",
        aria: "Carte de chaleur de la répartition des offres de chaque secteur industriel entre les groupes professionnels",
      },
    },
  },
} as const;
