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

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      shareChoropleth: {
        eyebrow: "By province",
        title: "Share of national demand by province",
        note: "Normalised fill (share of postings) — never raw counts on a choropleth.",
        aria: "Choropleth map of each province’s share of national postings",
      },
      rankedProvinces: {
        eyebrow: "Ranked · volume",
        title: "Ranked: provinces by posting volume",
        note: "The list carries the precise ranking the map cannot.",
        aria: "Horizontal bar chart ranking provinces by posting volume over the last 12 months",
      },
      lqChoropleth: {
        eyebrow: "Specialisation",
        title: "Specialisation: location quotient by province",
        note: "LQ = local share ÷ national share. Above 1 (orange) = relatively specialised; 1 = on par with Canada.",
        aria: "Choropleth map of the location quotient by province for one occupation group",
      },
      lqHeatmap: {
        eyebrow: "Occupation × province · through time",
        title: "What each province is known for: LQ wall",
        note: "Specialisation versus Canada — orange = over-represented, teal = under-represented (above 1 = specialised). Drag the slider or press play to move through time.",
        aria: "Heatmap of the location quotient for each occupation group across provinces, with a year slider to scrub through time",
      },
      shiftShare: {
        eyebrow: "Structure vs local",
        title: "Why provinces grew or shrank: shift-share",
        note: "Accounting identity (not causation): national trend + occupation mix + local shift = actual change.",
        aria: "Stacked bar chart decomposing each province’s change into national, mix and local components",
      },
      yoyChoropleth: {
        eyebrow: "Momentum · through time",
        title: "Year-over-year change by province",
        note: "Diverging fill pinned at 0 — orange rising, teal cooling. Drag the slider or press play to watch momentum shift year by year.",
        aria: "Choropleth map of year-over-year percentage change in postings by province, with a year slider to scrub through time",
      },
      provinceTiles: {
        eyebrow: "Tile grid",
        title: "Every province equally legible: tile grid",
        note: "Equal-area cells (last 12 months) — the North reads as clearly as Ontario.",
        aria: "Tile grid of provinces with each cell shaded by posting volume",
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

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      shareChoropleth: {
        eyebrow: "Par province",
        title: "Part de la demande nationale par province",
        note: "Remplissage normalisé (part des offres) — jamais de nombres bruts sur une carte choroplèthe.",
        aria: "Carte choroplèthe de la part de chaque province dans les offres nationales",
      },
      rankedProvinces: {
        eyebrow: "Classement · volume",
        title: "Classement : provinces par volume d'offres",
        note: "La liste porte le classement précis que la carte ne peut rendre.",
        aria: "Diagramme à barres horizontales classant les provinces par volume d'offres sur les 12 derniers mois",
      },
      lqChoropleth: {
        eyebrow: "Spécialisation",
        title: "Spécialisation : quotient de localisation par province",
        note: "QL = part locale ÷ part nationale. Au-dessus de 1 (orange) = relativement spécialisée ; 1 = au niveau du Canada.",
        aria: "Carte choroplèthe du quotient de localisation par province pour un groupe professionnel",
      },
      lqHeatmap: {
        eyebrow: "Profession × province · au fil du temps",
        title: "Ce qui caractérise chaque province : mur de QL",
        note: "Spécialisation par rapport au Canada — orange = surreprésenté, sarcelle = sous-représenté (au-dessus de 1 = spécialisé). Utilisez le curseur ou lancez la lecture pour parcourir le temps.",
        aria: "Carte de chaleur du quotient de localisation par groupe professionnel entre les provinces, avec un curseur annuel pour parcourir le temps",
      },
      shiftShare: {
        eyebrow: "Structure vs local",
        title: "Pourquoi les provinces ont crû ou reculé : analyse structurelle-résiduelle",
        note: "Identité comptable (non causale) : tendance nationale + composition professionnelle + écart local = variation réelle.",
        aria: "Diagramme à barres empilées décomposant la variation de chaque province en composantes nationale, de composition et locale",
      },
      yoyChoropleth: {
        eyebrow: "Dynamique · au fil du temps",
        title: "Variation sur un an par province",
        note: "Remplissage divergent fixé à 0 — orange en hausse, sarcelle en repli. Utilisez le curseur ou lancez la lecture pour suivre l’évolution année par année.",
        aria: "Carte choroplèthe de la variation en pourcentage des offres sur un an par province, avec un curseur annuel pour parcourir le temps",
      },
      provinceTiles: {
        eyebrow: "Grille de tuiles",
        title: "Chaque province aussi lisible : grille de tuiles",
        note: "Cellules de surface égale (12 derniers mois) — le Nord se lit aussi clairement que l'Ontario.",
        aria: "Grille de tuiles des provinces, chaque cellule teintée selon le volume d'offres",
      },
    },
  },
} as const;
