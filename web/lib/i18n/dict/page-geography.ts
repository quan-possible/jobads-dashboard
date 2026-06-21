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
  },
} as const;
