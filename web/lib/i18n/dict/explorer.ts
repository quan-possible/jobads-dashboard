// Shared copy for the Explorer chart (line/bar/table + metric toggle). Reused on
// Pulse and the Occupations/Industries pages. Data-derived strings stay EN.
import type { ExplorerLabels } from "@/components/ExplorerChart";

export const explorerDict: Record<"en" | "fr", ExplorerLabels> = {
  en: {
    viewLine: "Line",
    viewBar: "Bar",
    viewTable: "Table",
    metricIndex: "Index",
    metricPostings: "Postings",
    metricYoy: "YoY",
    colMonth: "Month",
    colIndex: "Index",
    colPostings: "Postings",
    colYoy: "YoY",
    baseline: "2019 = 100",
    notEnough: "Not enough data for this selection.",
  },
  fr: {
    viewLine: "Ligne",
    viewBar: "Barres",
    viewTable: "Tableau",
    metricIndex: "Indice",
    metricPostings: "Offres",
    metricYoy: "Annuel",
    colMonth: "Mois",
    colIndex: "Indice",
    colPostings: "Offres",
    colYoy: "Annuel",
    baseline: "2019 = 100",
    notEnough: "Données insuffisantes pour cette sélection.",
  },
};
