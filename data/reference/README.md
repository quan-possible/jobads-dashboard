# Reference Data

## canada_provinces.topo.json

**Source:** GeoJSON of Canadian provinces downloaded from
`https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson`
(Code for America / Click That Hood project, public domain).

**Vintage:** Geometry as of 2014 (administrative boundaries are stable).

**License:** Public domain.

**Processing:** Raw GeoJSON properties were normalized so each feature carries exactly:
- `code` — ISO 3166-2 two-letter province/territory code (e.g. `ON`, `QC`)
- `name` — English province/territory name

The 13 codes present are: AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT.

Geometry was simplified via the `topojson` Python library (`toposimplify=0.005`, `topoquantize=1e6`).
Coordinates are EPSG:4326 (lon/lat, unprojected). Apply a D3 `geoConicConformal` or `geoAlbers`
projection client-side.

Final file size: ~200 KB (well under the 600 KB target).

---

## province_labour_force.csv

**Source:** Statistics Canada, Table 14-10-0464-01 — "Labour force characteristics by province,
territory and economic region, annual" (Labour Force Survey).
URL: `https://www150.statcan.gc.ca/n1/tbl/csv/14100464-eng.zip`

**Vintage:** 2024 annual averages (most recent full year in the January 2026 release).

**License:** Statistics Canada Open Licence (https://www.statcan.gc.ca/eng/reference/licence).
Free to use with attribution.

**Columns:**
| Column | Description |
|--------|-------------|
| `code` | Two-letter province/territory code (ISO 3166-2) |
| `province` | English province/territory name |
| `labour_force` | Annual average labour force level, persons (absolute, not thousands) |
| `population` | Annual average civilian non-institutionalized population 15+, persons |
| `year` | Reference year (2024 for all rows) |

Values are converted from StatCan's "Persons in thousands" unit to absolute persons
(e.g. StatCan reports Ontario labour force as 8754.7 → stored as 8754700).

**Estimated values:** None. All 13 province/territory values are directly sourced from
Table 14-10-0464-01 for the 2024 reference year, including the three territories
(NT, NU, YT), which are small but present in the LFS.

Use `labour_force` for per-10k job-posting rates. Use `labour_force / population` for
the participation rate denominator in location-quotient calculations.
