// Static UI copy for app/occupations/page.tsx (the Occupations page).
// Figure bodies come from the API (the redesign2 Plotly factories, served via
// the figure bridge); only the page chrome and figure framing live here.
// EN titles/notes mirror each factory's titled() HEADLINE/SUBTITLE; FR matches
// the voice of page-pulse.ts. Descriptive demand signals only — no causal claims.

export const occupationsDict = {
  en: {
    // Hero
    eyebrow: "Occupations",
    hero: "What work Canada is hiring for, and how the mix is shifting",
    lede: "A national read on posted hiring demand across Canada’s broad occupational groups (NOC). Job ads measure posted demand — not employment or vacancies.",

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
        eyebrow: "Demand by volume · through time",
        title: "What work is in demand: occupation groups by volume",
        note: "Area ∝ postings in the selected year. Drag the slider or press play to move through time. “Unknown” = postings without an assigned NOC code, not an occupation group.",
        aria: "Treemap of occupation groups by postings, with a year slider to scrub through time",
      },
      indexedLines: {
        eyebrow: "Growth since 2019",
        title: "Which occupation groups grew fastest since 2019",
        note: "Each group indexed to its 2019 average; fastest and slowest movers highlighted.",
        aria: "Indexed lines of each occupation group’s postings relative to its 2019 average",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "What changed most: contribution to growth, 2019 onward",
        note: "Each group’s share of the total change in postings; bars sum to the headline (accounting, not causation).",
        aria: "Horizontal bars showing each occupation group’s contribution in percentage points to the total change",
      },
      waterfall: {
        eyebrow: "Reconciling the change",
        title: "Reconciling the change: 2019 to today, group by group",
        note: "The parts sum to the whole — start total, each group’s change, end total.",
        aria: "Waterfall from the 2019 total through each group’s change to the latest total",
      },
      dumbbell: {
        eyebrow: "Then versus now",
        title: "Shift in demand by occupation group, 2019 to today",
        note: "Each line connects the two periods; colour marks the direction of the shift.",
        aria: "Dumbbell chart connecting each occupation group’s 2019 and latest monthly postings",
      },
      skillChurn: {
        eyebrow: "Skill churn",
        title: "Which skills are entering vs leaving demand, 2019 → 2024",
        note: "Top risers (teal) and fallers (orange) by change in posting volume · skills with ≥150 postings in 2019.",
        aria: "Diverging bar chart of the skills rising and falling fastest in posting demand since 2019",
      },
      aiExposure: {
        eyebrow: "AI exposure · Eloundou β",
        title: "AI exposure vs demand: where hiring is moving",
        note: "Eloundou et al. β (US task-based, mapped to NOC) vs demand change since 2019 · bubble ∝ volume. A potential-exposure signal, not realized automation, and not a forecast.",
        aria: "Scatter plot of AI task exposure against demand change for each broad occupation group, with quadrant reference lines",
      },
      nocNaicsHeatmap: {
        eyebrow: "Occupations by sector",
        title: "Which sectors demand which occupations",
        note: "Column-normalised: each industry’s postings split across occupation groups (last 12 months).",
        aria: "Heatmap of how each industry sector’s postings split across occupation groups",
      },
    },
  },
  fr: {
    // Hero
    eyebrow: "Professions",
    hero: "Pour quels métiers le Canada recrute, et comment la composition évolue",
    lede: "Un bilan national de la demande d’emploi affichée dans les grands groupes professionnels (CNP) au Canada. Les offres mesurent la demande affichée — non l’emploi ni les postes vacants.",

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
        eyebrow: "Demande par volume · au fil du temps",
        title: "Quels métiers sont en demande : groupes professionnels par volume",
        note: "Surface ∝ offres de l’année sélectionnée. Utilisez le curseur ou lancez la lecture pour parcourir le temps. « Inconnu » = offres sans code CNP attribué, pas un groupe professionnel.",
        aria: "Carte proportionnelle des groupes professionnels par offres, avec un curseur annuel pour parcourir le temps",
      },
      indexedLines: {
        eyebrow: "Croissance depuis 2019",
        title: "Quels groupes professionnels ont le plus progressé depuis 2019",
        note: "Chaque groupe indexé à sa moyenne de 2019 ; les variations les plus fortes et les plus faibles sont mises en évidence.",
        aria: "Lignes indexées des offres de chaque groupe professionnel par rapport à sa moyenne de 2019",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Ce qui a le plus changé : contribution à la croissance, depuis 2019",
        note: "Part de chaque groupe dans la variation totale des offres ; les barres somment au chiffre principal (comptabilité, non causalité).",
        aria: "Barres horizontales montrant la contribution de chaque groupe professionnel, en points de pourcentage, à la variation totale",
      },
      waterfall: {
        eyebrow: "Réconcilier la variation",
        title: "Réconcilier la variation : de 2019 à aujourd’hui, groupe par groupe",
        note: "Les parties somment au tout — total de départ, variation de chaque groupe, total final.",
        aria: "Cascade allant du total de 2019, par la variation de chaque groupe, jusqu’au total le plus récent",
      },
      dumbbell: {
        eyebrow: "Avant et maintenant",
        title: "Évolution de la demande par groupe professionnel, de 2019 à aujourd’hui",
        note: "Chaque ligne relie les deux périodes ; la couleur indique le sens de l’évolution.",
        aria: "Graphique en haltères reliant les offres mensuelles de chaque groupe professionnel en 2019 et à la période récente",
      },
      skillChurn: {
        eyebrow: "Renouvellement des compétences",
        title: "Quelles compétences entrent ou sortent de la demande, 2019 → 2024",
        note: "Plus fortes hausses (sarcelle) et baisses (orange) selon la variation du volume d’offres · compétences avec ≥150 offres en 2019.",
        aria: "Diagramme à barres divergentes des compétences qui montent et descendent le plus vite dans la demande depuis 2019",
      },
      aiExposure: {
        eyebrow: "Exposition à l'IA · β Eloundou",
        title: "Exposition à l'IA et demande : où l'embauche se déplace",
        note: "β d'Eloundou et al. (basée sur les tâches aux É.-U., rattachée à la CNP) vs variation de la demande depuis 2019 · bulle ∝ volume. Un signal d'exposition potentielle, non d'automatisation réalisée, et non une prévision.",
        aria: "Nuage de points de l'exposition des tâches à l'IA en fonction de la variation de la demande pour chaque grand groupe professionnel, avec des lignes de référence en quadrants",
      },
      nocNaicsHeatmap: {
        eyebrow: "Professions par secteur",
        title: "Quels secteurs demandent quelles professions",
        note: "Normalisé par colonne : la répartition des offres de chaque industrie entre les groupes professionnels (12 derniers mois).",
        aria: "Carte de chaleur de la répartition des offres de chaque secteur industriel entre les groupes professionnels",
      },
    },
  },
} as const;
