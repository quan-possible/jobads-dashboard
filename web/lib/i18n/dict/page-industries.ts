// Static UI copy for app/industries/page.tsx (the Industries page).
// Mirrors page-pulse.ts: chrome only. Figure bodies come from the figure bridge.
// EN chart titles/notes track the Python factory titled() text; FR is natural
// translation matching the Pulse FR voice. No causal language.

export const industriesDict = {
  en: {
    // Hero
    eyebrow: "Industries",
    hero: "Job postings by industry",
    lede: "Compare volume, mix and growth across NAICS sectors.",

    // ApiDown error card (copied from page-pulse.ts)
    apiDownTitle: "Data service unavailable",
    apiDownBody: "Try again shortly.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "More detail",
    deepLede: "Sector mix and contributions to growth.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      coverageLine: {
        eyebrow: "NAICS coverage",
        title: "Share of postings with an industry code",
        note: "Sector charts include coded postings only.",
        aria: "Share of postings carrying a NAICS industry code over time",
      },
      treemap: {
        eyebrow: "Sector mix over time",
        title: "Postings by industry",
        note: "Area = coded postings.",
        aria: "Treemap of postings by industry sector among coded postings, with a year slider to scrub through time",
      },
      shareOverTime: {
        eyebrow: "Sector shares",
        title: "How the industry mix changes",
        note: "Share of coded postings by sector.",
        aria: "Stacked area of posting share by industry sector over time",
      },
      contributionBars: {
        eyebrow: "Contribution to growth",
        title: "Contribution to posting growth",
        note: "Coded postings only; accounting, not causation.",
        aria: "Horizontal bars of each sector’s contribution to growth in percentage points",
      },
    },
  },
  fr: {
    // Hero
    eyebrow: "Industries",
    hero: "Offres d’emploi par industrie",
    lede: "Comparez le volume, la composition et la croissance par secteur SCIAN.",

    // ApiDown error card (copié de page-pulse.ts)
    apiDownTitle: "Service de données indisponible",
    apiDownBody: "Réessayez dans quelques instants.",
    apiDownCmd: "uvicorn api.main:app --port 8530 --no-proxy-headers",

    // Section dividers (Core → Deep)
    deepEyebrow: "Plus de détails",
    deepLede: "Composition sectorielle et contributions à la croissance.",

    // Bridged figures (chrome only; the figure bodies come from the API)
    charts: {
      coverageLine: {
        eyebrow: "Couverture SCIAN",
        title: "Part des offres avec un code sectoriel",
        note: "Les graphiques sectoriels incluent seulement les offres codées.",
        aria: "Part des offres portant un code sectoriel SCIAN au fil du temps",
      },
      treemap: {
        eyebrow: "Composition sectorielle",
        title: "Offres par industrie",
        note: "Surface = offres codées.",
        aria: "Carte proportionnelle des offres par secteur d’activité parmi les offres codées, avec un curseur annuel pour parcourir le temps",
      },
      shareOverTime: {
        eyebrow: "Parts sectorielles",
        title: "Évolution de la composition sectorielle",
        note: "Part des offres codées par secteur.",
        aria: "Aires empilées de la part des offres par secteur d’activité dans le temps",
      },
      contributionBars: {
        eyebrow: "Contribution à la croissance",
        title: "Contribution à la croissance des offres",
        note: "Offres codées seulement; identité comptable, non causale.",
        aria: "Barres horizontales de la contribution de chaque secteur à la croissance, en points de pourcentage",
      },
    },
  },
} as const;
