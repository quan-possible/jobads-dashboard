// Filter option lists. Values MUST match the exact scope strings the API keys on.

export const ALL_GEO = "All Canada";
export const ALL_OCC = "All occupations";
export const ALL_IND = "All industries";

export interface Option {
  value: string;
  label: string; // short display label
  code?: string;
}

// Provinces present in the data (11 of 13 — NU and YT have no postings).
export const GEO_OPTIONS: Option[] = [
  { value: ALL_GEO, label: "All Canada" },
  { value: "AB", label: "Alberta", code: "AB" },
  { value: "BC", label: "British Columbia", code: "BC" },
  { value: "MB", label: "Manitoba", code: "MB" },
  { value: "NB", label: "New Brunswick", code: "NB" },
  { value: "NL", label: "Newfoundland & Labrador", code: "NL" },
  { value: "NS", label: "Nova Scotia", code: "NS" },
  { value: "NT", label: "Northwest Territories", code: "NT" },
  { value: "ON", label: "Ontario", code: "ON" },
  { value: "PE", label: "Prince Edward Island", code: "PE" },
  { value: "QC", label: "Quebec", code: "QC" },
  { value: "SK", label: "Saskatchewan", code: "SK" },
];

// NOC broad groups — value is the exact "code | label" the aggregates use.
export const OCC_OPTIONS: Option[] = [
  { value: ALL_OCC, label: "All occupations" },
  { value: "0 | Legislative and senior management occupations", label: "Management", code: "0" },
  { value: "1 | Business, finance and administration occupations", label: "Business & finance", code: "1" },
  { value: "2 | Natural and applied sciences and related occupations", label: "Sciences & tech", code: "2" },
  { value: "3 | Health occupations", label: "Health", code: "3" },
  { value: "4 | Occupations in education, law and social, community and government services", label: "Education, law & social", code: "4" },
  { value: "5 | Occupations in art, culture, recreation and sport", label: "Art, culture & sport", code: "5" },
  { value: "6 | Sales and service occupations", label: "Sales & service", code: "6" },
  { value: "7 | Trades, transport and equipment operators and related occupations", label: "Trades & transport", code: "7" },
  { value: "8 | Natural resources, agriculture and related production occupations", label: "Resources & agriculture", code: "8" },
  { value: "9 | Occupations in manufacturing and utilities", label: "Manufacturing & utilities", code: "9" },
];

// NAICS sectors — value is the exact "code | label".
export const IND_OPTIONS: Option[] = [
  { value: ALL_IND, label: "All industries" },
  { value: "11 | Agriculture, forestry, fishing and hunting", label: "Agriculture & forestry", code: "11" },
  { value: "21 | Mining, quarrying, and oil and gas extraction", label: "Mining, oil & gas", code: "21" },
  { value: "22 | Utilities", label: "Utilities", code: "22" },
  { value: "23 | Construction", label: "Construction", code: "23" },
  { value: "31-33 | Manufacturing", label: "Manufacturing", code: "31-33" },
  { value: "41 | Wholesale trade", label: "Wholesale trade", code: "41" },
  { value: "44-45 | Retail trade", label: "Retail trade", code: "44-45" },
  { value: "48-49 | Transportation and warehousing", label: "Transportation & warehousing", code: "48-49" },
  { value: "51 | Information and cultural industries", label: "Information & culture", code: "51" },
  { value: "52 | Finance and insurance", label: "Finance & insurance", code: "52" },
  { value: "53 | Real estate and rental and leasing", label: "Real estate", code: "53" },
  { value: "54 | Professional, scientific and technical services", label: "Professional & technical", code: "54" },
  { value: "55 | Management of companies and enterprises", label: "Management of companies", code: "55" },
  { value: "56 | Administrative and support, waste management and remediation services", label: "Administrative & support", code: "56" },
  { value: "61 | Educational services", label: "Educational services", code: "61" },
  { value: "62 | Health care and social assistance", label: "Health care & social", code: "62" },
  { value: "71 | Arts, entertainment and recreation", label: "Arts & recreation", code: "71" },
  { value: "72 | Accommodation and food services", label: "Accommodation & food", code: "72" },
  { value: "81 | Other services (except public administration)", label: "Other services", code: "81" },
  { value: "91 | Public administration", label: "Public administration", code: "91" },
];

export function labelFor(options: Option[], value: string | undefined): string {
  if (!value) return options[0].label;
  return options.find((o) => o.value === value)?.label ?? value;
}
