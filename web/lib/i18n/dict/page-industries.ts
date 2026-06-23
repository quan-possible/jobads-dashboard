// Static UI copy for app/industries/page.tsx (the Industries page).
// Mirrors page-pulse.ts: chrome only. Figure bodies come from the figure bridge.
// EN chart titles/notes track the Python factory titled() text; FR is natural
// translation matching the Pulse FR voice. No causal language.

export const industriesDict = {
  en: {
    // Hero
    eyebrow: "Industries",
    hero: "Posted hiring by industry sector",
    lede: "A monthly read on posted hiring across Canada’s industry sectors (NAICS). Industry coding is incomplete, so every sector total is conditional on coverage. Job ads measure posted demand — not employment or vacancies.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Data service unavailable",
    apiDownBody: "The API isn’t responding. Start it with",
    apiDownCmd: "uvicorn api.main:app --port 8530",

    // Section dividers (Core → Deep)
    deepEyebrow: "Going deeper",
    deepLede: "Mix and contribution views for readers who want the structure behind the sector totals.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      coverageLine: {
        eyebrow: "Coverage · NAICS over time",
        title: "Read industries with care: NAICS coverage over time",
        note: "Only this share of postings carries an industry code — every sector total below is conditional on it.",
        aria: "Share of postings carrying a NAICS industry code over time",
      },
      treemap: {
        eyebrow: "Sector mix · through time",
        title: "Postings by industry sector (where coded)",
        note: "Area ∝ postings with a NAICS code in the selected year. Drag the slider or press play to move through time. Counts partly reflect scraping coverage over time, not hiring alone.",
        aria: "Treemap of postings by industry sector among coded postings, with a year slider to scrub through time",
      },
      shareOverTime: {
        eyebrow: "Industry mix over time",
        title: "How the industry mix shifts (among coded postings)",
        note: "Share of postings with a NAICS code, by sector.",
        aria: "Stacked area of posting share by industry sector over time",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "Which sectors drove the change",
        note: "Contribution to growth among coded postings (accounting identity), over the chosen window. Choose the years, top-right.",
        aria: "Horizontal bars of each sector’s contribution to growth in percentage points",
      },
    },
  },
  fr: {
    // Hero
    eyebrow: "Industries",
    hero: "Embauche affichée par secteur d’activité",
    lede: "Un bilan mensuel de l’embauche affichée dans les secteurs d’activité au Canada (SCIAN). Le codage sectoriel est incomplet, donc chaque total de secteur est conditionnel à la couverture. Les offres mesurent la demande affichée — non l’emploi ni les postes vacants.",

    // ApiDown error card (copié de page-pulse.ts)
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "L’API ne répond pas. Démarrez-la avec",
    apiDownCmd: "uvicorn api.main:app --port 8530",

    // Section dividers (Core → Deep)
    deepEyebrow: "Pour aller plus loin",
    deepLede: "Vues de composition et de contribution pour qui veut la structure derrière les totaux sectoriels.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      coverageLine: {
        eyebrow: "Couverture · SCIAN au fil du temps",
        title: "Lire les industries avec prudence : couverture SCIAN au fil du temps",
        note: "Seule cette part des offres porte un code sectoriel — chaque total de secteur ci-dessous y est conditionnel.",
        aria: "Part des offres portant un code sectoriel SCIAN au fil du temps",
      },
      treemap: {
        eyebrow: "Composition sectorielle · au fil du temps",
        title: "Offres par secteur d’activité (lorsque codé)",
        note: "Surface ∝ offres portant un code SCIAN pour l’année sélectionnée. Utilisez le curseur ou lancez la lecture pour parcourir le temps. Les nombres reflètent en partie la couverture de collecte au fil du temps, pas seulement l’embauche.",
        aria: "Carte proportionnelle des offres par secteur d’activité parmi les offres codées, avec un curseur annuel pour parcourir le temps",
      },
      shareOverTime: {
        eyebrow: "Composition sectorielle au fil du temps",
        title: "Comment la composition sectorielle évolue (parmi les offres codées)",
        note: "Part des offres portant un code SCIAN, par secteur.",
        aria: "Aires empilées de la part des offres par secteur d’activité dans le temps",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Quels secteurs ont porté la variation",
        note: "Contribution à la croissance parmi les offres codées (identité comptable), sur la période choisie. Choisissez les années, en haut à droite.",
        aria: "Barres horizontales de la contribution de chaque secteur à la croissance, en points de pourcentage",
      },
    },
  },
} as const;
