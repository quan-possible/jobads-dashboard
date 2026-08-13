// Geography page copy. Self-contained — does NOT touch the central dict.
// Province names, occupation/industry labels, and numbers are NOT translated
// (they come from the API). "location quotient" → "quotient de localisation".

export const geographyDict = {
  en: {
    // Hero section
    eyebrow: "Geography",
    hero: "Job postings by region",
    lede: "Volume, postings per 10,000 workers and regional concentration.",

    // Figure section
    figureEyebrow: "By province",
    figureTitle: "Postings across Canada",

    // Measure toggle labels — kept short so the segmented toggle doesn't overflow
    measurePer10k: "Per 10k",
    measureLq: "Concentration",
    measureCount: "Count",

    // Measure explainer sentences (one per measure value)
    explainerPer10k:
      "Postings per 10,000 people in the provincial labour force.",
    explainerLq:
      "Posting share divided by labour-force share. Above 1.0 means higher concentration.",
    explainerCount:
      "Raw posting count.",

    // Slice note fragments (surrounding text only; data labels stay English)
    sliceAll: "Showing all postings.",
    sliceShowing: "Showing ",
    sliceIn: " in ",
    sliceTrailing: ".",

    // Nunavut/Yukon note
    territoryNote: 'Nunavut and Yukon are not covered in the source data and show as "no data."',

    // SegmentToggle accessibility label
    toggleAriaLabel: "Choose how to measure postings",

    // Ranked header prefix
    rankedPrefix: "Ranked · ",

    // Time-scrubbed choropleth
    timeEyebrow: "Postings over time · by province",
    timeTitle: "Posting change across Canada",
    timeNote: "The colour scale is fixed across months.",
    playLabel: "▶ Play",
    monthPrefix: "Month: ",

    // Cumulative concentration
    cumEyebrow: "Market concentration",
    cumTitle: "Posting concentration by province",
    cumNote: "Cumulative share of all postings as provinces are added largest-first.",
    cumUnit: "provinces",

    // Choropleth legend / tooltip labels
    legend: {
      per10k: "postings per 10k labour force",
      lq: "location quotient (1.0 = national avg)",
      count: "postings",
      low: "low",
      high: "high",
      noData: "no data",
      postings: "postings",
      noPostings: "No postings recorded",
    },

    // ApiDown card
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Regional detail",
    deepLede: "Metropolitan areas, annual change and exposure.",

    // Measure-toggle labels for the authoritative postings map.
    mapMeasures: { share: "Share", count: "Count", percap: "Per 10k", lq: "Concentration" },

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandMap: {
        eyebrow: "By province · through time",
        title: "Postings by province",
        note: "Per 10,000 uses the 2024 labour force. Concentration = posting share ÷ labour-force share.",
        aria: "Animated choropleth map of job postings by province with a measure toggle and a year slider",
      },
      rankedProvinces: {
        eyebrow: "Ranked · volume",
        title: "Posting volume by province",
        note: "Last 12 months.",
        aria: "Horizontal bar chart ranking provinces by posting volume over the last 12 months",
      },
      cmaDemand: {
        eyebrow: "City level · CMAs",
        title: "Postings by metropolitan area",
        note: "Census metropolitan areas, last 12 months.",
        aria: "Horizontal bar chart ranking the largest census metropolitan areas by posting volume",
      },
      yoyChoropleth: {
        eyebrow: "Momentum · through time",
        title: "Annual posting change by province",
        note: "",
        aria: "Choropleth map of year-over-year percentage change in postings by province, with a year slider to scrub through time",
      },
      shiftShare: {
        eyebrow: "Accounting breakdown",
        title: "Components of regional change",
        note: "National trend + occupation mix + local component = total change; not causal.",
        aria: "Stacked bar chart decomposing each province’s change into national, mix and local components",
      },
      aiExposure: {
        eyebrow: "Task exposure",
        title: "Task exposure by province",
        note: "Posting-weighted task exposure, not realized automation.",
        aria: "Choropleth map of posting-weighted mean AI task exposure by province",
      },
    },
  },
  fr: {
    // Hero section
    eyebrow: "Géographie",
    hero: "Offres d’emploi par région",
    lede: "Volume, offres pour 10 000 actifs et concentration régionale.",

    // Figure section
    figureEyebrow: "Par province",
    figureTitle: "Offres à travers le Canada",

    // Measure toggle labels — short to avoid overflow
    measurePer10k: "Pour 10k",
    measureLq: "Concentration",
    measureCount: "Nombre",

    // Measure explainer sentences
    explainerPer10k:
      "Offres pour 10 000 personnes dans la population active provinciale.",
    explainerLq:
      "Part des offres divisée par la part de la population active. Plus de 1,0 indique une concentration élevée.",
    explainerCount:
      "Nombre brut d’offres.",

    // Slice note fragments
    sliceAll: "Toutes les offres sont affichées.",
    sliceShowing: "Affichage : ",
    sliceIn: " dans ",
    sliceTrailing: ".",

    // Nunavut/Yukon note
    territoryNote:
      "Le Nunavut et le Yukon ne sont pas couverts par les données sources et apparaissent comme « sans données ».",

    // SegmentToggle accessibility label
    toggleAriaLabel: "Choisir la mesure des offres",

    // Ranked header prefix
    rankedPrefix: "Classement · ",

    // Time-scrubbed choropleth
    timeEyebrow: "Offres au fil du temps · par province",
    timeTitle: "Évolution des offres au Canada",
    timeNote: "L’échelle de couleur reste fixe entre les mois.",
    playLabel: "▶ Lecture",
    monthPrefix: "Mois : ",

    // Cumulative concentration
    cumEyebrow: "Concentration du marché",
    cumTitle: "Concentration des offres par province",
    cumNote: "Part cumulée de toutes les offres à mesure que les provinces s'ajoutent, des plus grandes aux plus petites.",
    cumUnit: "provinces",

    // Choropleth legend / tooltip labels
    legend: {
      per10k: "offres pour 10k actifs",
      lq: "quotient de localisation (1,0 = moy. nat.)",
      count: "offres",
      low: "faible",
      high: "élevé",
      noData: "sans données",
      postings: "offres",
      noPostings: "Aucune offre recensée",
    },

    // ApiDown card
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",

    // Section dividers (Core → Deep)
    deepEyebrow: "Détail régional",
    deepLede: "Régions métropolitaines, variation annuelle et exposition.",

    // Measure-toggle labels for the authoritative postings map.
    mapMeasures: { share: "Part", count: "Nombre", percap: "Pour 10 000", lq: "Concentration" },

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      demandMap: {
        eyebrow: "Par province · au fil du temps",
        title: "Offres par province",
        note: "La mesure pour 10 000 utilise la population active de 2024. Concentration = part des offres ÷ part de la population active.",
        aria: "Carte choroplèthe animée des offres par province avec un sélecteur de mesure et un curseur annuel",
      },
      rankedProvinces: {
        eyebrow: "Classement · volume",
        title: "Volume des offres par province",
        note: "12 derniers mois.",
        aria: "Diagramme à barres horizontales classant les provinces par volume d'offres sur les 12 derniers mois",
      },
      cmaDemand: {
        eyebrow: "Niveau ville · RMR",
        title: "Offres par région métropolitaine",
        note: "Régions métropolitaines de recensement, 12 derniers mois.",
        aria: "Diagramme à barres horizontales classant les plus grandes régions métropolitaines de recensement par volume d'offres",
      },
      yoyChoropleth: {
        eyebrow: "Dynamique · au fil du temps",
        title: "Variation annuelle des offres par province",
        note: "",
        aria: "Carte choroplèthe de la variation en pourcentage des offres sur un an par province, avec un curseur annuel pour parcourir le temps",
      },
      shiftShare: {
        eyebrow: "Décomposition comptable",
        title: "Composantes de la variation régionale",
        note: "Tendance nationale + composition professionnelle + composante locale = variation totale; non causale.",
        aria: "Diagramme à barres empilées décomposant la variation de chaque province en composantes nationale, de composition et locale",
      },
      aiExposure: {
        eyebrow: "Exposition des tâches",
        title: "Exposition des tâches par province",
        note: "Exposition des tâches pondérée par les offres; ce n’est pas un taux d’automatisation.",
        aria: "Carte choroplèthe de l'exposition moyenne des tâches à l'IA pondérée par les offres, par province",
      },
    },
  },
} as const;
