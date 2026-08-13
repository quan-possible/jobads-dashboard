// Self-contained i18n dict for the Skills page and its private components:
// SkillBars and ShareBars (used only by this page).
//
// DO NOT translate: skill names, group labels, occupation/industry labels,
// numbers, percentages, lift/share values, or any API-derived copy.

export const skillsDict = {
  en: {
    // Hero section
    heroEyebrowPrefix: "Skills & requirements",
    heroTitle: "Skills and requirements in job postings",
    heroLede: "Compare requested skills, education, experience and work arrangements.",

    // Most-requested skills section
    mostRequestedEyebrow: "Share of postings · skills",
    mostRequestedTitle: "Most-requested skills",
    mostRequestedNote: (n: string) => `Among the ${n} postings that list skills.`,

    // Distinctive skills section
    distinctiveEyebrow: "Vs the national mix",
    distinctiveTitle: "What’s distinctive here",
    distinctiveNote: "Lift = local share ÷ national share.",
    distinctiveHint: "Use the filters to compare groups.",

    // Requirements section
    reqEyebrowEducation: "Requirements · education",
    reqTitleEducation: "Education",
    reqNoteEducation: "Postings with a stated education requirement only.",
    reqEyebrowExperience: "Requirements · experience",
    reqTitleExperience: "Experience",
    reqEyebrowLanguage: "Requirements · work language",
    reqTitleLanguage: "Work language",
    reqEyebrowRemote: "Requirements · remote work",
    reqTitleRemote: "Remote work",
    reqNoteRemote: "Postings with a stated work arrangement only.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCode: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // SkillBars aria-labels
    skillBarsShareLabel: "Most-requested skills by share of postings",
    skillBarsLiftLabel: "Distinctive skills by lift over national average",
    skillBarsEmpty: "No data for this selection.",
    liftRefLabel: "1× = national average",

    // ShareBars aria-label / empty
    shareBarsLabel: "Category share breakdown",
    shareBarsEmpty: "No data for this selection.",

    // Section dividers (Core → Deep)
    deepEyebrow: "More detail",
    deepLede: "Skill trends and requirement patterns.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      topSkillsTrend: {
        eyebrow: "Most-requested skills · trend",
        title: "Trends in requested skills",
        note: "Base-year average = 100.",
        aria: "Indexed line chart of the most-requested skills relative to a chosen base year",
      },
      aiSkillDiffusion: {
        eyebrow: "AI skills · diffusion",
        title: "AI skills in job postings",
        note: "Share of skill mentions · faint = monthly · bold = 3-month average.",
        aria: "Line chart of AI skills as a share of all skill mentions over time",
      },
      skillLift: {
        eyebrow: "Distinctive skills · lift",
        title: "Distinctive skills",
        note: "Lift relative to the national posting mix.",
        aria: "Horizontal bars of skills ranked by lift over the national share",
      },
      skillOccupationHeatmap: {
        eyebrow: "Skills × occupations",
        title: "Top skills by occupation",
        note: "Each column shows an occupation’s skill mix.",
        aria: "Heatmap of the top skills against broad occupation groups, column-normalised",
      },
      education: {
        eyebrow: "Requirements · education",
        title: "Education requirements",
        note: "Share of postings by stated education requirement.",
        aria: "Stacked area of posting share by stated education requirement over time",
      },
      experience: {
        eyebrow: "Requirements · experience",
        title: "Experience requirements",
        note: "Share of postings by advertised years-of-experience band.",
        aria: "Stacked area of posting share by advertised years-of-experience band over time",
      },
    },
  },

  fr: {
    // Hero section
    heroEyebrowPrefix: "Compétences et exigences",
    heroTitle: "Compétences et exigences des offres d’emploi",
    heroLede: "Comparez les compétences, la scolarité, l’expérience et les modes de travail demandés.",

    // Most-requested skills section
    mostRequestedEyebrow: "Part des offres · compétences",
    mostRequestedTitle: "Compétences les plus requises",
    mostRequestedNote: (n: string) =>
      `Parmi les ${n} offres qui mentionnent des compétences.`,

    // Distinctive skills section
    distinctiveEyebrow: "Par rapport à la moyenne nationale",
    distinctiveTitle: "Ce qui distingue cette sélection",
    distinctiveNote: "Indice = part locale ÷ part nationale.",
    distinctiveHint: "Utilisez les filtres pour comparer les groupes.",

    // Requirements section
    reqEyebrowEducation: "Exigences · scolarité",
    reqTitleEducation: "Scolarité",
    reqNoteEducation: "Offres avec une exigence de scolarité seulement.",
    reqEyebrowExperience: "Exigences · expérience",
    reqTitleExperience: "Expérience",
    reqEyebrowLanguage: "Exigences · langue de travail",
    reqTitleLanguage: "Langue de travail",
    reqEyebrowRemote: "Exigences · télétravail",
    reqTitleRemote: "Télétravail",
    reqNoteRemote: "Offres avec un mode de travail précisé seulement.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCode: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // SkillBars aria-labels
    skillBarsShareLabel: "Compétences les plus requises par part des offres",
    skillBarsLiftLabel: "Compétences distinctives par indice de spécificité",
    liftRefLabel: "1× = moyenne nationale",
    skillBarsEmpty: "Aucune donnée pour cette sélection.",

    // ShareBars aria-label / empty
    shareBarsLabel: "Répartition par catégorie",
    shareBarsEmpty: "Aucune donnée pour cette sélection.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Plus de détails",
    deepLede: "Tendances des compétences et des exigences.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      topSkillsTrend: {
        eyebrow: "Compétences les plus requises · tendance",
        title: "Tendances des compétences demandées",
        note: "Moyenne de l’année de base = 100.",
        aria: "Graphique linéaire indexé des compétences les plus requises par rapport à une année de base choisie",
      },
      aiSkillDiffusion: {
        eyebrow: "Compétences en IA · diffusion",
        title: "Compétences en IA dans les offres",
        note: "Part des mentions · pâle = mensuel · gras = moyenne sur 3 mois.",
        aria: "Graphique linéaire des compétences en IA en part de toutes les mentions de compétences au fil du temps",
      },
      skillLift: {
        eyebrow: "Compétences distinctives · indice",
        title: "Compétences distinctives",
        note: "Indice par rapport à la composition nationale des offres.",
        aria: "Barres horizontales des compétences classées par indice de spécificité vs la part nationale",
      },
      skillOccupationHeatmap: {
        eyebrow: "Compétences × professions",
        title: "Principales compétences par profession",
        note: "Chaque colonne montre la composition des compétences d’une profession.",
        aria: "Carte de chaleur des principales compétences par grand groupe professionnel, normalisée par colonne",
      },
      education: {
        eyebrow: "Exigences · scolarité",
        title: "Exigences de scolarité",
        note: "Part des offres par exigence de scolarité indiquée.",
        aria: "Aires empilées de la part des offres par exigence de scolarité indiquée dans le temps",
      },
      experience: {
        eyebrow: "Exigences · expérience",
        title: "Exigences d’expérience",
        note: "Part des offres par bande d’années d’expérience annoncée.",
        aria: "Aires empilées de la part des offres par bande d’années d’expérience annoncée dans le temps",
      },
    },
  },
} as const;
