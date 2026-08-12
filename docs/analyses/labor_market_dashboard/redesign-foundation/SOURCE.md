repo: quan-possible/jobads-dashboard
branch: main

## Last sync
date: 2026-08-11T23:40:00Z

### Updated in this project
- Read Pulse page, TopNav, KpiTile, Figure, KeyPoints, FilterSpine, Brand, Footer, Sparkline, PixelTiles, page-pulse dict, explore page, globals.css tokens
- Built six lofi design-direction mockups (`prototypes/Dashboard Directions.dc.html`)
- Built hi-fi Pulse home (navy masthead + numbered sections) and dark team Explore
- Extracted the ACLMR design system: tokens, PT Sans, 14 components, 15 foundation cards, dashboard UI kit

## Screen map
| Project screen | Repo files |
|---|---|
| `prototypes/Dashboard Directions.dc.html` (1a–1e Pulse/section mockups) | web/app/page.tsx, web/app/globals.css, web/components/TopNav.tsx, web/components/KpiTile.tsx, web/components/Figure.tsx, web/components/KeyPoints.tsx, web/components/DeepDivider.tsx, web/components/Brand.tsx, web/lib/nav.ts |
| `prototypes/Dashboard Directions.dc.html` (1f Explore mockup) | web/components/FilterSpine.tsx, web/app/explore/ |
| `prototypes/Pulse Hifi.dc.html` | web/app/page.tsx, web/app/globals.css, web/components/TopNav.tsx, web/components/KpiTile.tsx, web/components/Figure.tsx, web/components/KeyPoints.tsx, web/components/DeepDivider.tsx, web/components/Footer.tsx, web/components/Sparkline.tsx, web/components/PixelTiles.tsx, web/lib/i18n/dict/page-pulse.ts |
| `design-system/ui_kits/dashboard/` (Pulse, Geography, Explore) | web/app/page.tsx, web/app/geography/, web/app/explore/page.tsx, web/components/*, web/lib/i18n/dict/page-pulse.ts |
| `design-system/components/` + `design-system/tokens/` | web/app/globals.css, web/components/*.tsx, .design-sync/fonts/, .design-sync/conventions.md |
| `prototypes/Explore Hifi.dc.html` | web/app/explore/page.tsx, web/components/FilterSpine.tsx, web/components/TopNav.tsx, web/app/globals.css |
