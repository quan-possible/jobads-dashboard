// Self-contained i18n dict for the Skills page and its private components:
// SkillBars and ShareBars (used only by this page).
//
// DO NOT translate: skill names, group labels, occupation/industry labels,
// numbers, percentages, lift/share values, or any API-derived copy.

export const skillsDict = {
  en: {
    // Hero section
    heroEyebrowPrefix: "Skills & requirements",
    heroTitle: "What employers are asking for",
    heroLede:
      "Skills and requirements drawn from job postings that explicitly list them. Coverage varies — education and remote-work fields are sparsely reported, so those figures reflect only the postings that include them.",

    // Most-requested skills section
    mostRequestedEyebrow: "Share of postings · skills",
    mostRequestedTitle: "Most-requested skills",
    mostRequestedNote: (n: string) => `Among the ${n} postings that list skills.`,

    // Distinctive skills section
    distinctiveEyebrow: "Vs the national mix",
    distinctiveTitle: "What’s distinctive here",
    distinctiveNote:
      "Skills more common here than across Canada (lift = local share ÷ national share).",
    distinctiveHint:
      "Select a region, occupation or industry in the filter bar to see the skills that set it apart.",

    // Requirements section
    reqEyebrowEducation: "Requirements · education",
    reqTitleEducation: "Education",
    reqNoteEducation:
      "Sparsely reported — reflects only postings that specify an education requirement.",
    reqEyebrowExperience: "Requirements · experience",
    reqTitleExperience: "Experience",
    reqEyebrowLanguage: "Requirements · work language",
    reqTitleLanguage: "Work language",
    reqEyebrowRemote: "Requirements · remote work",
    reqTitleRemote: "Remote work",
    reqNoteRemote:
      "Sparsely reported — most postings do not specify a remote-work arrangement.",

    // API-down fallback
    apiDownTitle: "Data service unavailable",
    apiDownBody:
      "The API isn’t responding. Start it with ",
    apiDownCode: "uvicorn api.main:app --port 8530",

    // SkillBars aria-labels
    skillBarsShareLabel: "Most-requested skills by share of postings",
    skillBarsLiftLabel: "Distinctive skills by lift over national average",
    skillBarsEmpty: "No data for this selection.",
    liftRefLabel: "1× = national average",

    // ShareBars aria-label / empty
    shareBarsLabel: "Category share breakdown",
    shareBarsEmpty: "No data for this selection.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Going deeper",
    deepLede:
      "How requirements break down for readers who want the detail behind the headline skills.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      topSkillsTrend: {
        eyebrow: "Most-demanded skills · trend",
        title: "The most-demanded skills, and how each has trended",
        note: "Top skills by posting volume, each indexed to its 2019 average so fast and slow movers are comparable.",
        aria: "Indexed line chart of the most-demanded skills since 2019",
      },
      skillLift: {
        eyebrow: "Distinctive skills · lift",
        title: "Distinctive skills for a specialised group",
        note: "Skills most over-represented vs the whole market — what sets this occupation group apart.",
        aria: "Horizontal bars of skills ranked by lift over the national share",
      },
      skillOccupationHeatmap: {
        eyebrow: "Skills × occupations",
        title: "What each occupation group demands",
        note: "Column-normalised: each occupation’s mentions of the top skills (latest month).",
        aria: "Heatmap of the top skills against broad occupation groups, column-normalised",
      },
      education: {
        eyebrow: "Requirements · education",
        title: "Education requirements over time",
        note: "Share of postings by stated education requirement.",
        aria: "Stacked area of posting share by stated education requirement over time",
      },
      experience: {
        eyebrow: "Requirements · experience",
        title: "Experience bands over time",
        note: "Share of postings by advertised years-of-experience band.",
        aria: "Stacked area of posting share by advertised years-of-experience band over time",
      },
    },
  },

  fr: {
    // Hero section
    heroEyebrowPrefix: "Compétences et exigences",
    heroTitle: "Ce que les employeurs demandent",
    heroLede:
      "Compétences et exigences tirées des offres d’emploi qui les mentionnent explicitement. La couverture varie — les champs liés à la scolarité et au télétravail sont peu renseignés; ces chiffres ne reflètent donc que les offres qui les incluent.",

    // Most-requested skills section
    mostRequestedEyebrow: "Part des offres · compétences",
    mostRequestedTitle: "Compétences les plus demandées",
    mostRequestedNote: (n: string) =>
      `Parmi les ${n} offres qui mentionnent des compétences.`,

    // Distinctive skills section
    distinctiveEyebrow: "Par rapport à la moyenne nationale",
    distinctiveTitle: "Ce qui distingue cette sélection",
    distinctiveNote:
      "Compétences plus fréquentes ici qu’à l’échelle canadienne (indice = part locale ÷ part nationale).",
    distinctiveHint:
      "Sélectionnez une région, une profession ou une industrie dans la barre de filtres pour voir les compétences qui la distinguent.",

    // Requirements section
    reqEyebrowEducation: "Exigences · scolarité",
    reqTitleEducation: "Scolarité",
    reqNoteEducation:
      "Peu renseigné — reflète uniquement les offres précisant une exigence de scolarité.",
    reqEyebrowExperience: "Exigences · expérience",
    reqTitleExperience: "Expérience",
    reqEyebrowLanguage: "Exigences · langue de travail",
    reqTitleLanguage: "Langue de travail",
    reqEyebrowRemote: "Exigences · télétravail",
    reqTitleRemote: "Télétravail",
    reqNoteRemote:
      "Peu renseigné — la plupart des offres ne précisent pas le mode de travail.",

    // API-down fallback
    apiDownTitle: "Service de données indisponible",
    apiDownBody:
      "L’API ne répond pas. Démarrez-la avec ",
    apiDownCode: "uvicorn api.main:app --port 8530",

    // SkillBars aria-labels
    skillBarsShareLabel: "Compétences les plus demandées par part des offres",
    skillBarsLiftLabel: "Compétences distinctives par indice de spécificité",
    liftRefLabel: "1× = moyenne nationale",
    skillBarsEmpty: "Aucune donnée pour cette sélection.",

    // ShareBars aria-label / empty
    shareBarsLabel: "Répartition par catégorie",
    shareBarsEmpty: "Aucune donnée pour cette sélection.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Pour aller plus loin",
    deepLede:
      "Le détail des exigences pour qui veut le sous-jacent derrière les compétences principales.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      topSkillsTrend: {
        eyebrow: "Compétences les plus demandées · tendance",
        title: "Les compétences les plus demandées, et leur évolution",
        note: "Principales compétences par volume d’offres, chacune indexée à sa moyenne de 2019 pour comparer les fortes et faibles variations.",
        aria: "Graphique linéaire indexé des compétences les plus demandées depuis 2019",
      },
      skillLift: {
        eyebrow: "Compétences distinctives · indice",
        title: "Compétences distinctives d’un groupe spécialisé",
        note: "Compétences les plus surreprésentées par rapport à l’ensemble du marché — ce qui distingue ce groupe professionnel.",
        aria: "Barres horizontales des compétences classées par indice de spécificité vs la part nationale",
      },
      skillOccupationHeatmap: {
        eyebrow: "Compétences × professions",
        title: "Ce que demande chaque groupe professionnel",
        note: "Normalisé par colonne : les mentions des principales compétences par profession (dernier mois).",
        aria: "Carte de chaleur des principales compétences par grand groupe professionnel, normalisée par colonne",
      },
      education: {
        eyebrow: "Exigences · scolarité",
        title: "Exigences de scolarité au fil du temps",
        note: "Part des offres par exigence de scolarité indiquée.",
        aria: "Aires empilées de la part des offres par exigence de scolarité indiquée dans le temps",
      },
      experience: {
        eyebrow: "Exigences · expérience",
        title: "Bandes d’expérience au fil du temps",
        note: "Part des offres par bande d’années d’expérience annoncée.",
        aria: "Aires empilées de la part des offres par bande d’années d’expérience annoncée dans le temps",
      },
    },
  },
};

export type SkillsDict = (typeof skillsDict)[keyof typeof skillsDict];
