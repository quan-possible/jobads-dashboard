// Filter option lists. Values MUST match the exact scope strings the API keys on.
// Labels are bilingual: `label` (en) + `labelFr`. `optionsFor`/`labelFor` resolve
// the right one per locale so the FilterSpine + scope summaries localize (S07/S08).

import type { Locale } from "./i18n/locale";

export const ALL_GEO = "All Canada";
export const ALL_OCC = "All occupations";
export const ALL_IND = "All industries";

export interface Option {
  value: string;
  label: string; // short display label (en)
  labelFr?: string; // short display label (fr); falls back to `label` when absent
  code?: string;
}

// Provinces present in the data (11 of 13 — NU and YT have no postings).
export const GEO_OPTIONS: Option[] = [
  { value: ALL_GEO, label: "All Canada", labelFr: "Tout le Canada" },
  { value: "AB", label: "Alberta", labelFr: "Alberta", code: "AB" },
  { value: "BC", label: "British Columbia", labelFr: "Colombie-Britannique", code: "BC" },
  { value: "MB", label: "Manitoba", labelFr: "Manitoba", code: "MB" },
  { value: "NB", label: "New Brunswick", labelFr: "Nouveau-Brunswick", code: "NB" },
  { value: "NL", label: "Newfoundland & Labrador", labelFr: "Terre-Neuve-et-Labrador", code: "NL" },
  { value: "NS", label: "Nova Scotia", labelFr: "Nouvelle-Écosse", code: "NS" },
  { value: "NT", label: "Northwest Territories", labelFr: "Territoires du Nord-Ouest", code: "NT" },
  { value: "ON", label: "Ontario", labelFr: "Ontario", code: "ON" },
  { value: "PE", label: "Prince Edward Island", labelFr: "Île-du-Prince-Édouard", code: "PE" },
  { value: "QC", label: "Quebec", labelFr: "Québec", code: "QC" },
  { value: "SK", label: "Saskatchewan", labelFr: "Saskatchewan", code: "SK" },
];

// NOC broad groups — value is the exact "code | label" the aggregates use.
export const OCC_OPTIONS: Option[] = [
  { value: ALL_OCC, label: "All occupations", labelFr: "Toutes les professions" },
  { value: "0 | Legislative and senior management occupations", label: "Management", labelFr: "Gestion", code: "0" },
  { value: "1 | Business, finance and administration occupations", label: "Business & finance", labelFr: "Affaires et finance", code: "1" },
  { value: "2 | Natural and applied sciences and related occupations", label: "Sciences & tech", labelFr: "Sciences et tech.", code: "2" },
  { value: "3 | Health occupations", label: "Health", labelFr: "Santé", code: "3" },
  { value: "4 | Occupations in education, law and social, community and government services", label: "Education, law & social", labelFr: "Éducation, droit et social", code: "4" },
  { value: "5 | Occupations in art, culture, recreation and sport", label: "Art, culture & sport", labelFr: "Arts, culture et sport", code: "5" },
  { value: "6 | Sales and service occupations", label: "Sales & service", labelFr: "Vente et services", code: "6" },
  { value: "7 | Trades, transport and equipment operators and related occupations", label: "Trades & transport", labelFr: "Métiers et transport", code: "7" },
  { value: "8 | Natural resources, agriculture and related production occupations", label: "Resources & agriculture", labelFr: "Ressources et agriculture", code: "8" },
  { value: "9 | Occupations in manufacturing and utilities", label: "Manufacturing & utilities", labelFr: "Fabrication et services publics", code: "9" },
];

// NAICS sectors — value is the exact "code | label".
export const IND_OPTIONS: Option[] = [
  { value: ALL_IND, label: "All industries", labelFr: "Toutes les industries" },
  { value: "11 | Agriculture, forestry, fishing and hunting", label: "Agriculture & forestry", labelFr: "Agriculture et foresterie", code: "11" },
  { value: "21 | Mining, quarrying, and oil and gas extraction", label: "Mining, oil & gas", labelFr: "Mines, pétrole et gaz", code: "21" },
  { value: "22 | Utilities", label: "Utilities", labelFr: "Services publics", code: "22" },
  { value: "23 | Construction", label: "Construction", labelFr: "Construction", code: "23" },
  { value: "31-33 | Manufacturing", label: "Manufacturing", labelFr: "Fabrication", code: "31-33" },
  { value: "41 | Wholesale trade", label: "Wholesale trade", labelFr: "Commerce de gros", code: "41" },
  { value: "44-45 | Retail trade", label: "Retail trade", labelFr: "Commerce de détail", code: "44-45" },
  { value: "48-49 | Transportation and warehousing", label: "Transportation & warehousing", labelFr: "Transport et entreposage", code: "48-49" },
  { value: "51 | Information and cultural industries", label: "Information & culture", labelFr: "Information et culture", code: "51" },
  { value: "52 | Finance and insurance", label: "Finance & insurance", labelFr: "Finance et assurances", code: "52" },
  { value: "53 | Real estate and rental and leasing", label: "Real estate", labelFr: "Immobilier", code: "53" },
  { value: "54 | Professional, scientific and technical services", label: "Professional & technical", labelFr: "Professionnel et technique", code: "54" },
  { value: "55 | Management of companies and enterprises", label: "Management of companies", labelFr: "Gestion d’entreprises", code: "55" },
  { value: "56 | Administrative and support, waste management and remediation services", label: "Administrative & support", labelFr: "Admin. et soutien", code: "56" },
  { value: "61 | Educational services", label: "Educational services", labelFr: "Services d’enseignement", code: "61" },
  { value: "62 | Health care and social assistance", label: "Health care & social", labelFr: "Santé et services sociaux", code: "62" },
  { value: "71 | Arts, entertainment and recreation", label: "Arts & recreation", labelFr: "Arts et loisirs", code: "71" },
  { value: "72 | Accommodation and food services", label: "Accommodation & food", labelFr: "Hébergement et restauration", code: "72" },
  { value: "81 | Other services (except public administration)", label: "Other services", labelFr: "Autres services", code: "81" },
  { value: "91 | Public administration", label: "Public administration", labelFr: "Administration publique", code: "91" },
];

function pick(o: Option, locale: Locale): string {
  return locale === "fr" ? o.labelFr ?? o.label : o.label;
}

/** Option list with `label` resolved to the active locale (for <Select>). */
export function optionsFor(options: Option[], locale: Locale): Option[] {
  return options.map((o) => ({ ...o, label: pick(o, locale) }));
}

export function labelFor(options: Option[], value: string | undefined, locale: Locale = "en"): string {
  if (!value) return pick(options[0], locale);
  const found = options.find((o) => o.value === value);
  return found ? pick(found, locale) : value;
}
