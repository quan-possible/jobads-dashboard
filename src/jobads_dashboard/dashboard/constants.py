"""Shared constants for aggregate prep and dashboard presentation."""

from __future__ import annotations

ALL_CANADA = "All Canada"
ALL_OCCUPATIONS = "All occupations"
ALL_INDUSTRIES = "All industries"

NOC_BROAD_LABELS: dict[str, str] = {
    "0": "Legislative and senior management occupations",
    "1": "Business, finance and administration occupations",
    "2": "Natural and applied sciences and related occupations",
    "3": "Health occupations",
    "4": "Occupations in education, law and social, community and government services",
    "5": "Occupations in art, culture, recreation and sport",
    "6": "Sales and service occupations",
    "7": "Trades, transport and equipment operators and related occupations",
    "8": "Natural resources, agriculture and related production occupations",
    "9": "Occupations in manufacturing and utilities",
}

NAICS_SECTOR_LABELS: dict[str, str] = {
    "11": "Agriculture, forestry, fishing and hunting",
    "21": "Mining, quarrying, and oil and gas extraction",
    "22": "Utilities",
    "23": "Construction",
    "31-33": "Manufacturing",
    "41": "Wholesale trade",
    "44-45": "Retail trade",
    "48-49": "Transportation and warehousing",
    "51": "Information and cultural industries",
    "52": "Finance and insurance",
    "53": "Real estate and rental and leasing",
    "54": "Professional, scientific and technical services",
    "55": "Management of companies and enterprises",
    "56": "Administrative and support, waste management and remediation services",
    "61": "Educational services",
    "62": "Health care and social assistance",
    "71": "Arts, entertainment and recreation",
    "72": "Accommodation and food services",
    "81": "Other services (except public administration)",
    "91": "Public administration",
}

COVERAGE_FIELDS: tuple[str, ...] = (
    "noc",
    "naics",
    "remunerationHrly",
    "remoteWorkOptions",
    "primaryPostingLanguage",
    "englishLanguageRequirement",
    "frenchLanguageRequirement",
    "experienceDetails",
    "education",
    "skills",
    "type",
    "duration",
    "advertisedBy",
)
