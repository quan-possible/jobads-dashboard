// Static UI copy for app/occupations/page.tsx (the Occupations page).
// Figure bodies come from the API (the dashboard Plotly factories, served via
// the figure bridge); only the page chrome and figure framing live here.
// EN titles/notes mirror each factory's titled() HEADLINE/SUBTITLE; FR matches
// the voice of page-pulse.ts. Descriptive posting signals only — no causal claims.

export const occupationsDict = {
  en: {
    // Hero
    eyebrow: "Occupations",
    hero: "Job postings by occupation",
    lede: "Volume, change and skills by broad occupation group.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Related measures",
    deepLede: "Change, skills and industries.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      treemap: {
        eyebrow: "Volume over time",
        title: "Postings by occupation",
        note: "Area = postings. “Unknown” has no occupation code.",
        aria: "Treemap of occupation groups by postings, with a year slider to scrub through time",
      },
      indexedLines: {
        eyebrow: "Indexed growth",
        title: "Posting index by occupation",
        note: "Base-year average = 100.",
        aria: "Indexed lines of each occupation group’s postings relative to its base-year average",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "Contributions to posting change",
        note: "Percentage-point contributions sum to the total change.",
        aria: "Horizontal bars showing each occupation group’s percentage-point contribution to the total posting change",
      },
      waterfall: {
        eyebrow: "Posting change",
        title: "Posting change by occupation",
        note: "Start + occupation changes = end.",
        aria: "Waterfall from the base-year total through each group’s change to the end-year total",
      },
      dumbbell: {
        eyebrow: "Selected years",
        title: "Postings in selected years",
        note: "",
        aria: "Dumbbell chart connecting each occupation group’s base-year and end-year monthly postings",
      },
      skillChurn: {
        eyebrow: "Skill share",
        title: "Changes in skill share",
        note: "At least 150 mentions in either year.",
        aria: "Diverging bar chart of the skills gaining and losing the most share of skill mentions between the chosen years",
      },
      aiExposure: {
        eyebrow: "Task exposure",
        title: "Task exposure and posting change",
        note: "Bubble size = postings. Task exposure, not automation.",
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
    lede: "Volume, variation et compétences par grand groupe professionnel.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Mesures connexes",
    deepLede: "Variation, compétences et industries.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      treemap: {
        eyebrow: "Volume au fil du temps",
        title: "Offres par profession",
        note: "Surface = offres. « Inconnu » signifie qu’aucun code de profession n’est attribué.",
        aria: "Carte proportionnelle des groupes professionnels par offres, avec un curseur annuel pour parcourir le temps",
      },
      indexedLines: {
        eyebrow: "Croissance indexée",
        title: "Indice des offres par profession",
        note: "Moyenne de l’année de base = 100.",
        aria: "Lignes indexées des offres de chaque groupe professionnel par rapport à sa moyenne de l’année de base",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Contributions à la variation des offres",
        note: "Les contributions en points de pourcentage totalisent la variation.",
        aria: "Barres horizontales montrant la contribution de chaque groupe professionnel à la variation totale des offres, en points de pourcentage",
      },
      waterfall: {
        eyebrow: "Variation des offres",
        title: "Variation des offres par profession",
        note: "Début + variations des professions = fin.",
        aria: "Cascade allant du total de l’année de base, par la variation de chaque groupe, jusqu’au total de l’année finale",
      },
      dumbbell: {
        eyebrow: "Années choisies",
        title: "Offres pendant les années choisies",
        note: "",
        aria: "Graphique en haltères reliant les offres mensuelles de chaque groupe professionnel pour l’année de base et l’année finale",
      },
      skillChurn: {
        eyebrow: "Part des compétences",
        title: "Variation de la part des compétences",
        note: "Au moins 150 mentions dans l’une ou l’autre année.",
        aria: "Diagramme à barres divergentes des compétences qui gagnent et perdent le plus de part des mentions entre les années choisies",
      },
      aiExposure: {
        eyebrow: "Exposition des tâches",
        title: "Exposition des tâches et variation des offres",
        note: "Taille des bulles = offres. Exposition des tâches, pas l’automatisation.",
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
