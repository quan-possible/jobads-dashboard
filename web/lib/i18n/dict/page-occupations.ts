// Static UI copy for app/occupations/page.tsx (the Occupations page).
// Figure bodies come from the API (the redesign2 Plotly factories, served via
// the figure bridge); only the page chrome and figure framing live here.
// EN titles/notes mirror each factory's titled() HEADLINE/SUBTITLE; FR matches
// the voice of page-pulse.ts. Descriptive posting signals only — no causal claims.

export const occupationsDict = {
  en: {
    // Hero
    eyebrow: "Occupations",
    hero: "What work Canada is hiring for, and how the mix is shifting",
    lede: "A national read on posted hiring across Canada’s broad occupational groups (NOC). Job ads measure posted demand — not employment or vacancies.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn’t responding. Start it with",
    apiDownCmd: "uvicorn api.main:app --port 8530",

    // Section dividers (Core → Deep)
    deepEyebrow: "Going deeper",
    deepLede: "Composition, contribution and concentration for readers who want the structure behind the headline.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      treemap: {
        eyebrow: "Postings by volume · through time",
        title: "What work is most posted: occupation groups by volume",
        note: "Area ∝ postings in the selected year. Drag the slider or press play to move through time. “Unknown” = postings without an assigned NOC code, not an occupation group. Counts partly reflect scraping coverage over time, not hiring alone.",
        aria: "Treemap of occupation groups by postings, with a year slider to scrub through time",
      },
      indexedLines: {
        eyebrow: "Indexed growth",
        title: "Which occupation groups grew fastest",
        note: "Each group indexed to its base-year average; fastest and slowest movers highlighted. Choose the base year, top-right.",
        aria: "Indexed lines of each occupation group’s postings relative to its base-year average",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "What changed most: contribution to growth",
        note: "Each group’s share of the total change in postings; bars sum to the headline (accounting, not causation).",
        aria: "Horizontal bars showing each occupation group’s contribution in percentage points to the total change",
      },
      waterfall: {
        eyebrow: "Reconciling the change",
        title: "Reconciling the change, group by group",
        note: "The parts sum to the whole — start total, each group’s change, end total.",
        aria: "Waterfall from the base-year total through each group’s change to the end-year total",
      },
      dumbbell: {
        eyebrow: "Then versus now",
        title: "Shift in postings by occupation group",
        note: "Each line connects the two chosen years; colour marks the direction of the shift.",
        aria: "Dumbbell chart connecting each occupation group’s base-year and end-year monthly postings",
      },
      skillChurn: {
        eyebrow: "Skill churn",
        title: "Which skills are gaining vs losing postings",
        note: "Gainers (teal) and losers (orange) by change in share of skill mentions · skills with ≥150 mentions in either year. Choose the years, top-right.",
        aria: "Diverging bar chart of the skills gaining and losing the most share of skill mentions between the chosen years",
      },
      aiExposure: {
        eyebrow: "AI exposure · Eloundou β",
        title: "AI exposure vs postings: where hiring is moving",
        note: "Eloundou et al. β (US task-based, mapped to NOC) vs posting change over the chosen window · bubble ∝ volume. A potential-exposure signal, not realized automation, and not a forecast.",
        aria: "Scatter plot of AI task exposure against posting change for each broad occupation group, with quadrant reference lines",
      },
      nocNaicsHeatmap: {
        eyebrow: "Occupations by sector",
        title: "Which sectors require which occupations",
        note: "Column-normalised: each industry’s postings split across occupation groups (last 12 months).",
        aria: "Heatmap of how each industry sector’s postings split across occupation groups",
      },
    },
  },
  fr: {
    // Hero
    eyebrow: "Professions",
    hero: "Pour quels métiers le Canada recrute, et comment la composition évolue",
    lede: "Un bilan national de l’embauche affichée dans les grands groupes professionnels (CNP) au Canada. Les offres mesurent la demande affichée — non l’emploi ni les postes vacants.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "L’API ne répond pas. Démarrez-la avec",
    apiDownCmd: "uvicorn api.main:app --port 8530",

    // Section dividers (Core → Deep)
    deepEyebrow: "Pour aller plus loin",
    deepLede: "Composition, contribution et concentration pour qui veut la structure derrière le chiffre principal.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      treemap: {
        eyebrow: "Offres par volume · au fil du temps",
        title: "Quels métiers sont les plus affichés : groupes professionnels par volume",
        note: "Surface ∝ offres de l’année sélectionnée. Utilisez le curseur ou lancez la lecture pour parcourir le temps. « Inconnu » = offres sans code CNP attribué, pas un groupe professionnel. Les nombres reflètent en partie la couverture de collecte au fil du temps, pas seulement l’embauche.",
        aria: "Carte proportionnelle des groupes professionnels par offres, avec un curseur annuel pour parcourir le temps",
      },
      indexedLines: {
        eyebrow: "Croissance indexée",
        title: "Quels groupes professionnels ont le plus progressé",
        note: "Chaque groupe indexé à sa moyenne de l’année de base ; les variations les plus fortes et les plus faibles sont mises en évidence. Choisissez l’année de base, en haut à droite.",
        aria: "Lignes indexées des offres de chaque groupe professionnel par rapport à sa moyenne de l’année de base",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Ce qui a le plus changé : contribution à la croissance",
        note: "Part de chaque groupe dans la variation totale des offres ; les barres somment au chiffre principal (comptabilité, non causalité).",
        aria: "Barres horizontales montrant la contribution de chaque groupe professionnel, en points de pourcentage, à la variation totale",
      },
      waterfall: {
        eyebrow: "Réconcilier la variation",
        title: "Réconcilier la variation, groupe par groupe",
        note: "Les parties somment au tout — total de départ, variation de chaque groupe, total final.",
        aria: "Cascade allant du total de l’année de base, par la variation de chaque groupe, jusqu’au total de l’année finale",
      },
      dumbbell: {
        eyebrow: "Avant et maintenant",
        title: "Évolution des offres par groupe professionnel",
        note: "Chaque ligne relie les deux années choisies ; la couleur indique le sens de l’évolution.",
        aria: "Graphique en haltères reliant les offres mensuelles de chaque groupe professionnel pour l’année de base et l’année finale",
      },
      skillChurn: {
        eyebrow: "Renouvellement des compétences",
        title: "Quelles compétences gagnent ou perdent des offres",
        note: "Hausses (sarcelle) et baisses (orange) selon la variation de la part des mentions · compétences avec ≥150 mentions dans l’une ou l’autre année. Choisissez les années, en haut à droite.",
        aria: "Diagramme à barres divergentes des compétences qui gagnent et perdent le plus de part des mentions entre les années choisies",
      },
      aiExposure: {
        eyebrow: "Exposition à l'IA · β Eloundou",
        title: "Exposition à l'IA et offres : où l'embauche se déplace",
        note: "β d'Eloundou et al. (basée sur les tâches aux É.-U., rattachée à la CNP) vs variation des offres sur la fenêtre choisie · bulle ∝ volume. Un signal d'exposition potentielle, non d'automatisation réalisée, et non une prévision.",
        aria: "Nuage de points de l'exposition des tâches à l'IA en fonction de la variation des offres pour chaque grand groupe professionnel, avec des lignes de référence en quadrants",
      },
      nocNaicsHeatmap: {
        eyebrow: "Professions par secteur",
        title: "Quels secteurs requièrent quelles professions",
        note: "Normalisé par colonne : la répartition des offres de chaque industrie entre les groupes professionnels (12 derniers mois).",
        aria: "Carte de chaleur de la répartition des offres de chaque secteur industriel entre les groupes professionnels",
      },
    },
  },
} as const;
