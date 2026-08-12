repo: quan-possible/jobads-dashboard
branch: main
source_commit: 98edbe04c93f4e23d3d43425bc08daa18eab8b8e

## Last sync
date: 2026-08-11T23:40:00Z

### Updated in this project
- Read Pulse page, TopNav, KpiTile, Figure, KeyPoints, FilterSpine, Brand, Footer, Sparkline, PixelTiles, page-pulse dict, explore page, globals.css tokens
- Built six lofi design-direction mockups (`prototypes/Dashboard Directions.dc.html`)
- Built hi-fi Pulse home (navy masthead + numbered sections) and dark team Explore
- Extracted the ACLMR dashboard design system: tokens, PT Sans, 15 components, foundation cards, dashboard UI kit
- Added the official ACLMR white wordmark from `https://www.aclmr.ca/public/uploads/images/aclmrlogowhiteheader.svg` (`sha256: bd308c4d221076e515bad78093e68b460967180b96c5765855d9ea3a691a8217`); retained pixel tiles as a decorative dashboard motif

## Screen map
| Project screen | Repo files |
|---|---|
| `prototypes/Dashboard Directions.dc.html` (1a–1e Pulse/section mockups) | web/app/page.tsx, web/app/globals.css, web/components/TopNav.tsx, web/components/KpiTile.tsx, web/components/Figure.tsx, web/components/KeyPoints.tsx, web/components/DeepDivider.tsx, web/components/Brand.tsx, web/lib/nav.ts |
| `prototypes/Dashboard Directions.dc.html` (1f Explore mockup) | web/components/FilterSpine.tsx, web/app/explore/ |
| `prototypes/Pulse Hifi.dc.html` | web/app/page.tsx, web/app/globals.css, web/components/TopNav.tsx, web/components/KpiTile.tsx, web/components/Figure.tsx, web/components/KeyPoints.tsx, web/components/DeepDivider.tsx, web/components/Footer.tsx, web/components/Sparkline.tsx, web/components/PixelTiles.tsx, web/lib/i18n/dict/page-pulse.ts |
| `design-system/ui_kits/dashboard/` (Pulse, Geography, Explore) | web/app/page.tsx, web/app/geography/, web/app/explore/page.tsx, web/components/*, web/lib/i18n/dict/page-pulse.ts |
| `design-system/components/` + `design-system/tokens/` | web/app/globals.css, web/components/*.tsx, .design-sync/fonts/, .design-sync/conventions.md |
| `prototypes/Explore Hifi.dc.html` | web/app/explore/page.tsx, web/components/FilterSpine.tsx, web/components/TopNav.tsx, web/app/globals.css |
