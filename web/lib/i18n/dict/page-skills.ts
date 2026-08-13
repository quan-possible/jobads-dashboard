// Self-contained i18n dict for the Skills page and its private components:
// SkillBars and ShareBars (used only by this page).
//
// DO NOT translate: skill names, group labels, occupation/industry labels,
// numbers, percentages, lift/share values, or any API-derived copy.

export const skillsDict = {
  en: {
    // Hero section
    heroEyebrowPrefix: "Skills & requirements",
    heroTitle: "Skills and requirements",
    heroLede: "Skills, education and experience named in job postings.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCode: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Requirements",
    deepLede: "Distinctive skills, education and experience.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      topSkillsTrend: {
        eyebrow: "Most-requested skills · trend",
        title: "Skill mention index",
        note: "Base-year average = 100.",
        aria: "Indexed line chart of the most-requested skills relative to a chosen base year",
      },
      aiSkillDiffusion: {
        eyebrow: "AI skills · diffusion",
        title: "AI skill mentions",
        note: "Share of skill mentions · faint = monthly · bold = 3-month average.",
        aria: "Line chart of AI skills as a share of all skill mentions over time",
      },
      skillLift: {
        eyebrow: "Compared with national share",
        title: "Skills more common by occupation",
        note: "Occupation share ÷ national share.",
        aria: "Horizontal bars of skills ranked by lift over the national share",
      },
      skillOccupationHeatmap: {
        eyebrow: "Skills × occupations",
        title: "Skills by occupation",
        note: "Each column shows the occupation’s skill mix.",
        aria: "Heatmap of the top skills against broad occupation groups, column-normalised",
      },
      education: {
        eyebrow: "Requirements · education",
        title: "Education requirements",
        note: "",
        aria: "Stacked area of posting share by stated education requirement over time",
      },
      experience: {
        eyebrow: "Requirements · experience",
        title: "Experience requirements",
        note: "",
        aria: "Stacked area of posting share by advertised years-of-experience band over time",
      },
    },
  },

  fr: {
    // Hero section
    heroEyebrowPrefix: "Compétences et exigences",
    heroTitle: "Compétences et exigences",
    heroLede: "Compétences, scolarité et expérience mentionnées dans les offres.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCode: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Exigences",
    deepLede: "Compétences distinctives, scolarité et expérience.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      topSkillsTrend: {
        eyebrow: "Compétences les plus requises · tendance",
        title: "Indice des mentions de compétences",
        note: "Moyenne de l’année de base = 100.",
        aria: "Graphique linéaire indexé des compétences les plus requises par rapport à une année de base choisie",
      },
      aiSkillDiffusion: {
        eyebrow: "Compétences en IA · diffusion",
        title: "Mentions de compétences en IA",
        note: "Part des mentions · pâle = mensuel · gras = moyenne sur 3 mois.",
        aria: "Graphique linéaire des compétences en IA en part de toutes les mentions de compétences au fil du temps",
      },
      skillLift: {
        eyebrow: "Par rapport à la part nationale",
        title: "Compétences plus courantes par profession",
        note: "Part de la profession ÷ part nationale.",
        aria: "Barres horizontales des compétences classées par indice de spécificité vs la part nationale",
      },
      skillOccupationHeatmap: {
        eyebrow: "Compétences × professions",
        title: "Compétences par profession",
        note: "Chaque colonne montre les compétences de la profession.",
        aria: "Carte de chaleur des principales compétences par grand groupe professionnel, normalisée par colonne",
      },
      education: {
        eyebrow: "Exigences · scolarité",
        title: "Exigences de scolarité",
        note: "",
        aria: "Aires empilées de la part des offres par exigence de scolarité indiquée dans le temps",
      },
      experience: {
        eyebrow: "Exigences · expérience",
        title: "Exigences d’expérience",
        note: "",
        aria: "Aires empilées de la part des offres par bande d’années d’expérience annoncée dans le temps",
      },
    },
  },
} as const;
