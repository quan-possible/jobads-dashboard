# Job: researcher viz redesign — same richness, better economics

Status: ACTIVE / PLAN. No code changed yet.
Date opened: 2026-06-21. Worktree: `redesign2`.
Supersedes the count-cutting framing in
[`2026-06-21-labor-econ-dashboard-design/job.md`](../2026-06-21-labor-econ-dashboard-design/job.md)
(that doc explored external StatCan joins + a ~14-plot minimal set — both
rejected by the owner: too deep, too few). Keep its research provenance; ignore
its "cut to 14" conclusion.

## Goal

Make the **researcher tier** of the dashboard read as built by people who
understand economics — authoritative, professional, grounded in real researcher
needs — **without losing the beauty, richness, or plot count it has now**. The
public Core is already good and is out of scope.

## Requirements (the bar)

Every plot must be all four:
1. **Beautiful** — keep the current visual quality, animation, editorial frame.
2. **Intuitive** — readable without a methods footnote; plain economic titles, no
   data-viz jargon ("robust z of remainder" is the anti-pattern).
3. **Rich** — multi-dimensional, animated through time where it reveals structure.
4. **Informed/refined by economics standards** — each panel answers a real
   question a labour researcher has; official classifications; honest caveats.

## Hard constraints

- **Keep the same layout/design system** (Next.js `web/` + figure-JSON bridge +
  Python Plotly factories; `aclmr_light` theme; Core→Deep; editorial `<Figure>`).
- **Keep roughly the same plot count (~38).** This is a content swap, not a purge.
  Remove a weak plot → add an equally rich, grounded one in its place.
- **Descriptive, structure-revealing** — show the structure of the data, not
  tests of specific hypotheses.
- **Postings data only.** No external StatCan/CPI/JVWS joins (no Beveridge,
  tightness, wage curve, monopsony — all ruled too deep).
- **AI-exposure is the deepest we go.** It needs a skill/occupation → exposure
  crosswalk = a NEW derived table. Upstream pipeline is off-limits to dashboard
  logic, so this is a flagged data dependency, not a self-serve build.
- **No causal language.** Keep "demand signal, not employment" + coverage/sparse
  caveats visible but understated.

## Governing principle

Restraint lives in **content judgment, not in count or richness.** A crowded grid
of grounded, structure-revealing plots reads as expert; a crowded grid of clever
techniques reads as "a kid who can code but doesn't know economics." So we keep
the rich grid and raise the economics quality of what fills it.

## The test for each plot

"Does this reveal a general, important feature of labour demand that a researcher
finds informative regardless of their specific question?"
- Yes → keep / make richer.
- It's a niche concept presented as a headline (LQ, HHI) → demote to an option.
- It's redundant with a better panel, or jargon-y → replace with a grounded view.

## Remove → Replace (count-neutral)

