// Geography page copy. Self-contained — does NOT touch the central dict.
// Province names, occupation/industry labels, and numbers are NOT translated
// (they come from the API). "location quotient" → "quotient de localisation".

export const geographyDict = {
  en: {
    // Hero section
    eyebrow: "Geography",
    hero: "Where in Canada is demand concentrated?",
    lede:
      "Active postings by province, as a share of the labour force, a location quotient, or a raw count. Two territories report no postings.",

    // Figure section
    figureEyebrow: "By province",
    figureTitle: "Posted hiring demand across Canada",

    // Measure toggle labels — kept short so the segmented toggle doesn't overflow
    measurePer10k: "Per 10k",
    measureLq: "Concentration",
    measureCount: "Count",

    // Measure explainer sentences (one per measure value)
    explainerPer10k:
      "Postings per 10,000 people in each province's labour force — adjusts for the size of the workforce.",
    explainerLq:
      "Location quotient: a province's share of postings divided by its share of the labour force. Above 1.0 means hiring is concentrated there relative to its size.",
    explainerCount:
      "Raw count of active postings — larger provinces lead simply because they are larger.",

    // Slice note fragments (surrounding text only; data labels stay English)
    sliceAll: "Showing all postings.",
    sliceShowing: "Showing ",
    sliceIn: " in ",
    sliceTrailing: ".",

    // Nunavut/Yukon note
    territoryNote: 'Nunavut and Yukon are not covered in the source data and show as "no data."',

    // SegmentToggle accessibility label
    toggleAriaLabel: "Choose how to measure demand",

    // Ranked header prefix
    rankedPrefix: "Ranked · ",

    // Time-scrubbed choropleth
    timeEyebrow: "Demand over time · by province",
    timeTitle: "How posted demand shifted across the country",
    timeNote: "Active postings per province, animated by month. Colour scale is fixed across all months, so growth reads as the map brightening. Drag the slider or press play.",
    playLabel: "▶ Play",
    monthPrefix: "Month: ",

    // Cumulative concentration
    cumEyebrow: "Market concentration",
    cumTitle: "How concentrated demand is across provinces",
    cumNote: "Cumulative share of all postings as provinces are added largest-first.",
    cumUnit: "provinces",

    // Choropleth legend / tooltip labels
    legend: {
      per10k: "postings per 10k labour force",
      lq: "location quotient (1.0 = national avg)",
      count: "active postings",
      low: "low",
      high: "high",
      noData: "no data",
      postings: "postings",
      noPostings: "No postings recorded",
    },

    // ApiDown card
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn't responding. Start it with",

    // Section dividers (Core → Deep)
    deepEyebrow: "Going deeper",
    deepLede: "Specialisation, structure and momentum for readers who want the regional detail beneath the headline map.",

    // Measure-toggle labels for the authoritative demand map.
    mapMeasures: { share: "Share", count: "Count", percap: "Per-capita", lq: "Demand LQ" },

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandMap: {
        eyebrow: "By province · through time",
        title: "Posted hiring demand across Canada",
        note: "Switch the measure: share of national demand, raw count, per-capita intensity (per 10k labour force, StatCan LFS 2024), or a demand location quotient (postings share ÷ labour-force share). Drag the year slider or press play.",
        aria: "Animated choropleth map of posted demand by province with a measure toggle and a year slider",
      },
      rankedProvinces: {
        eyebrow: "Ranked · volume",
        title: "Ranked: provinces by posting volume",
        note: "The list carries the precise ranking the map cannot.",
        aria: "Horizontal bar chart ranking provinces by posting volume over the last 12 months",
      },
      cmaDemand: {
        eyebrow: "City level · CMAs",
        title: "The biggest metropolitan labour markets",
        note: "City / census-metropolitan-area demand over the last 12 months — finer than the province totals above.",
        aria: "Horizontal bar chart ranking the largest census metropolitan areas by posting volume",
      },
      yoyChoropleth: {
        eyebrow: "Momentum · through time",
        title: "Year-over-year change by province",
        note: "Diverging fill pinned at 0 — orange rising, teal cooling. Drag the slider or press play to watch momentum shift year by year.",
        aria: "Choropleth map of year-over-year percentage change in postings by province, with a year slider to scrub through time",
      },
      shiftShare: {
        eyebrow: "Structure vs local · secondary",
        title: "Why provinces grew or shrank: shift-share",
        note: "A secondary cut. Accounting identity (not causation): national trend + occupation mix + local shift = actual change.",
        aria: "Stacked bar chart decomposing each province’s change into national, mix and local components",
      },
      aiExposure: {
        eyebrow: "AI exposure · Eloundou β",
        title: "AI exposure of provincial demand",
        note: "Each province's demand-weighted average task exposure to generative AI (Eloundou et al. β, US task-based, mapped to broad NOC). A potential-exposure signal, not realized automation.",
        aria: "Choropleth map of demand-weighted mean AI task exposure by province",
      },
    },
  },
  fr: {
    // Hero section
    eyebrow: "Géographie",
    hero: "Où la demande se concentre-t-elle au Canada ?",
    lede:
      "Offres actives par province, en proportion de la population active, en quotient de localisation, ou en nombre brut. Deux territoires ne déclarent aucune offre.",

    // Figure section
    figureEyebrow: "Par province",
    figureTitle: "Demande d'embauche affichée à travers le Canada",

    // Measure toggle labels — short to avoid overflow
    measurePer10k: "Pour 10k",
    measureLq: "Concentration",
    measureCount: "Nombre",

    // Measure explainer sentences
    explainerPer10k:
      "Offres pour 10 000 personnes dans la population active de chaque province — corrige pour la taille de la main-d'œuvre.",
    explainerLq:
      "Quotient de localisation : la part des offres d'une province divisée par sa part de la population active. Au-dessus de 1,0, l'embauche y est concentrée par rapport à sa taille.",
    explainerCount:
      "Nombre brut d'offres actives — les grandes provinces dominent simplement parce qu'elles sont plus grandes.",

    // Slice note fragments
    sliceAll: "Toutes les offres sont affichées.",
    sliceShowing: "Affichage : ",
    sliceIn: " dans ",
    sliceTrailing: ".",

    // Nunavut/Yukon note
    territoryNote:
      "Le Nunavut et le Yukon ne sont pas couverts par les données sources et apparaissent comme « sans données ».",

    // SegmentToggle accessibility label
    toggleAriaLabel: "Choisir la mesure de la demande",

    // Ranked header prefix
    rankedPrefix: "Classement · ",

    // Time-scrubbed choropleth
    timeEyebrow: "Demande au fil du temps · par province",
    timeTitle: "Comment la demande affichée a évolué au pays",
    timeNote: "Offres actives par province, animées par mois. L'échelle de couleur est fixe sur tous les mois : la croissance se lit comme un éclaircissement de la carte. Glissez le curseur ou appuyez sur lecture.",
    playLabel: "▶ Lecture",
    monthPrefix: "Mois : ",

    // Cumulative concentration
    cumEyebrow: "Concentration du marché",
    cumTitle: "À quel point la demande est concentrée entre provinces",
    cumNote: "Part cumulée de toutes les offres à mesure que les provinces s'ajoutent, des plus grandes aux plus petites.",
    cumUnit: "provinces",

    // Choropleth legend / tooltip labels
    legend: {
      per10k: "offres pour 10k actifs",
      lq: "quotient de localisation (1,0 = moy. nat.)",
      count: "offres actives",
      low: "faible",
      high: "élevé",
      noData: "sans données",
      postings: "offres",
      noPostings: "Aucune offre recensée",
    },

    // ApiDown card
    apiDownTitle: "Service de données indisponible",
    apiDownBody:
      "L'API ne répond pas. Démarrez-la avec",

    // Section dividers (Core → Deep)
    deepEyebrow: "Pour aller plus loin",
    deepLede: "Spécialisation, structure et dynamique pour qui veut le détail régional sous la carte principale.",

    // Measure-toggle labels for the authoritative demand map.
    mapMeasures: { share: "Part", count: "Nombre", percap: "Par habitant", lq: "QL demande" },

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandMap: {
        eyebrow: "Par province · au fil du temps",
        title: "Demande d'embauche affichée à travers le Canada",
        note: "Changez la mesure : part de la demande nationale, nombre brut, intensité par habitant (pour 10k actifs, EPA StatCan 2024), ou quotient de localisation de la demande (part des offres ÷ part de la population active). Glissez le curseur annuel ou lancez la lecture.",
        aria: "Carte choroplèthe animée de la demande par province avec un sélecteur de mesure et un curseur annuel",
      },
      rankedProvinces: {
        eyebrow: "Classement · volume",
        title: "Classement : provinces par volume d'offres",
        note: "La liste porte le classement précis que la carte ne peut rendre.",
        aria: "Diagramme à barres horizontales classant les provinces par volume d'offres sur les 12 derniers mois",
      },
      cmaDemand: {
        eyebrow: "Niveau ville · RMR",
        title: "Les plus grands marchés du travail métropolitains",
        note: "Demande au niveau des villes / régions métropolitaines de recensement sur les 12 derniers mois — plus fin que les totaux provinciaux ci-dessus.",
        aria: "Diagramme à barres horizontales classant les plus grandes régions métropolitaines de recensement par volume d'offres",
      },
      yoyChoropleth: {
        eyebrow: "Dynamique · au fil du temps",
        title: "Variation sur un an par province",
        note: "Remplissage divergent fixé à 0 — orange en hausse, sarcelle en repli. Utilisez le curseur ou lancez la lecture pour suivre l’évolution année par année.",
        aria: "Carte choroplèthe de la variation en pourcentage des offres sur un an par province, avec un curseur annuel pour parcourir le temps",
      },
      shiftShare: {
        eyebrow: "Structure vs local · secondaire",
        title: "Pourquoi les provinces ont crû ou reculé : analyse structurelle-résiduelle",
        note: "Une lecture secondaire. Identité comptable (non causale) : tendance nationale + composition professionnelle + écart local = variation réelle.",
        aria: "Diagramme à barres empilées décomposant la variation de chaque province en composantes nationale, de composition et locale",
      },
      aiExposure: {
        eyebrow: "Exposition à l'IA · β Eloundou",
        title: "Exposition à l'IA de la demande provinciale",
        note: "Exposition moyenne des tâches à l'IA générative, pondérée par la demande (β d'Eloundou et al., basée sur les tâches aux É.-U., rattachée à la CNP large). Un signal d'exposition potentielle, non d'automatisation réalisée.",
        aria: "Carte choroplèthe de l'exposition moyenne des tâches à l'IA pondérée par la demande, par province",
      },
    },
  },
} as const;
