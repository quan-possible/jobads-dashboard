// Static UI copy for app/industries/page.tsx (the Industries page).
// Mirrors page-pulse.ts: chrome only. Figure bodies come from the figure bridge.
// EN chart titles/notes track the Python factory titled() text; FR is natural
// translation matching the Pulse FR voice. No causal language.

export const industriesDict = {
  en: {
    // Hero
    eyebrow: "Industries",
    hero: "Job postings by industry",
    lede: "Volume and share among postings with an industry code.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Change",
    deepLede: "Industry contributions to total posting change.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      coverageLine: {
        eyebrow: "Available industry codes",
        title: "Industry-code coverage",
        note: "Sector charts include coded postings only.",
        aria: "Share of postings carrying an industry code over time",
      },
      treemap: {
        eyebrow: "Sector mix over time",
        title: "Postings by industry",
        note: "",
        aria: "Treemap of postings by industry sector among coded postings, with a year slider to scrub through time",
      },
      shareOverTime: {
        eyebrow: "Sector shares",
        title: "Posting share by industry",
        note: "",
        aria: "Stacked area of posting share by industry sector over time",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "Contributions to posting change",
        note: "Percentage-point contributions to the coded-posting change.",
        aria: "Horizontal bars of each sector’s percentage-point contribution to the total posting change",
      },
    },
  },
  fr: {
    // Hero
    eyebrow: "Industries",
    hero: "Offres d’emploi par industrie",
    lede: "Volume et part parmi les offres avec un code sectoriel.",

    // ApiDown error card (copié de page-pulse.ts)
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Variation",
    deepLede: "Contributions des industries à la variation totale des offres.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      coverageLine: {
        eyebrow: "Codes sectoriels disponibles",
        title: "Couverture des codes sectoriels",
        note: "Les graphiques sectoriels incluent seulement les offres codées.",
        aria: "Part des offres portant un code sectoriel au fil du temps",
      },
      treemap: {
        eyebrow: "Composition sectorielle",
        title: "Offres par industrie",
        note: "",
        aria: "Carte proportionnelle des offres par secteur d’activité parmi les offres codées, avec un curseur annuel pour parcourir le temps",
      },
      shareOverTime: {
        eyebrow: "Parts sectorielles",
        title: "Part des offres par industrie",
        note: "",
        aria: "Aires empilées de la part des offres par secteur d’activité dans le temps",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Contributions à la variation des offres",
        note: "Contributions en points de pourcentage à la variation des offres codées.",
        aria: "Barres horizontales de la contribution de chaque secteur à la variation totale des offres, en points de pourcentage",
      },
    },
  },
} as const;