Reason is redundancy / jargon / niche-as-headline — NOT "it's a hypothesis"
(several are legitimately descriptive; they just don't earn a headline slot).

| Remove | Why | Replace in the same slot with |
|---|---|---|
| anomaly_flags | "robust z of remainder" jargon; COVID already obvious | occupation-trend small-multiples (rich overview) |
| sa_vs_nsa | lines coincide → seasonality is a footnote | demand momentum (accel/decel) |
| stl_panel | redundant once trend + a seasonal view are kept | wage/requirement premium (skills↔wages) |
| cycle_plot | cluttered; overlaps seasonality heatmap | AI-skill diffusion over time |
| lq_choropleth, lq_heatmap, province_tile_grid | one geography shown 4 ways | one authoritative map (measure toggle) + CMA/city view + AI-exposure map |
| bump_chart | rank flourish, redundant with indexed trends | AI-exposure × demand scatter |
| concentration_trio (Lorenz/Gini/HHI) | niche indices as headline | "skills rising vs falling" churn view |
| horizon_wall | blocked (needs upstream fine-NOC rollup) | (slot reused above) |

## Modify (keep, but reframe/clean)

- **LQ** → a measure option on the main map (count / share / per-capita / LQ), not
  its own panels. Legit regional economics, just not a headline.
- **Skills "lift vs national"** → "most-demanded skills and their trend"; keep lift
  as a secondary measure.
- **Diffusion index** → smooth the jagged step rendering.
- **Seasonality** → keep the month×year heatmap; drop the small-multiples cycle.
- **Shift-share** → keep (descriptive decomposition) but label it a *secondary*
  geography cut, not a headline.
- **All panels** → plain economic titles; official NOC 2021 / NAICS / province
  labels; one index baseline; one colour language; quiet provenance tag; keep the
  time animation (it's a strength).

## Add (deliberately few)

- **AI-exposure** layer (the differentiator, the ceiling), using **Eloundou et al.
  "GPTs are GPTs" β exposure**: exposure × demand scatter + province exposure map.
  Built from a static, public-data reference asset WE construct (not corpus-derived,
  not owner-blocked). AI-skill diffusion is deferred (needs a skill-label table).
- **Wage/requirement premium**: does demanding a skill or a degree come with higher
  posted pay. *Feasible-ish from wage cube + requirements; may need a derived join.*

## Target plot set (~38) — working v1, by page

Tags: **E** existing derived data · **D** needs new derived table · **R** reframe of
an existing plot.

### Overview / Pulse — demand over time (~7)
1. Demand trend, indexed + COVID shading (E, keep)
2. YoY growth bars (E, keep)
3. Breadth of growth / diffusion (E, keep + smooth)
4. Seasonality heatmap, month×year (E, keep)
5. Composition over time — occupation mix area (E, keep)
6. Occupation-trend small-multiples / sparkline grid (E, new) ← replaces anomaly
7. Demand momentum, 3-mo vs 12-mo (E, new) ← replaces SA/NSA

### Occupations (~8)
8. Animated treemap, composition scrubbing by year (E, keep)
9. Indexed trend lines, 2019=100 (E, keep)
10. Contribution-to-growth bars (E, keep)
11. Contribution waterfall (E, keep)
12. Then-vs-now dumbbell over the decade (E, keep)
13. Occupation × industry heatmap (E, keep)
14. AI-exposure × demand scatter (D, new)
15. Skills rising vs falling — churn (E, new) ← replaces bump/concentration

### Industries (~5)
16. Animated treemap (E, keep)
17. Share over time (E, keep)
18. Contribution bars (E, keep)
19. Industry × wage level or industry × occupation (E, new/rich)
20. NAICS coding coverage line (E, keep — or appendix)

### Geography (~7)
21. Authoritative animated choropleth, measure toggle count/share/per-capita/LQ (E, R) ← consolidates share/lq/tile
22. Ranked provinces bars (E, keep)
23. YoY momentum map, animated (E, keep)
24. CMA / city-level view — uses `monthly_by_market` (E, new/rich)
25. Shift-share decomposition — secondary (E, keep/relabel)
26. AI-exposure by province/region map (D, new)

### Pay & conditions (~6)
27. Wage distribution band p25/median/p75 over time (E, keep)
28. Wage by occupation, ranked/dumbbell (E, keep)
29. Wage by geography (E, keep/rich)
30. Conditions mix — remote/hybrid, employment type over time (E, keep)
31. Wage/requirement premium (D-light, new)
32. Language requirement mix — Canadian relevance, secondary (E, keep)

### Skills & requirements (~5)
33. Top skills & trends (E, R) ← replaces "lift vs national" framing
34. Education composition over time (E, keep)
35. Experience mix over time (E, keep)
36. AI-skill diffusion over time (E, new)
37. Skill × occupation heatmap — what each occupation demands (E, new/rich)

### Methods & coverage appendix (~1–2)
38. Field-coverage lines + latest-coverage bars (E, keep — tucked away)

## Feasibility summary

- **Most of the set is E** — existing derived parquet, buildable now via the
  figure-JSON bridge already in place.
- **D, but WE build it (no owner needed):** AI-exposure (#14, #26). The Eloundou
  score is a static reference asset built once by `tools/build_ai_exposure.py` from
  public data — like the committed geojson, not a corpus product. See
  `implementation.md` §2A for the full crosswalk pipeline.
- **D, true upstream dependency (waits on the corpus team):** the conditioned wage
  premium (#31, needs `monthly_wage_by_education`), and AI-skill diffusion (needs a
  skill-label table). Wave-1 proxies ship for the premium meanwhile.
- City/CMA geography (#24) is a NEW use of `monthly_by_market` (already present) —
  finer than province, no new data needed.

## Open questions / risks

- **Conditioned wage premium + AI-skill diffusion** are the only true owner
  dependencies (a wage×education corpus cut; a skill-label table). AI-exposure itself
  is NOT owner-blocked — we build the static Eloundou asset.
- **Coverage break?** Check the 2016–2026 series for a vendor/scrape discontinuity
  before shipping any long trend; mark it if present.
- **Exact final count** — v1 lands ~38; trim/merge during build to match the
  current layout rhythm.

## Status / next steps

File-level build map written: [`implementation.md`](implementation.md) — the four
seams (compute → datasource → factory → registry+web/i18n), a 6-step per-plot
checklist, per-plot specs with code skeletons, Wave 1 (existing data) vs Wave 2
(needs a new derived table), and pre-build checks.

1. Owner review of this target set (which of #6, #7, #14, #24, #31, #33, #36, #37
   to greenlight; AI-exposure crosswalk ownership).
2. Wave 1 (all E, no dependencies): reframe LQ→toggle, swap the 4 Pulse
   decompositions, consolidate the geography maps, add small-multiples + momentum +
   skill churn + skill×occupation. Pure front-of-house quality lift.
3. Wave 2 (D): AI-exposure layer once the crosswalk exists; wage premium.

## Provenance

Converged over a design conversation on 2026-06-21 grounded in three research
briefs (reference dashboards; economics canon; Canadian data) — see the superseded
design doc for citations. Owner steer: keep richness + count + layout; drop
external-data depth; AI-exposure is the ceiling; restraint = content judgment, not
fewer plots.
