# Live capture — 2026-06-23 deep audit

Rendered the app end to end: **FastAPI** backend on `:8530` (already running, reused) + **Next dev** on `:3000` (preview tooling). Walked all pages in EN and FR, desktop + mobile, light + dark. Charts render through the figure bridge (Plotly JSON, client-side).

**Capture quirk (not an app bug):** `preview_screenshot` returns a blank cream frame after a *programmatic* `window.scrollTo` (headless scroll/paint desync — same quirk the prior audit noted). Charts genuinely paint: DOM shows `.js-plotly-plot` nodes with 5 SVGs and real trace paths/labels. So lower-fold visuals were verified via DOM text extraction + tall-viewport (1280×1600) screenshots taken right after navigation, which capture correctly.

## Runtime health
- Browser console across pages: **clean** (only React DevTools notice + HMR).
- API error handling probed directly:
  - `/api/explore/figure` axis gate (`dim=province` + `geo=ON`) → 0-trace figure, annotation *"Pick a different breakdown — you've already filtered to one province."*
  - sample gate (narrow geo+occ+ind, wage) → annotation *"Insufficient sample (n<100)"*.
  - bad `measure` / `dim` / non-int `start_year` → **422** (validated, not 500).
  - `/api/overview?end=garbage` → **200** (S04 prior bug fixed — graceful).
  - malformed figure `base_year=abc` → **422**; unknown figure id → **404**; private endpoint unauthenticated → **401**.

## Prior-audit fixes confirmed holding (do NOT re-file)
- **H1** `geography.cma_demand` 8× inflation → corrected: Toronto CMA = **439,050** (decoded from figure JSON), not the old ~3.5M.
- **S04** malformed `start`/`end` → 200 not 500.
- **S07** provisional-tail band now present on skills trend + AI-diffusion.
- **S18** home hero localized (FR shows "L'EMBAUCHE AU CANADA EST 8% EN DESSOUS DE SON NIVEAU DE RÉFÉRENCE DE 2019").
- **S23** per-figure degradation — `api.figureSafe` exists and is used.
- **S32** mobile nav — panel uses `inert={!menuOpen}`; links leave tab/AT order when closed (verified in `TopNav.tsx:116`). (My DOM height heuristic falsely flagged it — `inert` doesn't change tabIndex; the fix is correct.)
- **S36** distinct landmark labels (desktop `nav.primary`, mobile panel `nav.menu`).
- **U02** mobile KPI sparkline — now stacks on its own full-width row beneath the delta; renders cleanly at 375px.
- **U09** Skills hero now ends in a period ("…ASKING FOR.").
- **M7** geography per-capita carries the fixed-2024-LF caveat.
- **M4/M6** skills lede + wage charts carry coverage disclosure.

## Candidate findings observed live (hand-offs to the fan-out + synthesis)
1. **Year-picker `<select>` unlabeled for AT** — `TunableFigure.tsx:90,100,109` (11 selects on occupations, + skills/geo/industries). The visible "Base/From/To" `<span>`s are not associated; `aria-label` sits on a roleless `<div>`. Screen reader hears bare comboboxes. NEW in HEAD. (Explore builder selects ARE properly labeled — `label[for]` — so this is TunableFigure-specific.)
2. **i18n leak — filter sentinel values English in FR.** FilterSpine shows "All Canada / All occupations / All industries" under FR (`options.ts:3-5,15,31,46` hardcoded). Visible on the Explore page in FR.
3. **i18n leak — breakdown category labels English in FR.** Explore bar chart shows "Sales and service occupations" etc. in FR (`explore.py:_pretty` → splits `code | label`, no FR map). **Systemic:** the curated occupations treemap also returns English short labels in FR ('Business & finance', 'Health', …). Provinces *are* localized (`core.PROVINCE_NAMES`). So occupation/industry group names leak English across the whole FR surface.
4. **Duplicate "Rural area not in a CMA/CA" bars** in `geography.cma_demand` — two separate bars, same label (40,667 and 54,266). Confusing; reads as a data/labeling defect.
5. **"Unknown" prominence** — occupations treemap "Unknown" 110,651 / 18% is the 2nd-largest tile, uncaptioned (prior U06, still present). geography CMA chart shows "Unknown market" (60,349) competing with real CMAs.
6. **U05** Explore hero — the FilterSpine still sits *above* the hero (eyebrow/headline/lede), diverging from the shared page template. (Recheck whether intended.)
7. ~~**U07** no dark mode~~ — **REFUTED on re-read.** The app stays cream under `prefers-color-scheme: dark`, but light-only is intentional and documented in `globals.css`, and there is **no** `aclmr_dark` template (full-text search returns zero — `theme.py` registers only `aclmr_light`). My initial "ships unused dark tokens" note was carried over from the prior audit and is wrong. Not a finding.
8. **Out-of-range `base_year`** (e.g. 1990) on a curated figure → silent empty chart (0 traces). Not reachable via the bounded UI dropdown; direct-URL only. LOW/edge.

## Coverage gaps
- **Find Postings (private posting lookup)** not exercisable locally: auth secret not configured → AuthGate shows a clean "Access control isn't configured on this server" message (graceful). Reviewed from source only.
- Dark mode + mobile spot-checked on home + explore, not exhaustively per page.
- Screenshot scroll-desync quirk → lower-fold chart *craft* judged from tall-viewport shots + DOM, not per-scroll screenshots.
