"""Shared constants for aggregate prep and dashboard presentation."""

from __future__ import annotations

from dataclasses import dataclass

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

PLOTLY_SEQUENCE: list[str] = [
    "#041c2c",
    "#345961",
    "#cf7730",
    "#c39e80",
    "#6e8790",
    "#203746",
    "#8b5e3c",
    "#59828c",
    "#d28f4b",
    "#55754e",
    "#7b6b8d",
    "#a64d3f",
]


@dataclass(frozen=True)
class VisualTheme:
    canvas: str = "#fbf8f5"
    surface: str = "#ffffff"
    surface_alt: str = "#f7efe9"
    text: str = "#132330"
    secondary_text: str = "#5d6b74"
    grid: str = "#eadfd7"
    axis: str = "#c8b3a2"
    neutral_fill: str = "#f2ebe5"
    navy: str = "#061f2f"
    navy_deep: str = "#041c2c"
    teal: str = "#345961"
    sand: str = "#c39e80"
    orange: str = "#cf7730"
    black: str = "#000000"
    white: str = "#ffffff"
    card_border: str = "#d9c2b1"
    shadow: str = "0 18px 40px rgba(6, 31, 47, 0.12)"
    gradient: str = "linear-gradient(270deg, #041c2c 0%, #345961 37.49%, #c39e80 76.96%, #cf7730 100%)"


THEME = VisualTheme()
